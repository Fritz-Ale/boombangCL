<template>
  <div class="game-screens">
    <LobbyScreen
      :key="lobbyRefreshKey"
      v-if="currentScreen === GameScreensEnum.LOBBY"
      @joinPublicScene="onJoinPublicScene"
      @updateLoading="onUpdateLoading"
      @createIsland="onCreateIsland"
      :showIslandError="showIslandErrorAlert"
      :islandErrorMessage="islandErrorMessage"
      @closeIslandError="handleCloseIslandError"
    />
    <PublicSceneScreen
      v-else-if="currentScreen === GameScreensEnum.PUBLIC_SCENE"
      :sceneType="currentScreenType"
      :sceneData="sceneData"
      @exitLobby="onExitLobby"
      @updateLoading="onUpdateLoading"
    />
    <PrivateSceneScreen
      v-else-if="currentScreen === GameScreensEnum.PRIVATE_SCENE"
      :sceneType="currentScreenType"
      :sceneData="sceneData"
      @updateLoading="onUpdateLoading"
      @joinIsland="onJoinIsland"
      @exitLobby="onExitLobby"
    />
    <GameSceneScreen
      v-else-if="currentScreen === GameScreensEnum.GAME_SCENE"
      :sceneType="currentScreenType"
      :sceneData="sceneData"
      @exitLobby="onExitLobby"
      @updateLoading="onUpdateLoading"
    />
    <MinigameSceneScreen
      v-else-if="currentScreen === GameScreensEnum.MINIGAME_SCENE"
      :sceneType="currentScreenType"
      :sceneData="sceneData"
      @exitLobby="onExitLobby"
      @updateLoading="onUpdateLoading"
    />
    <IslandCreateScreen
      v-else-if="currentScreen === GameScreensEnum.ISLAND_CREATE"
      @updateLoading="onUpdateLoading"
      @exitLobby="onExitLobby"
    />
    <IslandScreen
      v-else-if="currentScreen === GameScreensEnum.ISLAND"
      :sceneData="sceneData"
      @exitLobby="onExitLobby"
      @updateLoading="onUpdateLoading"
      @createIslandScene="onCreateIslandScene"
    />
    <IslandSceneCreateScreen
      v-else-if="currentScreen === GameScreensEnum.ISLAND_SCENE_CREATE"
      :sceneData="sceneData"
      @joinIsland="onJoinIsland"
      @updateLoading="onUpdateLoading"
    />
    <NotificationMinigameComponent
      v-if="showMinigameNotification"
      @close="showMinigameNotification = false"
    />
  </div>
</template>

<script>
import { defineAsyncComponent } from "vue";
import GameScreensEnum from "../../../enums/GameScreensEnum";
import socket from "../../../sockets/socket.js";
import createSocketSubscriptions from "../../../utils/createSocketSubscriptions.js";
import ResponseSocketsEnum from "../../../enums/ResponseSocketsEnum";
import MenuTypeEnum from "../../../enums/MenuTypeEnum";
import earlyEventBuffer from "../../../utils/EarlyEventBuffer.js";

