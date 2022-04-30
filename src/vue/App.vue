<template>
  <v-app>
    <v-app-bar app clipped-left>
      <navigation-menu />
      <v-toolbar-title>Yet Another Save Organizer</v-toolbar-title>
      <div class="frame-buttons"> <!-- TODO: Add proper button styling -->
        <v-btn text @click="toggleAlwaysOnTop">
          <v-icon dense :color="session && session.alwaysOnTop ? 'orange' : 'white'">mdi-pin</v-icon>
        </v-btn>
        <v-btn text @click="minimize">
          <v-icon dense>mdi-minus</v-icon>
        </v-btn>
        <v-btn text @click="close">
          <v-icon dense>mdi-close</v-icon>
        </v-btn>
      </div>
    </v-app-bar>

    <v-main v-if="session">
      <router-view />

      <confirm-dialog ref="versionDialog" :header="getUpdateHeader()" :description="getUpdateDescription()" :labels="{ cancel: 'Do not notify again', confirm: 'Close'}" />

      <v-overlay :value="overlay.show" class="message-overlay">
        <div class="overlay-container">
          <v-icon v-if="overlay.success" class="huge-icon" color="green">
            mdi-checkbox-marked-circle
          </v-icon>
          <v-icon v-if="!overlay.success" class="huge-icon" color="red">
            mdi-close-circle
          </v-icon>
          <h3 style="text-align: center">{{ overlay.message }}</h3>
        </div>
      </v-overlay>
    </v-main>

    <!--
    <v-footer app>
      <span>&copy; {{ new Date().getFullYear() }}</span>
    </v-footer>
    -->
  </v-app>
</template>

<script lang="ts">
import Vue from "vue";
import { mapActions, mapState } from "vuex";
import { ipcRenderer, invoke } from "@/vue/utils/ipcUtils";
import NavigationMenu from "./components/NavigationMenu.vue"
import ConfirmDialog from "./components/ConfirmDialog.vue";
import { version } from "@/../package.json";

async function getLatestVersion() {
  try {
    return fetch("https://api.github.com/repos/stennihub/yaso/releases/latest")
      .then(response => response.json())
      .then(data => data.tag_name);
  } catch (error) {
    return "";
  }
}

function isNewerVersion(currentVersion: string, newVersion: string) {
  const vCurrent = parseVersionNumber(currentVersion);
  const vLatest = parseVersionNumber(newVersion);

  for (let i = 0; i < vLatest.length; i++) {
    if ((vCurrent.length - 1) < i || vLatest[i] > vCurrent[i]) return true;
    if (vCurrent[i] > vLatest[i]) return false;
  }

  return false;
}

function parseVersionNumber(versionString: string) {
  const regex = "([.0-9])+";
  const stripped = (versionString.match(regex) || [""])[0];
  return stripped.split(".").map(value => parseInt(value));
}

export default Vue.extend({
  name: "App",
  components: { NavigationMenu, ConfirmDialog },
  data: (): Record<string, unknown> => ({
    overlay: {
      show: false,
      message: "",
      success: true
    },
    latestVersion: ""
  }),
  computed: mapState({
    session: state => state["session"]
  }),
  methods: {
    ...mapActions(["loadAll", "toggleAlwaysOnTop", "saveWindowSize", "saveSession"]),
    minimize(): void {
      invoke("minimizeWindow");
    },
    close(): void {
      invoke("closeWindow");
    },
    showOverlay(message: string, success: boolean): void {
      this.overlay.message = message;
      this.overlay.success = success;
      this.overlay.show = true;

      setTimeout(() => {
        this.overlay.show = false;
      }, 3000);
    },
    checkLatestVersion() {
      getLatestVersion().then(latestVersion => {
        this.latestVersion = latestVersion;
        if (!this.session) return;  // Can happen if fetch is bypassed
        if (this.session.doNotNotify === latestVersion) return;
        
        if (isNewerVersion(version, latestVersion)) {
          this.$refs.versionDialog.open().then(output => {
            if (output == null) {
              this.session.doNotNotify = latestVersion;
              this.saveSession();
            }
          });
        }
      })
    },
    getUpdateHeader() {
      return `New version available! (${this.latestVersion})`
    },
    getUpdateDescription() {
      const url = "https://github.com/StenniHub/yaso/releases"
      return `<p>To download the latest version, head to:</p> <a href="${url}" target="_blank">${url}</a>`;
    }
  },
  mounted(): void {
    this.$vuetify.theme.dark = true;

    ipcRenderer.on("message", (event, data) => this.showOverlay(data.message, data.success));
    ipcRenderer.on("toggleAlwaysOnTop", this.toggleAlwaysOnTop);
    ipcRenderer.on("saveWindowSize", (event, data) => {
      this.session.windowSize = data.windowSize;
      this.saveSession();
    });

    this.loadAll();
    this.checkLatestVersion();
  }
});
</script>

<style src="./styles/main.scss" lang="scss" />
