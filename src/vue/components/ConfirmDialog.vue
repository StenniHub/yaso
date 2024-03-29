<template>
  <v-dialog v-model="dialog" persistent v-if="inputs" @keydown.escape="cancel">
    <v-card class="dialog-card">
      <v-card-title v-if="header" v-text="header" />

      <v-card-text v-if="description" v-html="description" />

      <div class="dialog-input" v-for="([key, params]) in Object.entries(inputs)" :key="key">
        <v-text-field outlined v-if="params.type === 'text'" v-model="output[key]" :label="params.label" @keyup.enter="onEnter" autofocus/>

        <div class="file-picker" v-if="['file', 'folder'].includes(params.type)">
          <v-text-field outlined :label="params.label" v-model="output[key]" @keyup.enter="onEnter"/>
          <v-icon @click="params.type === 'file' ? selectFile(key) : selectFolder(key)">mdi-folder</v-icon>
        </div>
      </div>

      <v-card-actions>
        <icon-button v-if="remove" class="delete-button" icon="mdi-delete" size="medium" :onClick="onRemove" :tooltip="remove.label" />
        <v-spacer />
        <v-btn text v-if="cancellable" @click="cancel">{{ labels.cancel }}</v-btn>
        <v-btn text @click="confirm" :disabled="!isValid">{{ labels.confirm }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { invoke } from "@/vue/utils/ipcUtils";
import IconButton from './IconButton.vue';

export default {
  components: { IconButton },
  props: {
    header: String,
    description: String,
    remove: Object,
    labels: {
      type: Object,
      default: (): Record<string, string> => ({
        cancel: "Cancel",
        confirm: "Confirm"
      })
    },
    inputs: {
      type: Object,
      default: (): Record<string, unknown> => ({})
    },
    cancellable: {
      type: Boolean,
      default: true
    }
  },
  data: (): Record<string, unknown> => ({
    dialog: false,
    output: {},
    resolve: null,
    reject: null
  }),
  computed: {
    isValid(): boolean {
      if (!this.inputs) return false;
      
      return Object.entries(this.inputs).every(([key, params]) => {
        if (key == 'remove') return true;
        return params["optional"] || this.output[key] != null
      });
    },
  },
  methods: {
    open(): Promise<unknown> {
      if (this.inputs) {
        Object.entries(this.inputs).forEach(([key, params]) => {
          this.setNonNull(key, params["default"]);
        });
      }
      
      this.dialog = true;
      return new Promise((resolve, reject) => {
        this.resolve = resolve;
        this.reject = reject;
      });
    },
    confirm(): void {
      this.resolve(this.output);
      this.closeDialog();
    },
    cancel(): void {
      if (!this.cancellable) return;

      this.resolve(null);
      this.closeDialog();
    },
    closeDialog(): void {
      this.output = {};
      this.dialog = false;
    },
    setNonNull(key:string, value:unknown): void {
      if (value != null) Vue.set(this.output, key, value);
    },
    selectFile(key: string): void {
      invoke("selectFile", this.output[key]).then(result => this.setNonNull(key, result));
    },
    selectFolder(key: string): void {
      invoke("selectFolder", this.output[key]).then(result => this.setNonNull(key, result));
    },
    onRemove(): void {
      this.remove.func();
      this.cancel();
    },
    onEnter(): void {
      if (this.inputs && this.inputs.length > 1) return; // TODO: Deselect input
      if (this.isValid) this.confirm();
    }
  },
  provide(): Record<string, unknown> {
    return { confirm: this.confirm, cancel: this.cancel };
  }
};
</script>