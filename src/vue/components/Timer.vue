<template>
  <v-container fluid class="main-container">
    <StopWatch ref="stopWatch" :onStart="playSound" :onPause="stopSound" :onStop="stopSound" />
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
import { mapState, mapActions } from "vuex";

export default {
  components: { StopWatch, IconButton, ConfirmDialog },
  data: (): Record<string, unknown> => ({
    muted: false
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
      if (this.noSoundFile) return;
      this.muted = !this.muted;
      localStorage["muteTimer"] = this.muted;
      this.stopSound();
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
    if (localStorage["muteTimer"] != null) {
      this.muted = JSON.parse(localStorage["muteTimer"]);
    }
    
    ipcRenderer.on("startTimer", this.stopWatch.start);
    ipcRenderer.on("pauseTimer", this.stopWatch.pause);
    ipcRenderer.on("stopTimer", this.stopWatch.stop);
    ipcRenderer.on("muteTimer", this.toggleMute);
  },
  destroyed(): void {
    ipcRenderer.removeAllListeners("startTimer");
    ipcRenderer.removeAllListeners("pauseTimer");
    ipcRenderer.removeAllListeners("stopTimer");
    ipcRenderer.removeAllListeners("muteTimer");
  }
}
</script>