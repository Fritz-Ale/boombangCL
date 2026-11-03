<template>
  <nav class="bb-quick-actions" aria-label="Accesos del juego" @pointerdown.stop @mousedown.stop @touchstart.stop>
    <div v-if="menuOpen" class="bb-quick-menu" role="group" aria-label="Opciones de B-Pad">
      <button type="button" @click="select('avatar')">Mi keko</button>
      <button type="button" @click="select('rankings')">Clasificaciones</button>
    </div>
    <button type="button" class="bb-action bb-bpad" :aria-expanded="menuOpen" aria-label="Abrir B-Pad" @click="menuOpen = !menuOpen">B-Pad</button>
    <button v-if="inventoryAvailable" type="button" class="bb-action" aria-label="Abrir mochila" @click="select('inventory')">Mochila</button>
    <button type="button" class="bb-action" aria-label="Abrir catálogo" @click="select('shop')">Catálogo</button>
  </nav>
</template>

<script>
export default {
  name: "SceneQuickActions",
  props: {
    inventoryAvailable: { type: Boolean, default: false },
  },
  emits: ["avatar", "rankings", "inventory", "shop"],
  data() {
    return { menuOpen: false };
  },
  methods: {
    select(action) {
      this.menuOpen = false;
      this.$emit(action);
    },
  },
};
</script>

<style scoped>
/* Controles discretos para escenas de 1012 x 657. No cubren la brújula existente. */
.bb-quick-actions {
  position: absolute;
  right: 12px;
  bottom: 95px;
  z-index: 35;
  display: flex;
  align-items: flex-end;
  flex-direction: column;
  gap: 5px;
  pointer-events: auto;
}
.bb-action, .bb-quick-menu button {
  border: 2px solid #67451f;
  border-radius: 8px;
  background: linear-gradient(180deg, #ffe3a0 0%, #e5a34d 65%, #b96b2a 100%);
  box-shadow: inset 0 1px 0 #fff3cf, 0 3px 0 #563617, 0 4px 7px #0006;
  color: #532c11;
  font-family: inherit;
  font-weight: 800;
  font-size: 12px;
  text-shadow: 0 1px #ffedc5;
  padding: 6px 10px;
  min-width: 83px;
  cursor: pointer;
}
.bb-action:hover, .bb-action:focus-visible, .bb-quick-menu button:hover, .bb-quick-menu button:focus-visible {
  filter: brightness(1.12);
  outline: 2px solid #fff5b7;
  outline-offset: 1px;
}
.bb-bpad { background: linear-gradient(180deg, #ccedff, #6ac0ee 60%, #3982c1); border-color: #285f95; color: #174877; text-shadow: 0 1px #e6f9ff; }
.bb-quick-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  border: 2px solid #805022;
  border-radius: 9px;
  background: #f9d58f;
  box-shadow: 0 4px 12px #0007;
}
.bb-quick-menu button { min-width: 110px; }
</style>
