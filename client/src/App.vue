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
import ColorReplacePipelinePlugin from "phaser3-rex-plugins/plugins/colorreplacepipeline-plugin.js";
import gameConfig from "@/config/gameConfig.js";
import visibilityManager from "./phaser/managers/VisibilityManager.js";

export default {
  data() {
    return {
      gamePhaser: null,
      loading: false,
      isAuthenticated: false, // Nueva bandera de autenticación
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
      this.gamePhaser.events.once("globalPreloaderComplete", () => {
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
      // Socket.IO puede reconectarse sin recargar HTML5. El emulador guarda
      // la autenticación y la sala en el socket anterior: al perderlo, volver
      // a la pantalla de acceso para recuperar la sesión mediante JWT.
      this.isAuthenticated = false;
      this.loading = false;
      socket.user = null;
      if (this.gamePhaser) {
        this.gamePhaser.destroy(true);
        this.gamePhaser = null;
      }
      // AuthScreen/LoginForm realiza JWT_AUTO_LOGIN en cuanto vuelve el socket.
      // No borrar el JWT por una desconexión temporal.
    },
    handleCriticalError() {
      // Evita el bucle de reingreso automático si el servidor expulsa la sesión.
      localStorage.removeItem("app_jwt");
      this.handleDisconnect();
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

    // Detectar reconexión


    socket.on("error_critical", this.handleCriticalError);

    // Inicializar auto-escalado del juego
    this.rescaleGame();
    window.addEventListener("resize", this.rescaleGame);
  },
  beforeUnmount() {
    // Remover listeners de socket para evitar fugas de memoria
    socket.off("disconnect", this.handleDisconnect);
    socket.off("error_critical", this.handleCriticalError);
    
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
