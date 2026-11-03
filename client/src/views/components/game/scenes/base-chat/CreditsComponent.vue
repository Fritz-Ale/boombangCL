<template>
  <div class="base-chat__container_credits">
    <div class="base-chat__container_credits-gold-container">
      <img :src="asset_gold_image" alt="Gold" />
      <span>{{ gold }}</span>
    </div>
    <div class="base-chat__container_credits-silver-container">
      <img :src="asset_silver_image" alt="Silver" />
      <span>{{ silver }}</span>
    </div>
    <div class="base-chat__container_credits-shell-container" title="Conchas: moneda futura de BoomBangCL">
      <span class="shell-label">Conchas</span>
      <span class="shell-value">{{ conchas === null ? '—' : conchas }}</span>
    </div>
  </div>
</template>

<script>
import socket from "@/sockets/socket";
import ResponseSocketsEnum from "@/enums/ResponseSocketsEnum";
import RequestSocketsEnum from "@/enums/RequestSocketsEnum";
import asset_gold_image from "@/assets/game/basechat/golden_coins.webp";
import asset_silver_image from "@/assets/game/basechat/silver_coins.webp";

export default {
  data() {
    return {
      gold: 0,
      silver: 0,
      conchas: null,
      creditsListener: null,
      asset_gold_image,
      asset_silver_image,
    };
  },
  mounted() {
    this.creditsListener = (data) => {
      this.gold = data.gold ?? this.gold;
      this.silver = data.silver ?? this.silver;
      if (typeof data.conchas === "number") this.conchas = data.conchas;
    };
    socket.on(ResponseSocketsEnum.REFRESH_USER_CREDITS, this.creditsListener);

    socket.emit(RequestSocketsEnum.REFRESH_USER_CREDITS);
  },
  beforeUnmount() {
    if (this.creditsListener) {
      socket.off(ResponseSocketsEnum.REFRESH_USER_CREDITS, this.creditsListener);
    }
  },
};
</script>

<style scoped>
.base-chat__container_credits {
  position: absolute;
  left: 15px;
  bottom: 13px;
  display: flex;
  gap: 3px;
}

.base-chat__container_credits-gold-container,
.base-chat__container_credits-silver-container {
  width: 68px;
  height: 73px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  font-size: 12px;
  margin-left: -2px;
}

.base-chat__container_credits-gold-container {
  color: #d98933;
}

.base-chat__container_credits-gold-container span,
.base-chat__container_credits-silver-container span {
  position: absolute;
  z-index: 1;
}

.base-chat__container_credits-silver-container {
  color: white;
}

.base-chat__container_credits-gold-container img,
.base-chat__container_credits-silver-container img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
}


/* Third currency: display only a server-provided amount; no fabricated graphic. */
.base-chat__container_credits-shell-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 69px;
  height: 54px;
  margin-top: 9px;
  border: 2px solid #b8833a;
  border-radius: 14px;
  background: linear-gradient(#fff2c5, #d7a96a);
  color: #654421;
  font-size: 11px;
  font-weight: bold;
  text-shadow: 0 1px rgba(255,255,255,.75);
}
.shell-value { font-size: 16px; }
</style>
