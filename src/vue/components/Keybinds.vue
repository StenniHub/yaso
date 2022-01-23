<template>
  <v-container fluid class="main-container">
    <v-row class="settings-row" v-for="keybind in keybinds" :key="keybind.keys">
      <template>
        <v-col cols="8">
          <v-text-field outlined readonly clearable v-model="keybind.keys" @click="bind(keybind)" @click:clear="unbind(keybind)" />
        </v-col>
        <v-col cols="4">
          <p>{{ actions[keybind.action].description }}</p>
        </v-col>

        <template v-if="keybind.config != null">
          <div v-for="param in Object.keys(keybind.config)" :key="param" style="width: 100%; display: flex;">
            <template v-if="param == 'filePath'">
              <v-col cols="8">
                <v-text-field outlined readonly v-model="keybind.config[param]" @click="selectFile(keybind, param)" />
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
import { actionsById } from "@/common/actions";
import { migrateKeybindFormat } from "@/common/migration";

function deselectElement() {
  if (document.activeElement instanceof HTMLElement) (document.activeElement as HTMLElement).blur();
}

export default {
  data: (): Record<string, unknown> => ({
    actions: actionsById,
    keybinds: []
  }),
  mounted(): void {
    this.loadKeybinds();
  },
  methods: {
    bind(keybind: Record<string, unknown>): void {
      invoke("awaitKeys").then(keys => {
        this.bindKeys(keybind, keys);
        deselectElement()
      });
    },
    unbind(keybind: Record<string, unknown>): void {
      this.unbindKeys(keybind);
      setTimeout(deselectElement, 0);
    },
    selectFile(keybind: Record<string, unknown>, key: string): void {
      const config = keybind.config
      selectFile(config[key]).then(result => {
        if (result != null) {
          config[key] = result;
          this.saveKeybinds();
        }
      });
    },
    bindKeys(keybind: Record<string, unknown>, keys: string): void {
      const previousKeys = keybind.keys;
      keybind.keys = keys;

      invoke("bindKeys", keybind).then(bound => {
        if (bound) {
          if (previousKeys) invoke("unbindKeys", previousKeys);
          this.saveKeybinds();
        } else {
          keybind.keys = previousKeys;
        }
      });
    },
    unbindKeys(keybind: Record<string, unknown>): void {
      invoke("unbindKeys", keybind.keys);
      keybind.keys = null;
      this.saveKeybinds();
    },
    async loadKeybinds(): Promise<unknown> {
      return invoke("readConfig", "keybinds").then(keybinds => {
        this.keybinds = migrateKeybindFormat(keybinds);
      });
    },
    async saveKeybinds(): Promise<unknown> {
      return invoke("saveConfig", "keybinds", this.keybinds);
    }
  }
};
</script>
