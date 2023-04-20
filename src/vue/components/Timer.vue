<template>
  <v-container fluid class="main-container">
    <div style="position: absolute; display: flex; flex-flow: row; justify-content: center; width: 100%; z-index: 100; padding-right: 1.5rem;">
      <v-icon v-if="!this.timerEnabled" size="200">mdi-close-octagon-outline</v-icon>
    </div>
    <StopWatch ref="stopwatch"/>
  </v-container>
</template>

<script lang="ts">
import StopWatch from "./StopWatch.vue";
import { ipcRenderer } from "@/vue/utils/ipcUtils";
import { mapState } from "vuex";

export default {
  components: { StopWatch },
  data: (): Record<string, unknown> => ({
    ...mapState({
      timerEnabled: state => state["session"].timerEnabled
    })
  }),
  methods: {
    setTimerEnabled(enabled): void {
      this.timerEnabled = enabled;
    }
  },
  mounted(): void {
    ipcRenderer.on("startTimer", (event) => this.$refs.stopwatch.start());
    ipcRenderer.on("pauseTimer", (event) => this.$refs.stopwatch.pause());
    ipcRenderer.on("stopTimer", (event) => this.$refs.stopwatch.stop());
    ipcRenderer.on("timerEnabled", (event, data) => this.setTimerEnabled(data.timerEnabled));
  },
  destroyed(): void {
    ipcRenderer.removeAllListeners("startTimer");
    ipcRenderer.removeAllListeners("pauseTimer");
    ipcRenderer.removeAllListeners("stopTimer");
    ipcRenderer.removeAllListeners("timerEnabled");
  }
}
</script>