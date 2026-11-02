<template>
  <div class="game-screens">
    <LobbyScreen
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
    handleMinigameJoin(response) {
      if (!response?.success) return;
      earlyEventBuffer.activate();
      this.onJoinMinigameScene(response.sceneType, response.data);
    },
    handleMinigameNotification() {
      this.showMinigameNotification = true;
    },
    handleJoinPublicResponse(response) {
      if (!response?.success) return;
      earlyEventBuffer.activate();
      const sceneryType = response.data.scenery.type;
      this.onJoinPublicScene(sceneryType, response.data);
    },
    handleJoinIslandResponse(response) {
      if (response?.island) this.onJoinIsland(response.island);
    },
    handleJoinPrivateResponse(response) {
      if (!response?.success) return;
      earlyEventBuffer.activate();
      this.onJoinPrivateScene(response.data.scenery.type, response.data);
    },
    handleJoinPrivateError(response) {
      console.error("Error al unirse a la sala privada:", response);
      alert("Error al unirse a la sala privada. Inténtalo nuevamente.");
    },
    handleIslandNotFound() {
      this.showIslandErrorAlert = true;
      this.islandErrorMessage = this.$t('island.error_island_not_found');
    },
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
    // Las suscripciones del router pertenecen a esta instancia; no se deben
    // borrar handlers de otros sistemas con socket.off(event).
    this.socketRouteHandlers = [
      [ResponseSocketsEnum.MINIGAME_JOIN, this.handleMinigameJoin],
      [ResponseSocketsEnum.MINIGAME_CALL_NOTIFICATION, this.handleMinigameNotification],
      [ResponseSocketsEnum.JOIN_PUBLIC_SCENE, this.handleJoinPublicResponse],
      [ResponseSocketsEnum.JOIN_ISLAND, this.handleJoinIslandResponse],
      [ResponseSocketsEnum.JOIN_PRIVATE_SCENE, this.handleJoinPrivateResponse],
      [ResponseSocketsEnum.JOIN_PRIVATE_SCENE_ERROR, this.handleJoinPrivateError],
      [ResponseSocketsEnum.ERROR_ISLAND_NOT_FOUND, this.handleIslandNotFound],
    ];
    for (const [event, handler] of this.socketRouteHandlers) socket.on(event, handler);
  },
  beforeUnmount() {
    for (const [event, handler] of this.socketRouteHandlers || []) {
      socket.off(event, handler);
    }
    this.socketRouteHandlers = [];
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
