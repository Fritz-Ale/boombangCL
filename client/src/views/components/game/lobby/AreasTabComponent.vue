<template>
  <div class="lobby__scenes-tab">
    <div class="scene-tools">
      <label class="visually-hidden" for="area-buscar">Buscar área pública</label>
      <input id="area-buscar" v-model.trim="searchTerm" type="search" placeholder="Buscar sala..." autocomplete="off" maxlength="80" />
      <label class="visually-hidden" for="area-ordenar">Ordenar áreas</label>
      <select id="area-ordenar" v-model="sortBy" aria-label="Ordenar áreas">
        <option value="popular">Más visitadas</option>
        <option value="nombre">Nombre A-Z</option>
      </select>
    </div>
    <p v-if="joinError" class="join-error" role="alert">{{ joinError }}</p>
    <div class="lobby__scenes-list" ref="scrollContainer" :aria-busy="isJoining">
      <SpinnerComponent v-if="isLoading" />
      <p v-else-if="!filteredScenes.length" class="no-scenes" role="status">No encontramos salas con ese nombre.</p>
      <div v-else v-for="publicScene in filteredScenes" :key="publicScene.uuid" class="scene-item">
        <button
          @click="handleClick(publicScene.uuid, MenuTypeEnum.PUBLIC_SCENE)"
          :disabled="isJoining"
        >
          <span class="scene-name">{{ publicScene.name }}</span>
          <span class="user-count">{{ publicScene.total_users_in }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import MenuTypeEnum from "../../../../enums/MenuTypeEnum";
import { useOverlayScrollbars } from '@/composables/useOverlayScrollbars';
import SpinnerComponent from '../../common/SpinnerComponent.vue';
import 'overlayscrollbars/overlayscrollbars.css';

export default {
  components: {
    SpinnerComponent,
  },
  props: {
    publicScenes: {
      type: Array,
      default: null,
    },
  },
  data() {
    return {
      MenuTypeEnum,
      isJoining: false,
      joinTimer: null,
      joinError: "",
      searchTerm: "",
      sortBy: "popular",
    };
  },
  computed: {
    isLoading() {
      return this.publicScenes === null;
    },
    filteredScenes() {
      const source = Array.isArray(this.publicScenes) ? this.publicScenes : [];
      const normalize = value => String(value ?? "").normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-CL");
      const search = normalize(this.searchTerm);
      const list = source.filter(scene => normalize(scene.name).includes(search));
      return list.sort((a, b) => {
        if (this.sortBy === "nombre") {
          return String(a.name ?? "").localeCompare(String(b.name ?? ""), "es-CL");
        }
        const countA = Number(a.total_users_in) || 0;
        const countB = Number(b.total_users_in) || 0;
        return countB - countA ||
          String(a.name ?? "").localeCompare(String(b.name ?? ""), "es-CL");
      });
    },
  },
  mounted() {
    const { initScrollbars } = useOverlayScrollbars();
    initScrollbars(this.$refs.scrollContainer);
  },
  beforeUnmount() {
    clearTimeout(this.joinTimer);
  },
  methods: {
    resetJoining(message = "") {
      clearTimeout(this.joinTimer);
      this.joinTimer = null;
      this.isJoining = false;
      this.joinError = message;
    },
    handleClick(sceneUuid, menuType) {
      if (this.isJoining) return;
      this.joinError = "";
      this.isJoining = true;
      // Si Socket.IO nunca responde, el usuario debe poder reintentar.
      this.joinTimer = setTimeout(() => {
        this.resetJoining("La sala no respondió. Revisa tu conexión e inténtalo otra vez.");
      }, 10000);
      this.$emit("join-scene", sceneUuid, menuType);
    },
  },
};
</script>

<style scoped>
.scene-tools{display:flex;gap:5px;flex-direction:column;margin-bottom:7px}
.scene-tools input,.scene-tools select{min-width:0;width:100%;background:#f4fbff;color:#1a3949;border:1px solid #79a9b8;border-radius:6px;padding:6px;font-size:12px}
.scene-tools :is(input,select):focus-visible{outline:2px solid #ffdc76;outline-offset:1px}
.visually-hidden{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.no-scenes{font-size:13px;color:#fff;text-align:center;padding:12px 3px}
.join-error{font-size:12px;line-height:1.4;background:#ffe6dc;color:#762600;padding:8px;border-radius:6px;margin:5px 0}

.lobby__scenes-list {
  margin-top: 5px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  max-height: 235px;
  overflow: hidden;
}

.scene-item {
  margin-bottom: 5px;
}

.scene-item:last-child {
  margin-bottom: 0;
}

.lobby__scenes-list button {
  background-color: #3a4b54c9;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 5px;
  width: 100%;
  text-align: left;
  font-size: 15px;
  height: 35px;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.3s ease;
  gap: 5px;
}

.lobby__scenes-list button:hover {
  background-color: #1c2c35ad;
  cursor: pointer;
}

.lobby__scenes-list button:disabled {
  background-color: #2a3a46;
  cursor: not-allowed;
  opacity: 0.6;
}

.scene-name {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
}

.user-count {
  margin-left: auto;
  background-color: #3c87b3ad;
  border-radius: 5px;
  padding: 5px 10px;
  font-size: 12px;
  flex-shrink: 0;
}
</style>
