<template>
  <section class="bpad-window" @pointerdown.stop @mousedown.stop @touchstart.stop aria-label="B-Pad">
    <header><strong>B-Pad</strong><button type="button" @click="$emit('close')">×</button></header>
    <nav><button :class="{ selected: tab === 'mail' }" @click="tab = 'mail'; refresh()">Mensajes</button><button :class="{ selected: tab === 'friends' }" @click="tab = 'friends'">Amigos</button></nav>
    <div v-if="tab === 'mail'" class="bpad-body">
      <button type="button" @click="refresh">Actualizar correo</button>
      <p v-if="loading">Cargando mensajes…</p>
      <p v-else-if="error" role="alert">{{ error }}</p>
      <template v-else>
        <p v-if="!mails.length">No tienes mensajes.</p>
        <button v-for="mail in mails" :key="mail.id" class="mail-entry" type="button" @click="selected = mail">
          <strong>{{ mail.title }}</strong><small>{{ mail.created_at }}</small>
        </button>
        <article v-if="selected" class="mail-detail"><strong>{{ selected.title }}</strong><p>{{ plainText(selected.description) }}</p><small>Para reclamar recompensas usa el correo del lobby.</small></article>
      </template>
    </div>
    <div v-else class="bpad-body"><p>Amigos y solicitudes: próximamente. El servidor todavía no expone este módulo.</p></div>
  </section>
</template>
<script>
import socket from '@/sockets/socket';
import RequestSocketsEnum from '@/enums/RequestSocketsEnum';
import ResponseSocketsEnum from '@/enums/ResponseSocketsEnum';
export default {
  emits: ['close'],
  data() { return { tab: 'mail', mails: [], selected: null, loading: false, error: '', inboxHandler: null }; },
  mounted() {
    this.inboxHandler = (response) => {
      this.loading = false;
      if (!response?.success) { this.error = 'No se pudo cargar el correo.'; return; }
      this.mails = response.mails || [];
    };
    socket.on(ResponseSocketsEnum.GET_MAIL_INBOX, this.inboxHandler);
    this.refresh();
  },
  beforeUnmount() { socket.off(ResponseSocketsEnum.GET_MAIL_INBOX, this.inboxHandler); },
  methods: {
    refresh() { this.loading = true; this.error = ''; socket.emit(RequestSocketsEnum.GET_MAIL_INBOX); },
    plainText(html) {
      return String(html || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').slice(0, 1500);
    }
  }
};
</script>
<style scoped>
.bpad-window{position:absolute;bottom:82px;right:24px;z-index:10020;width:340px;max-width:calc(100% - 48px);height:390px;background:#fef1c4;border:5px solid #075c98;border-radius:19px;box-shadow:0 6px 0 #063b6b,0 12px 20px #0007;color:#193b5a;pointer-events:auto;overflow:hidden;font-family:Arial,sans-serif}
header{background:linear-gradient(#41c8ee,#0874bb);color:white;text-shadow:1px 2px #174672;padding:10px 13px;display:flex;justify-content:space-between;align-items:center}
header button{background:#e64837;color:white;border:2px solid white;border-radius:50%;font-size:20px;cursor:pointer}
nav{display:flex;gap:5px;padding:8px}nav button,.bpad-body>button{background:#fff;border:2px solid #078ac9;border-radius:10px;padding:7px;cursor:pointer}.selected{background:#ffdc54}
.bpad-body{height:275px;overflow:auto;padding:9px}.mail-entry{display:flex;flex-direction:column;width:100%;text-align:left;margin:6px 0;background:#fff;border:2px solid #83bee0;border-radius:9px;padding:8px;cursor:pointer}.mail-detail{background:#fff;padding:9px;border-radius:9px;margin-top:8px;overflow-wrap:anywhere}small{color:#567}
</style>
