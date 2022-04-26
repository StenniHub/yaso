<template>
  <div class="file-button" ref="root">
    <v-menu absolute offset-y>
      <template v-slot:activator="{ on }">
        <v-btn text :class="{ selected: isSelected }" @click="click" @contextmenu="(event) => openMenu(event, on)">
          <v-icon large>{{ icon }}</v-icon>
          <v-card-title v-text="name" />
        </v-btn>
      </template>

      <v-list class="context-menu">
        <v-list-item v-for="option in contextOptions" :key="option.name" @click="option.action">
          <v-list-item-title>{{option.name}}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

  </div>
</template>

<script lang="ts">
export default {
  props: {
    click: Function,
    name: String,
    icon: String,
    isSelected: Boolean,
    contextOptions: Array
  },
  methods: {
    openMenu(event: Event, menuActivator: any): void {
      this.$refs.root.click(event);  // Click somewhere else first to close existing menus
      menuActivator.click(event);
    }
  }
};
</script>