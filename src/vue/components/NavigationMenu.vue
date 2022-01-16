<template>
  <v-hover v-slot="{ hover }" close-delay="100">
    <div>
      <v-app-bar-nav-icon/>

      <v-expand-x-transition appear>
        <v-navigation-drawer v-if="hover" app permanent clipped mini-variant>
          <v-list dense>
            <v-tooltip right>
              <template v-slot:activator="{ on, attrs }">
                <v-list-item link @click="$router.push('Games')" v-on="on" v-bind="attrs">
                  <v-list-item-action>
                    <v-icon>mdi-controller-classic</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
              <span>Games</span>
            </v-tooltip>
            <v-tooltip right>
              <template v-slot:activator="{ on, attrs }">
                <v-list-item link @click="$router.push('Keybinds')" v-on="on" v-bind="attrs">
                  <v-list-item-action>
                    <v-icon>mdi-keyboard</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
              <span>Keybinds</span>
            </v-tooltip>
            <v-tooltip right>
              <template v-slot:activator="{ on, attrs }">
                <v-list-item link @click="$router.push('Settings')" v-on="on" v-bind="attrs">
                  <v-list-item-action>
                    <v-icon>mdi-cog</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
              <span>Settings</span>
            </v-tooltip>
            <v-tooltip right>
              <template v-slot:activator="{ on, attrs }">
                <v-list-item link @click="$router.push('About')" v-on="on" v-bind="attrs">
                  <v-list-item-action>
                    <v-icon>mdi-information</v-icon>
                  </v-list-item-action>
                </v-list-item>
              </template>
              <span>About</span>
            </v-tooltip>
          </v-list>
        </v-navigation-drawer>
      </v-expand-x-transition>
    </div>
  </v-hover>
</template>

<script lang="ts">
export default {
  data: (): Record<string, unknown> => ({
    mini: false
  })
}
</script>