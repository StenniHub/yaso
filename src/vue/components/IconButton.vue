<template>
  <div class="icon-button">
    <v-tooltip v-bind="{ [tipPos]: true }" :disabled="hideTooltip">
      <template v-slot:activator="{ on: tipOn }">
        <v-btn v-bind="{ [size]: true }" icon @click="click" :disabled="disabled" v-on="{ ...tipOn, ...on }">
          <v-icon v-bind="{ [size]: true }">{{ icon }}</v-icon>
        </v-btn>
      </template>
      <span>{{ tooltip }}</span>
    </v-tooltip>
  </div>
</template>

<script lang="ts">
export default {
  props: {
    icon: String,
    onClick: {
      type: Function,
      default: (): void => null
    },
    disabled: Boolean,
    on: Object,
    size: {
      type: String,
      default: 'large'
    },
    tooltip: String,
    tipPos: {
      type: String,
      default: 'top'
    }
  },
  computed: {
    hideTooltip(): boolean {
      return this.tooltip == null;
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