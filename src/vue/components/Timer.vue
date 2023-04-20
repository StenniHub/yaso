<template>
  <v-container fluid class="main-container">
    <div style="position: absolute; display: flex; flex-flow: row; justify-content: center; width: 100%; z-index: 10; padding-right: 1.5rem; margin-top: -1rem; opacity: 50%;">
      <v-icon v-if="this.disabled" size="200">mdi-close-octagon-outline</v-icon>
    </div>
    <StopWatch ref="stopWatch"/>
  </v-container>
</template>

<script lang="ts">
import StopWatch from "./StopWatch.vue";
import { invoke, ipcRenderer } from "@/vue/utils/ipcUtils";
import { mapState } from "vuex";

export default {
  components: { StopWatch },
  data: (): Record<string, unknown> => ({
    disabled: false
  }),
  computed: {
    ...mapState({
      config: state => state["session"].timer
    }),
    stopWatch() {
      return this.$refs.stopWatch;
    }
  },
  methods: {
    toggleTimer(): void {
      this.disabled = !this.disabled;
    },
    startTimer(): void {
      if (this.disabled || this.stopWatch.running) return;
      this.stopWatch.start();
      this.playSound();
    },
    pauseTimer(): void {
      if (this.disabled) return;
      this.stopWatch.pause();
      this.stopSound();
    },
    stopTimer(): void {
      if (this.disabled) return;
      this.stopWatch.stop();
      this.stopSound();
    },
    playSound(): void {
      if (this.config.soundFile) invoke("playSound", this.config.soundFile);
    },
    stopSound(): void {
      invoke("stopSound", this.config.soundFile);
    }
  },
  mounted(): void {
    ipcRenderer.on("startTimer", this.startTimer);
    ipcRenderer.on("pauseTimer", this.pauseTimer);
    ipcRenderer.on("stopTimer", this.stopTimer);
    ipcRenderer.on("toggleTimer", this.toggleTimer);
  },
  destroyed(): void {
    ipcRenderer.removeAllListeners("startTimer");
    ipcRenderer.removeAllListeners("pauseTimer");
    ipcRenderer.removeAllListeners("stopTimer");
    ipcRenderer.removeAllListeners("toggleTimer");
  }
}
</script>