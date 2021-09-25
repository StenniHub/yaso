<template>
  <v-hover v-slot="{ hover }" close-delay="100">
    <div>
      <v-app-bar-nav-icon @click="forceOpen = !forceOpen"/>

      <!-- Uses transition container + permanent + v-if (v-model does nothing when permanent) as clipped + app does not work properly together -->
      <v-expand-x-transition appear>
        <v-navigation-drawer v-if="forceOpen || hover" app permanent clipped expand-on-hover>
          <v-list dense>
            <v-list-item link @click="$router.push('Games')">
              <v-list-item-action>
                <v-icon>mdi-controller-classic</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Games</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item link @click="$router.push('Keybinds')">
              <v-list-item-action>
                <v-icon>mdi-keyboard</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Keybinds</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item link @click="$router.push('Settings')">
              <v-list-item-action>
                <v-icon>mdi-cog</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>Settings</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-expand-x-transition>
    </div>
  </v-hover>
</template>

<script lang="ts">
export default {
  data: (): Record<string, unknown> => ({
    forceOpen: false
  })
}
</script>