<template>
  <v-container fluid class="main-container">
    <v-row class="settings-row" v-for="keybind in keybinds" :key="keybind.keys">
      <template>
        <v-col cols="8">
          <icon-button v-if="!keybind.config" icon="mdi-delete" size="medium" :onClick="() => remove(keybind)" />
          <icon-button v-if="keybind.config" icon="mdi-cog" size="medium" :onClick="() => configure(keybind)" />
          <v-text-field outlined readonly v-model="keybind.keys" @click="bind(keybind)" />
        </v-col>
        <v-col cols="4">
          <p>{{ actionsById[keybind.action].description }}</p>
        </v-col>
      </template>
    </v-row>
    
    <v-row class="keybinds-add">
      <v-col cols="8">
        <v-menu offset-y max-height="15rem">
          <template v-slot:activator="{ on }">
            <icon-button icon="mdi-plus" tooltip="Add new hotkey" :on="on" />
          </template>
          <v-list>
            <v-list-item v-for="action in actions" :key="action.id" @click="addKeybind(action)">
              <v-list-item-title>{{ action.description }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-col>
    </v-row>
    
    <confirm-dialog ref="configDialog" :inputs="dialog.inputs" :remove="dialog.remove" />
  </v-container>
</template>

<script lang="ts">
import { invoke } from "@/vue/utils/ipcUtils";
import { actions, actionsById } from "@/common/actions";
import { clone } from "@/common/utils";
import IconButton from './IconButton.vue';
import ConfirmDialog from './ConfirmDialog.vue';

function deselectElement() {
  if (document.activeElement instanceof HTMLElement) (document.activeElement as HTMLElement).blur();
}

export default {
  components: { IconButton, ConfirmDialog },
  data: (): Record<string, unknown> => ({
    actions: actions,
    actionsById: actionsById,
    keybinds: [],
    dialog: {}
  }),
  mounted(): void {
    this.loadKeybinds();
  },
  methods: {
    bind(keybind: Record<string, unknown>): void {
      invoke("awaitKeys").then(keys => {
        if (keybind.keys == keys) return;

        if (this.isBound(keys)) {
          invoke("errorMsg", keys + " is already bound to a different action");
          return;
        }

        this.bindKeys(keybind, keys);
      }).finally(deselectElement);
    },
    isBound(keys: string): boolean {
      return this.keybinds.some(keybind => keybind.keys == keys);
    },
    remove(keybind: Record<string, unknown>): void {
      var index = this.keybinds.indexOf(keybind);
      this.keybinds.splice(index, 1);
      this.unbindKeys(keybind);
      setTimeout(deselectElement, 0);
    },
    selectFile(keybind: Record<string, unknown>, key: string): void {
      const config = keybind.config
      invoke("selectFile", config[key]).then(result => {
        if (result != null) {
          config[key] = result;
          this.bindKeys(keybind, keybind.keys);
        }
      });
    },
    bindKeys(keybind: Record<string, unknown>, keys: string): void {
      if (keys == null) {
        this.saveKeybinds();
        return;
      }

      const previousKeys = keybind.keys;
      keybind.keys = keys;

      invoke("bindKeys", keybind).then(bound => {
        if (bound) {
          if (previousKeys != keys) invoke("unbindKeys", previousKeys);
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
        this.keybinds = keybinds;
      });
    },
    async saveKeybinds(): Promise<unknown> {
      return invoke("saveConfig", "keybinds", this.keybinds);
    },
    addKeybind(action: Record<string, unknown>): void {
      const keybind = { keys: null, action: action.id };
      if (action.config) keybind["config"] = clone(action.config);
      this.keybinds.push(keybind);
    },
    configure(keybind: Record<string, unknown>): void {
      this.dialog = this.getDialogOptions(keybind);

      setTimeout(() => {
        this.$refs.configDialog.open().then(output => {
          if (output != null) {
            Object.entries(output).forEach(([id, value]) => {
              if (keybind.config[id] !== undefined) {
                keybind.config[id] = value;
              }
            });

            this.bindKeys(keybind, keybind.keys);
          }
        });
      }, 50);
    },
    getDialogOptions(keybind: Record<string, unknown>): Record<string, unknown> {
      if (keybind == null) return null;

      const config = keybind.config;
      const inputs = {};

      Object.entries(config).forEach(([id, value]) => {
        if (id == 'filePath') {
          inputs[id] = { type: 'file', label: 'Path to file/application', default: value };
        }
      });

      return {
        inputs: inputs,
        remove: { label: 'Remove keybind', func: () => this.remove(keybind) }
      }
    }
  }
};
</script>
