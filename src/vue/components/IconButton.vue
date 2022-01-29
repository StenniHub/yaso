<template>
  <v-tooltip v-bind="{[tipPos]: true}">
    <template v-slot:activator="{ on }">
      <v-btn v-bind="{[size]: true}" icon @click="click" :disabled="disabled" v-on="on">
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
    size: {
      type: String,
      default: 'x-large'
    },
    tooltip: String,
    tipPos: {
      type: String,
      default: 'top'
    }
  },
  methods: {
    click(): void {
      this.onClick();
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    }
  }
}
</script>