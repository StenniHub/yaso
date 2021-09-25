<template>
  <v-container fluid class="main-container">
    <v-row class="settings-row">
      <v-col cols="6">
        <v-text-field outlined ref="zoom" v-model.number="modified.zoom" :rules="[zoom => zoom >= 0.5 && zoom <= 1.5]" />
      </v-col>
      <v-col>
        <p>Zoom level (0.5-1.5)</p>
      </v-col>
    </v-row>

    <div class="button-footer">
      <icon-button icon="mdi-close" :onClick="reset" tooltip="Discard changes" :disabled="!isModified()" />
      <icon-button icon="mdi-check" :onClick="save" tooltip="Save changes" :disabled="!isModified()" />
    </div>
  </v-container>
</template>

<script lang="ts">
import { mapActions, mapState } from "vuex";
import IconButton from "./IconButton.vue";

function deepCopy(input: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(input));
}

export default {
  components: { IconButton },
  data: (): Record<string, unknown> => ({
    modified: {}
  }),
  computed: mapState({
    session: state => state["session"]
  }),
  methods: {
    ...mapActions(["setSession"]),
    save(): void {
      if (this.validateSettings()) {
        this.setSession({ session: this.modified, save: true });
        this.reset();
      }
    },
    isModified(): boolean {
      return Object.entries(this.modified).some(([key, value]) => this.session[key] !== value);
    },
    reset(): void {
      this.modified = deepCopy(this.session);
    },
    validateSettings(): boolean {
      return Object.values(this.$refs).every((setting: any) => setting.validate());
    }
  },
  mounted(): void {
    this.reset();
  }
};
</script>