export default {
  props: {
    gamePhaser: Object, // Recibe la instancia de Phaser desde App.vue
  },
  data() {
    return {
      currentScreen: GameScreensEnum.LOBBY,
      currentScreenType: null,
      sceneData: null,
      GameScreensEnum,
      showMinigameNotification: false,
      lobbyRefreshKey: 0,
      showIslandErrorAlert: false,
      islandErrorMessage: '',
    };
  },
  components: {
    LobbyScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/LobbyScreen.vue")
    ),
    PublicSceneScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/scenes/PublicSceneScreen.vue")
    ),
    PrivateSceneScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/scenes/PrivateSceneScreen.vue")
    ),
    GameSceneScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/scenes/GameSceneScreen.vue")
    ),
    MinigameSceneScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/scenes/MinigameSceneScreen.vue")
    ),
    IslandCreateScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/island/IslandCreateScreen.vue")
    ),
    IslandScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/island/IslandScreen.vue")
    ),
    IslandSceneCreateScreen: defineAsyncComponent(() =>
      import("../../../views/screens/game/island/IslandSceneCreateScreen.vue")
    ),
    NotificationMinigameComponent: defineAsyncComponent(() =>
      import("../../components/interface/NotificationMinigameComponent.vue")
    ),
  },
  methods: {
    onJoinPublicScene(sceneType, sceneData) {
      this.sceneData = sceneData;
      this.currentScreenType = sceneType;
      this.currentScreen =
        sceneData.scenery.menu_type == MenuTypeEnum.PUBLIC_SCENE
          ? GameScreensEnum.PUBLIC_SCENE
          : GameScreensEnum.GAME_SCENE;
    },
    onExitLobby() {
      this.resetPhaser();
      this.lobbyRefreshKey++;
      this.sceneData = null;
      this.currentScreen = GameScreensEnum.LOBBY;
      this.currentScreenType = null;
    },
    onUpdateLoading(value) {
      this.$emit("updateLoading", value); // Propaga el evento a App.vue
    },
    onJoinMinigameScene(sceneType, sceneData) {
      this.sceneData = sceneData;
      this.currentScreenType = sceneType;
      this.currentScreen = GameScreensEnum.MINIGAME_SCENE;
    },
    onJoinPrivateScene(sceneType, sceneData) {
      this.sceneData = sceneData;
      this.currentScreenType = sceneType;
      this.currentScreen = GameScreensEnum.PRIVATE_SCENE;
    },
    // Nuevo método para manejar creación de islas
    onCreateIsland() {
      this.currentScreen = GameScreensEnum.ISLAND_CREATE;
    },
    // Método para manejar la creación de una escena en una isla
    onCreateIslandScene(islandData) {
      this.sceneData = islandData;
      this.currentScreen = GameScreensEnum.ISLAND_SCENE_CREATE;
    },
    onJoinIsland(sceneData) {
      this.resetPhaser();
      this.sceneData = sceneData;
      this.currentScreen = GameScreensEnum.ISLAND;
    },
    resetPhaser() {
      if (this.gamePhaser) {
        this.gamePhaser.scene.stop("PublicScene");
        this.gamePhaser.scene.stop("PrivateScene");
        this.gamePhaser.scene.stop("MinigameScene");
      }
    },
    handleCloseIslandError() {
      this.showIslandErrorAlert = false;
      this.islandErrorMessage = '';
    },
  },
  mounted() {
    this.gameSocketSubscriptions = createSocketSubscriptions(socket);
    this.gameSocketSubscriptions.on(ResponseSocketsEnum.MINIGAME_JOIN, (response) => {
      if (response.success) {
        // Activar el buffer INMEDIATAMENTE para capturar eventos tempranos
        earlyEventBuffer.activate();
        
        this.onJoinMinigameScene(response.sceneType, response.data);
      } else {
        if (import.meta.env.VITE_APP_ENV === "local") {
          console.log("Error al unirse a la sala.");
        }
      }
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.MINIGAME_CALL_NOTIFICATION, () => {
      this.showMinigameNotification = true;
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.JOIN_PUBLIC_SCENE, (response) => {
      if (response.success) {
        // Activar el buffer INMEDIATAMENTE para capturar eventos tempranos
        earlyEventBuffer.activate();
        
        let sceneryType = response.data.scenery.type;
        this.onJoinPublicScene(sceneryType, response.data);
      } else {
        if (import.meta.env.VITE_APP_ENV === "local") {
          console.log("Error al unirse a la sala.");
        }
      }
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.JOIN_ISLAND, (response) => {
      this.onJoinIsland(response.island);
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.JOIN_PRIVATE_SCENE, (response) => {
      if (response.success) {
        // Activar el buffer INMEDIATAMENTE para capturar eventos tempranos
        earlyEventBuffer.activate();
        
        let sceneryType = response.data.scenery.type;
        this.onJoinPrivateScene(sceneryType, response.data);
      } else {
        if (import.meta.env.VITE_APP_ENV === "local") {
          console.log("Error al unirse a la sala privada.");
        }
      }
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.JOIN_PRIVATE_SCENE_ERROR, (response) => {
      console.error("Error al unirse a la sala privada:", response);
      alert(
        "Error al unirse a la sala privada. Por favor, inténtalo de nuevo."
      );
    });

    this.gameSocketSubscriptions.on(ResponseSocketsEnum.ERROR_ISLAND_NOT_FOUND, () => {
      this.showIslandErrorAlert = true;
      this.islandErrorMessage = this.$t('island.error_island_not_found');
    });
  },
  beforeUnmount() {
    this.gameSocketSubscriptions?.dispose();
  },
};
</script>

<style>
.game-screens {
  height: 100%;
  width: 100%;
  position: relative;
}
</style>
