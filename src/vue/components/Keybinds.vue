<template>
  <v-container fluid class="main-container">
    <v-row class="settings-row" v-for="action in actions" :key="action.id">
      <v-col cols="8">
        <v-text-field outlined readonly clearable v-model="keybinds[action.id]" @click="bind(action.id)" @click:clear="unbind(action.id)" />
      </v-col>
      <v-col cols="4">
        <p>{{ action.description }}</p>
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { mapActions, mapState } from "vuex";
import { invoke } from "@/vue/utils/ipcUtils";

function deselectElement() {
  if (document.activeElement instanceof HTMLElement) (document.activeElement as HTMLElement).blur();
}

export default {
  data: (): Record<string, unknown> => ({
    actions: [
      {
        id: "loadSavefile",
        description: "Load selected savefile"
      },
      {
        id: "selectNext",
        description: "Select next savefile"
      },
      {
        id: "selectPrevious",
        description: "Select previous savefile"
      },
      {
        id: "toggleFolder",
        description: "Open/close selected folder"
      },
      {
        id: "toggleAlwaysOnTop",
        description: "Toggle always on top"
      },
      {
        id: "toggleReadOnly",
        description: "Toggle read only mode for game savefile"
      }
    ]
  }),
  computed: mapState({
    keybinds: state => state["keybinds"]
  }),
  methods: {
    ...mapActions(["bindKeys", "unbindKeys"]),
    bind(action: string): void {
      invoke("awaitKeys").then(keys => {
        this.bindKeys({ action, keys });
        deselectElement()
      });
    },
    unbind(action: string): void {
      this.unbindKeys(action);
      setTimeout(deselectElement, 0);
    }
  }
};
</script>
