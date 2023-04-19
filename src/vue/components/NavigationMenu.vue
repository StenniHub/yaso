<template>
  <v-hover v-slot="{ hover }" close-delay="100">
    <div>
      <v-app-bar-nav-icon/>

      <v-expand-x-transition appear>
        <v-navigation-drawer class="app-drawer" v-if="hover" app permanent clipped mini-variant>
          <v-list dense>
            <icon-button v-if="showBackButton" icon="mdi-arrow-left" :onClick="() => $router.push({ name: 'Game', params: { id: session.game } })" :tooltip="'Back to ' + game.title" v-bind="commonProps" />
            <icon-button icon="mdi-controller-classic" :onClick="() => $router.push({ name: 'Games' })" tooltip="Games" v-bind="commonProps" />
            <icon-button icon="mdi-keyboard" :onClick="() => $router.push({ name: 'Keybinds' })" tooltip="Keybinds" v-bind="commonProps" />
            <icon-button icon="mdi-timer" :onClick="() => $router.push({ name: 'Timer' })" tooltip="Timer" v-bind="commonProps" />
            <icon-button icon="mdi-cog" :onClick="() => $router.push({ name: 'Settings' })" tooltip="Settings" v-bind="commonProps" />
            <icon-button icon="mdi-information" :onClick="() => $router.push({ name: 'About' })" tooltip="About" v-bind="commonProps" />
          </v-list>
        </v-navigation-drawer>
      </v-expand-x-transition>
    </div>
  </v-hover>
</template>

<script lang="ts">
import IconButton from "./IconButton.vue";
import { mapState } from "vuex";

export default {
  components: { IconButton },
  data: (): Record<string, unknown> => ({
    commonProps: {size: 'large', tipPos: 'right'}
  }),
  computed: {
    showBackButton(): boolean {
      return this.game != null && this.$route.name != "Game";
    },
    ...mapState({
      game: state => state["game"],  // TODO: id is not stored on the game object, extracting it from session instead for now
      session: state => state["session"]
    })
  },
}
</script>