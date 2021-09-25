<template>
  <v-tooltip top>
    <template v-slot:activator="{ on }">
      <v-btn x-large icon @click="click" :disabled="disabled" v-on="on">
        <v-icon>{{ icon }}</v-icon>
      </v-btn>
    </template>
    <span v-if="tooltip">{{ tooltip }}</span>
  </v-tooltip>
</template>

<script lang="ts">
export default {
  props: {
    icon: String,
    onClick: Function,
    disabled: Boolean,
    tooltip: String
  },
  methods: {
    click(): void {
      this.onClick();
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
  }
}
</script>