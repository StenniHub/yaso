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

    <v-main>
      <router-view />
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

export default Vue.extend({
  name: "App",
  components: { NavigationMenu },
  data: (): Record<string, unknown> => ({
    overlay: {
      show: false,
      message: "",
      success: true
    }
  }),
  computed: mapState({
    session: state => state["session"]
  }),
  methods: {
    ...mapActions(["loadAll", "toggleAlwaysOnTop"]),
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
    }
  },
  mounted(): void {
    this.$vuetify.theme.dark = true;
    ipcRenderer.on("message", (event, data) => this.showOverlay(data.message, data.success));
    ipcRenderer.on("toggleAlwaysOnTop", this.toggleAlwaysOnTop);
    this.loadAll();
  }
});
</script>

<style src="./styles/main.scss" lang="scss" />
