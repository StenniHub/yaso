<template>
  <v-dialog v-model="dialog" persistent>
    <v-card class="dialog-card">
      <v-card-title v-if="header" v-text="header" />

      <v-card-text v-if="description" v-html="description" />

      <div class="dialog-input" v-for="([key, params]) in Object.entries(inputs)" :key="key">
        <v-text-field outlined v-if="params.type === 'text'" v-model="output[key]" :label="params.label" />

        <div class="file-picker" v-if="['file', 'folder'].includes(params.type)">
          <v-text-field outlined :label="params.label" v-model="output[key]" />
          <v-icon @click="params.type === 'file' ? selectFile(key) : selectFolder(key)">mdi-folder</v-icon>
        </div>
      </div>

      <v-card-actions>
        <v-spacer />
        <v-btn text v-if="cancellable" @click="cancel">{{ labels.cancel }}</v-btn>
        <v-btn text @click="confirm" :disabled="!isValid()">{{ labels.confirm }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from "vue";
import { selectFile, selectFolder } from "@/vue/utils/ipcUtils";

export default {
  props: {
    header: String,
    description: String,
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
    },
  },
  data: (): Record<string, unknown> => ({
    dialog: false,
    output: {},
    resolve: null,
    reject: null
  }),
  methods: {
    open(): Promise<unknown> {
      Object.entries(this.inputs).forEach(([key, params]) => {
        this.setNonNull(key, params["default"]);
      });
      
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
      this.resolve(null);
      this.closeDialog();
    },
    closeDialog(): void {
      this.output = {};
      this.dialog = false;
    },
    isValid(): boolean {
      return Object.entries(this.inputs).every(([key, params]) => params["optional"] || this.output[key] != null);
    },
    setNonNull(key:string, value:unknown): void {
      if (value != null) Vue.set(this.output, key, value);
    },
    selectFile(key: string): void {
      selectFile(this.output[key]).then(result => this.setNonNull(key, result));
    },
    selectFolder(key: string): void {
      selectFolder(this.output[key]).then(result => this.setNonNull(key, result));
    }
  },
  provide(): Record<string, unknown> {
    return { confirm: this.confirm, cancel: this.cancel };
  }
};
</script>