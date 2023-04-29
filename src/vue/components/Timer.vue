<template>
  <v-container fluid class="main-container">
    <StopWatch ref="stopWatch" :onStart="playSound" :onPause="stopSound" :onStop="stopSound" :disabled="disabled" />
    <div class="timer-btn-container">
      <icon-button :icon="this.muted ? 'mdi-volume-mute' : 'mdi-volume-high'" :onClick="toggleMute" tooltip="Mute timer" :disabled="noSoundFile" />
      <icon-button icon="mdi-cog" :onClick="editSettings" tooltip="Settings" />
    </div>

    <confirm-dialog ref="settingsDialog" header="Timer Settings" :inputs="settingsDialog.inputs" />
  </v-container>
</template>

<script lang="ts">
import StopWatch from "./StopWatch.vue";
import IconButton from "./IconButton.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import { invoke, ipcRenderer } from "@/vue/utils/ipcUtils";
import { fromStorage, toStorage } from "@/vue/utils/storageUtils";
import { mapState, mapActions } from "vuex";

export default {
  components: { StopWatch, IconButton, ConfirmDialog },
  data: (): Record<string, unknown> => ({
    muted: fromStorage("timerMuted"),
    disabled: fromStorage("timerDisabled")
  }),
  computed: {
    ...mapState({
      config: state => state["session"].timer
    }),
    stopWatch() {
      return this.$refs.stopWatch;
    },
    noSoundFile() {
      return this.config.soundFile == null || this.config.soundFile == "";
    },
    settingsDialog() {
      return {
        inputs: {
          soundFile: { type: 'file', label: 'Path to sound file', default: this.config.soundFile }
        }
      }
    }
  },
  methods: {
    ...mapActions(["saveSession"]),
    toggleMute(): void {
      this.stopSound();
      this.muted = !this.muted;
      toStorage("timerMuted", this.muted);
    },
    toggleDisable(): void {
      this.stopTimer();
      this.disabled = !this.disabled;
      toStorage("timerDisabled", this.disabled);
    },
    startTimer(): void {
      if (this.disabled) return;
      this.stopWatch.start();
    },
    pauseTimer(): void {
      if (this.disabled) return;
      this.stopWatch.pause();
    },
    stopTimer(): void {
      if (this.disabled) return;
      this.stopWatch.stop();
    },
    playSound(): void {
      if (this.muted || this.noSoundFile) return;
      invoke("playSound", this.config.soundFile);
    },
    stopSound(): void {
      invoke("stopSound");
    },
    editSettings(): void {
      this.$refs.settingsDialog.open().then(output => {
        if (output == null) return;
        this.config.soundFile = output.soundFile;
        this.saveSession();
      });
    },
  },
  mounted(): void {
    ipcRenderer.on("startTimer", this.startTimer);
    ipcRenderer.on("pauseTimer", this.pauseTimer);
    ipcRenderer.on("stopTimer", this.stopTimer);
    ipcRenderer.on("muteTimer", this.toggleMute);
    ipcRenderer.on("disableTimer", this.toggleDisable);
  },
  destroyed(): void {
    ipcRenderer.removeAllListeners("startTimer");
    ipcRenderer.removeAllListeners("pauseTimer");
    ipcRenderer.removeAllListeners("stopTimer");
    ipcRenderer.removeAllListeners("muteTimer");
    ipcRenderer.removeAllListeners("disableTimer");
  }
}
</script>