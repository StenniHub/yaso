<template>
  <v-hover v-slot="{ hover }" close-delay="100">
    <div>
      <v-app-bar-nav-icon/>

      <v-expand-x-transition appear>
        <v-navigation-drawer class="app-drawer" v-if="hover" app permanent clipped mini-variant>
          <v-list dense>
            <icon-button icon="mdi-controller-classic" :onClick="() => $router.push({ name: 'Games' })" tooltip="Games" v-bind="commonProps" />
            <icon-button icon="mdi-keyboard" :onClick="() => $router.push({ name: 'Keybinds' })" tooltip="Keybinds" v-bind="commonProps" />
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

export default {
  components: { IconButton },
  data: (): Record<string, unknown> => ({
    commonProps: {size: 'large', tipPos: 'right'}
  })
}
</script>