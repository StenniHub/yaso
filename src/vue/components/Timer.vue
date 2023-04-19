<template>
  <v-container fluid class="main-container">
    <StopWatch ref="stopwatch"/>
  </v-container>
</template>

<script lang="ts">
import StopWatch from "./StopWatch.vue";
import { ipcRenderer } from "@/vue/utils/ipcUtils";

export default {
  components: { StopWatch },
  data: (): Record<string, unknown> => ({
  }),
  mounted(): void {
    ipcRenderer.on("startTimer", (event) => this.$refs.stopwatch.start());
    ipcRenderer.on("pauseTimer", (event) => this.$refs.stopwatch.pause());
    ipcRenderer.on("stopTimer", (event) => this.$refs.stopwatch.stop());
  },
  destroyed(): void {
    ipcRenderer.removeAllListeners("startTimer");
    ipcRenderer.removeAllListeners("pauseTimer");
    ipcRenderer.removeAllListeners("stopTimer");
  }
}
</script>