<template>
  <section class="ceo-window" @pointerdown.stop @mousedown.stop @touchstart.stop aria-label="Panel CEO">
    <header><strong>★ BoomBangCL · Panel CEO</strong><button @click="$emit('close')" type="button">×</button></header>
    <div class="ceo-body">
      <p v-if="loading">Comprobando permisos…</p>
      <p v-else-if="error" role="alert">{{ error }}</p>
      <template v-else-if="status">
        <div class="stats"><span>Usuarios: {{ status.users_total }}</span><span>Islas: {{ status.islands_total }}</span><span>Salas públicas: {{ status.public_scenes_total }}</span></div>
        <p>Gestión protegida desde Laravel:</p>
        <div class="ceo-grid">
          <a v-for="item in sections" :key="item.path" :href="adminPath(item.path)" target="_blank" rel="noopener noreferrer">{{ item.label }}</a>
        </div>
        <p class="note">Los controles de moderación y mantenimiento requieren iniciar sesión como Superadmin en el panel administrativo. Las cifras son totales, no usuarios conectados.</p>
      </template>
    </div>
  </section>
</template>
<script>
export default {
  emits: ['close'],
  data() {
    return {
      status: null, error: '', loading: true,
      sections: [
        {label:'Usuarios',path:'user'},{label:'Catálogo',path:'catalog-item'},
        {label:'Objetos',path:'scene-item'},{label:'Islas',path:'island'},
        {label:'Salas',path:'public-scene'},{label:'Eventos',path:'event'},
        {label:'Mensajes',path:'mail'},{label:'Servidor',path:'server-management'}
      ]
    };
  },
  async mounted() {
    const token = localStorage.getItem('app_jwt');
    if (!token) { this.error = 'Inicia sesión para comprobar los permisos.'; this.loading = false; return; }
    try {
      const root = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
      const response = await fetch(root + '/api/ceo/status', { headers: {Authorization: 'Bearer ' + token, Accept:'application/json'} });
      if (!response.ok) throw new Error(response.status === 403 ? 'Acceso exclusivo para Superadmin.' : 'No se pudo consultar el panel.');
      this.status = await response.json();
    } catch (error) { this.error = error.message || 'Error de conexión'; }
    finally { this.loading = false; }
  },
  methods: {
    adminPath(path) {
      const root = (this.status?.admin_url || '').replace(/\/$/, '');
      return root + '/' + path;
    }
  }
};
</script>
<style scoped>
.ceo-window{position:absolute;top:65px;left:50%;transform:translateX(-50%);width:590px;max-width:calc(100% - 28px);z-index:10030;background:#fff1c5;color:#1b4c6c;border:5px solid #0564ac;border-radius:20px;box-shadow:0 6px 0 #094473,0 14px 30px #0008;pointer-events:auto;font-family:Arial,sans-serif}
header{background:linear-gradient(#52d0f0,#0673b9);padding:13px;color:#fff;border-radius:12px 12px 0 0;display:flex;justify-content:space-between;text-shadow:1px 2px #235b82}header button{background:#d83437;color:white;border:2px solid white;border-radius:50%;font-size:22px;cursor:pointer}.ceo-body{padding:16px}.stats{display:flex;gap:8px;flex-wrap:wrap;font-weight:bold}.stats span{background:#fff;border:2px solid #3bb4d9;border-radius:11px;padding:8px}.ceo-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.ceo-grid a{text-align:center;background:linear-gradient(#37baf0,#0677be);border:2px solid #075a93;border-radius:12px;color:white;font-weight:bold;text-decoration:none;padding:15px 3px}.ceo-grid a:hover{filter:brightness(1.12)}.note{font-size:12px;color:#4c6170;line-height:1.4}
</style>
