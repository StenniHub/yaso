<template>
  <div class="settings-container">
    <v-container fluid class="main-container small">
      <v-row class="settings-row">
        <v-col cols="4">
          <v-text-field outlined ref="zoom" v-model.number="modified.zoom" :rules="[zoom => zoom >= 0.5 && zoom <= 1.5]" />
        </v-col>
        <v-col>
          <p>Zoom level (0.5-1.5)</p>
        </v-col>
      </v-row>

      <v-row class="settings-row">
        <v-col cols="4">
          <v-checkbox v-model.number="modified.useProfiles" />
        </v-col>
        <v-col>
          <p>Enable game profiles</p>
        </v-col>
      </v-row>

      <v-row class="settings-row">
        <v-col cols="4">
          <v-checkbox v-model.number="modified.disableDrag" />
        </v-col>
        <v-col>
          <p>Disable dragging of files and folders</p>
        </v-col>
      </v-row>

      <br>
      <br>
      <v-row class="settings-row">
        <v-col>
          <v-btn @click="clearCache" :disabled="cacheEntries < 1">Clear Cache</v-btn>
        </v-col>
      </v-row>
    </v-container>

    <div class="button-footer">
      <icon-button icon="mdi-close" :onClick="reset" tooltip="Discard changes" :disabled="!isModified" />
      <icon-button icon="mdi-check" :onClick="save" tooltip="Save changes" :disabled="!isModified" />
    </div>
  </div>

</template>

<script lang="ts">
import { mapActions, mapState } from "vuex";
import { invoke } from "../utils/ipcUtils";
import IconButton from "./IconButton.vue";

function deepCopy(input: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(input));
}

export default {
  components: { IconButton },
  data: (): Record<string, unknown> => ({
    cacheEntries: localStorage.length,
    modified: {}
  }),
  computed: {    
    isModified(): boolean {
      return Object.entries(this.modified).some(([key, value]) => this.session[key] !== value);
    },
    ...mapState({
      session: state => state["session"]
    })
  },
  methods: {
    ...mapActions(["setSession"]),
    save(): void {
      if (this.validateSettings()) {
        this.setSession({ session: this.modified, save: true });
        this.reset();
      }
    },
    reset(): void {
      this.modified = deepCopy(this.session);
    },
    validateSettings(): boolean {
      return Object.values(this.$refs).every((setting: any) => setting.validate());
    },
    clearCache(): void {
      localStorage.clear();
      this.cacheEntries = localStorage.length;
      invoke("successMsg", "Cache cleared");
    }
  },
  mounted(): void {
    this.reset();
  }
};
</script>
