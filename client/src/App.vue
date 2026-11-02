<template>
  <div id="game-container">
    <div id="game">
      <div id="phaser-container"></div>
      <LoadingScreen v-if="loading" />
      <div id="game-screens">
        <AuthScreen
          v-if="!isAuthenticated"
          @loginSuccess="onLoginSuccess"
          @registerSuccess="onRegisterSuccess"
          @goToRegister="onGoToRegister"
        />
        <GameScreens
          ref="gameScreens"
          v-else
          :gamePhaser="gamePhaser"
          @updateLoading="onUpdateLoading"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Phaser from "phaser";
import { defineAsyncComponent } from "vue";
import socket from "./sockets/socket";
import GameScreensEnum from "./enums/GameScreensEnum";
import RequestSocketsEnum from "./enums/RequestSocketsEnum";
import ResponseSocketsEnum from "./enums/ResponseSocketsEnum";
import ColorReplacePipelinePlugin from "phaser3-rex-plugins/plugins/colorreplacepipeline-plugin.js";
import gameConfig from "@/config/gameConfig.js";
import visibilityManager from "./phaser/managers/VisibilityManager.js";

export default {
  data() {
    return {
      gamePhaser: null,
      loading: false,
      isAuthenticated: false, // Nueva bandera de autenticación
      reconnectPending: false, // Se perdió una sesión autenticada, no reiniciar página
    };
  },
  created() {
    //setInterval(() => {
    //  console.log("Eventos registrados:", socket._callbacks);
    //}, 5000);
    //console.log("Server URL:", import.meta.env.VITE_SERVER_URL);
  },
  components: {
    LoadingScreen: defineAsyncComponent(() =>
      import("./views/screens/game/LoadingScreen.vue")
    ),
    AuthScreen: defineAsyncComponent(() =>
      import("./views/screens/auth/AuthScreen.vue")
    ),
    GameScreens: defineAsyncComponent(() =>
      import("./views/screens/game/GameScreens.vue")
    ),
  },
  methods: {
    onGoToLogin() {
      this.currentScreen = GameScreensEnum.LOGIN;
    },
    onGoToRegister() {
      this.currentScreen = GameScreensEnum.REGISTER;
    },
    async onRegisterSuccess() {
      this.onLoginSuccess();
    },
    async onLoginSuccess() {
      this.onUpdateLoading(true);
      
      const { default: GamePreloaders } = await import(
        "./phaser/preloaders/GamePreloaders"
      );
      GamePreloaders.main();
      if (!this.gamePhaser) {
        await this.initializePhaser();
      }
      // Esperar a que termine la precarga antes de cambiar a LOBBY
      this.gamePhaser.events.on("globalPreloaderComplete", () => {
        this.isAuthenticated = true; // Activa GameScreens
        this.onUpdateLoading(false);
      });
    },
    async initializePhaser() {
      const { default: GlobalPreloader } = await import(
        "./phaser/GlobalPreloader"
      );
      const { default: PublicScene } = await import("./phaser/PublicScene");
      const { default: PrivateScene } = await import("./phaser/PrivateScene");
      const { default: MinigameScene } = await import("./phaser/MinigameScene");
      // Solo creas la instancia la primera vez.
      let phaserType = Phaser.AUTO;
      switch (socket.user.phaser_rendering_type) {
        case "webgl":
          phaserType = Phaser.WEBGL;
          break;
        case "canvas":
          phaserType = Phaser.CANVAS;
          break;
        default:
          phaserType = Phaser.AUTO;
      }

      this.gamePhaser = new Phaser.Game({
        type: phaserType,
        powerPreference: socket.user.phaser_power_preference || "default", // "high-performance", "low-power", "default"
        antialias: socket.user.phaser_antialias ? true : false, // Desactiva si no necesitas suavizado
        antialiasGL: socket.user.phaser_antialias_gl ? true : false, // Desactiva si no necesitas suavizado en WebGL
        roundPixels: socket.user.phaser_round_pixels ? true : false, // Reduce cálculos de subpíxeles
        pixelArt: socket.user.phaser_pixel_art ? true : false, // Esencial para evitar el antialiasing que causa el blur
        width: gameConfig.GAME_WIDTH,
        height: gameConfig.GAME_HEIGHT,
        // Registras todas las escenas globales que vayas a usar
        scene: [GlobalPreloader, PublicScene, PrivateScene, MinigameScene],
        plugins: {
          global: [
            {
              key: "rexColorReplacePipeline",
              plugin: ColorReplacePipelinePlugin,
              start: false,
            },
          ],
        },
        resolution: window.devicePixelRatio || 1,
        parent: "phaser-container",
        dom: {
          createContainer: true,
        },
        physics: {
          default: "arcade",
        },
        fps: {
          min: 30,
          target: 60,
          forceSetTimeOut: true, // Mantiene el juego corriendo aunque pierda foco
        },
        autoFocus: true,
        callbacks: {
          postBoot: function (game) {
            game.events.off("hidden", game.renderer.onHidden, game.renderer);
            game.events.off("visible", game.renderer.onVisible, game.renderer);
            game.scene.getScenes(true).forEach((s) => {
              if (s.cameras?.main) s.cameras.main.roundPixels = true;
            });
          },
        },
      });
      
      // Configurar el VisibilityManager con la instancia de Phaser
      visibilityManager.setGame(this.gamePhaser);
      
      // Hacer gameConfig y visibilityManager disponibles globalmente
      window.gameConfig = gameConfig;
      window.socket = socket;
      window.visibilityManager = visibilityManager;
      
      // Lanzamos la escena de Preloader para que cargue todo
      this.gamePhaser.scene.start("GlobalPreloaderScene");

      this.gamePhaser.scale.resize(gameConfig.GAME_WIDTH * gameConfig.DPI, gameConfig.GAME_HEIGHT * gameConfig.DPI);
      this.gamePhaser.canvas.style.width = gameConfig.GAME_WIDTH + "px";
      this.gamePhaser.canvas.style.height = gameConfig.GAME_HEIGHT + "px";
    },
    handleDisconnect() {
      if (!this.isAuthenticated) return;
      // Socket.IO crea una conexión nueva: los datos de sesión y de sala anteriores
      // ya no son autoritativos. Bloquear controles mientras se recupera el JWT.
      this.reconnectPending = true;
      this.onUpdateLoading(true);
      for (const scene of this.gamePhaser?.scene?.getScenes(true) || []) {
        if (scene.input) scene.input.enabled = false;
      }
    },
    handleReconnect() {
      if (!this.reconnectPending || !this.isAuthenticated) return;
      const jwt = localStorage.getItem("app_jwt");
      if (!jwt) {
        this.resetSessionWithoutReload();
        return;
      }
      socket.emit(RequestSocketsEnum.JWT_AUTO_LOGIN, { authJwt: jwt });
    },
    handleSessionRestored(data) {
      if (!this.reconnectPending || !this.isAuthenticated) return;
      if (!data?.user) {
        this.resetSessionWithoutReload();
        return;
      }
      socket.user = data.user;
      if (data.user.authJwt) {
        localStorage.setItem("app_jwt", data.user.authJwt);
      }
      this.reconnectPending = false;
      // Las salas del socket anterior ya no existen para esta conexión.
      // Salir al lobby EN LA MISMA página y solicitar datos frescos.
      this.$refs.gameScreens?.onExitLobby();
      this.onUpdateLoading(false);
    },
    handleSessionInvalid() {
      if (!this.reconnectPending) return;
      localStorage.removeItem("app_jwt");
      this.resetSessionWithoutReload();
    },
    resetSessionWithoutReload() {
      this.reconnectPending = false;
      if (this.gamePhaser) {
        this.gamePhaser.destroy(true);
        this.gamePhaser = null;
      }
      socket.user = null;
      this.isAuthenticated = false;
      this.onUpdateLoading(false);
    },
    handleCriticalSessionError() {
      localStorage.removeItem("app_jwt");
      this.resetSessionWithoutReload();
    },
    onUpdateLoading(value) {
      this.loading = value;
      
      // Si se está quitando el loading (value = false), sincronizar posiciones
      if (!value && window.visibilityManager && this.gamePhaser) {
        setTimeout(() => {
          window.visibilityManager.syncAllScenes();
        }, 100); // Delay para asegurar que la escena esté completamente renderizada
      }
    },
    rescaleGame() {
      // Si estamos dentro de un iframe, no escalamos (lo hace el padre)
      if (window.self !== window.top) {
        return;
      }

      const baseWidth = gameConfig.GAME_WIDTH;
      const baseHeight = gameConfig.GAME_HEIGHT;

      const scaleX = window.innerWidth / baseWidth;
      const scaleY = window.innerHeight / baseHeight;

      // Usa el menor para que siempre quepa sin salirse, máximo 1 (tamaño original)
      const scale = Math.min(scaleX, scaleY, 1);

      const gameElement = document.getElementById("game");
      if (gameElement) {
        gameElement.style.transform = `scale(${scale})`;
      }
    },
  },
  mounted() {
    // Detectar desconexión del socket
    socket.on("disconnect", this.handleDisconnect);

    // Recuperar la sesión sin destruir la página ni reutilizar el estado antiguo.
    socket.on("connect", this.handleReconnect);
    socket.on(ResponseSocketsEnum.LOGIN_SUCCESS, this.handleSessionRestored);
    socket.on(ResponseSocketsEnum.JWT_AUTO_LOGIN_INVALID, this.handleSessionInvalid);
    socket.on("error_critical", this.handleCriticalSessionError);

    // Inicializar auto-escalado del juego
    this.rescaleGame();
    window.addEventListener("resize", this.rescaleGame);
  },
  beforeUnmount() {
    // Remover listeners de socket para evitar fugas de memoria
    socket.off("disconnect", this.handleDisconnect);
    socket.off("connect", this.handleReconnect);
    socket.off(ResponseSocketsEnum.LOGIN_SUCCESS, this.handleSessionRestored);
    socket.off(ResponseSocketsEnum.JWT_AUTO_LOGIN_INVALID, this.handleSessionInvalid);
    socket.off("error_critical", this.handleCriticalSessionError);
    
    // Remover listener de resize
    window.removeEventListener("resize", this.rescaleGame);
  },
};
</script>

<style>
#game-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #000;
}

#game {
  width: 1012px;
  height: 657px;
  position: relative;
  overflow: hidden;
  transform-origin: top left;
}

#phaser-container {
  width: 1012px;
  height: 657px;
  margin: auto;
  position: absolute;
  background-color: transparent; /* Para verificar visualmente */
  z-index: 0;
}

#game-screens {
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1;
  overflow: hidden;
  -webkit-user-select: none; /* Safari */
  -ms-user-select: none; /* IE 10 and IE 11 */
  user-select: none; /* Standard syntax */
  pointer-events: none;
}
</style>
