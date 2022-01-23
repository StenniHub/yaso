<template>
  <v-container fluid class="main-container">
    <v-row class="settings-row" v-for="action in actions" :key="action.id">
      <template>
        <v-col cols="8">
          <v-text-field outlined readonly clearable v-model="keybinds[action.id].keys" @click="bind(action.id)" @click:clear="unbind(action.id)" />
        </v-col>
        <v-col cols="4">
          <p>{{ action.description }}</p>
        </v-col>

        <template v-if="keybinds[action.id].config != null">
          <div v-for="param in Object.keys(keybinds[action.id].config)" :key="param" style="width: 100%; display: flex;">
            <template v-if="param == 'filePath'">
              <v-col cols="8">
                <v-text-field outlined readonly v-model="keybinds[action.id].config[param]" @click="selectFile(action.id, param)" />
              </v-col>
              <v-col cols="4">
                <p>File to open</p>
              </v-col>
            </template>
          </div>
        </template>
      </template>
    </v-row>
  </v-container>
</template>

<script lang="ts">
import { invoke, selectFile } from "@/vue/utils/ipcUtils";
import { actions } from "@/common/actions";
import { migrateKeybindFormat } from "@/common/migration";
import Vue from "vue";

function deselectElement() {
  if (document.activeElement instanceof HTMLElement) (document.activeElement as HTMLElement).blur();
}

export default {
  data: (): Record<string, unknown> => ({
    actions: actions,
    keybinds: {}
  }),
  mounted(): void {
    this.loadKeybinds();
  },
  methods: {
    bind(action: string): void {
      invoke("awaitKeys").then(keys => {
        this.bindKeys(action, keys);
        deselectElement()
      });
    },
    unbind(action: string): void {
      this.unbindKeys(action);
      setTimeout(deselectElement, 0);
    },
    selectFile(action: string, key: string): void {
      const config = this.keybinds[action].config
      selectFile(config[key]).then(result => {
        if (result != null) {
          Vue.set(config, key, result);
          this.saveKeybinds();
        }
      });
    },
    bindKeys(action: string, keys: string): void {
      invoke("bindKeys", action, keys).then(bound => {
        const previousKeys = (this.keybinds[action] || {}).keys;
        
        if (bound) {
          if (previousKeys) invoke("unbindKeys", previousKeys);
          Vue.set(this.keybinds[action], "keys", keys);
          this.saveKeybinds();
        }
      });
    },
    unbindKeys(action: string): void {
      invoke("unbindKeys", this.keybinds[action].keys);
      Vue.set(this.keybinds[action], "keys", null);
      this.saveKeybinds();
    },
    async loadKeybinds(): Promise<unknown> {
      return invoke("readConfig", "keybinds").then(keybinds => {
        migrateKeybindFormat(keybinds);

        actions.forEach(action => {
          if (!(action.id in keybinds)) {
            const keybind = { "keys": null };
            if (action.config) keybind["config"] = action.config;
            keybinds[action.id] = keybind;
          }
        });

        this.keybinds = keybinds;
      });
    },
    async saveKeybinds(): Promise<unknown> {
      return invoke("saveConfig", "keybinds", this.keybinds);
    }
  }
};
</script>
