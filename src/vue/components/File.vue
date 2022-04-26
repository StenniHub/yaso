<template>
  <div class="file-container" ref="container">
    <v-menu absolute offset-y>
      <template v-slot:activator="{ on }">
        <v-btn text ref="root" :class="{ selected: isSelected() }" @click="select(false)" @contextmenu="(event) => openMenu(event, on)">
          <v-icon large>{{ getIcon() }}</v-icon>
          <v-card-title v-text="name" />
        </v-btn>
      </template>

      <v-list class="context-menu">
        <v-list-item v-if="isFolder" @click="refresh">
          <v-list-item-title>Refresh</v-list-item-title>
        </v-list-item>
        <v-list-item @click="revealInExplorer">
          <v-list-item-title>Reveal in explorer</v-list-item-title>
        </v-list-item>
        <v-list-item @click="renameFile">
          <v-list-item-title>Rename</v-list-item-title>
        </v-list-item>
        <v-list-item @click="deleteFile">
          <v-list-item-title>Delete</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <div v-if="isFolder" v-show="isOpen" class="folder-content">
      <component ref="file" v-for="file in files" :is="componentType(file)" :key="file.name" :name="file.name" :path="file.path" :parent="self()" />
    </div>

    <confirm-dialog ref="renameDialog" :inputs="{ name: { type: 'text', label: 'Name of ' + (isFolder ? 'folder' : 'file'), default: name } }" />
    <confirm-dialog ref="deleteDialog" :header="'Are you sure you want delete ' + name + '?'" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState, mapActions } from "vuex";
import ConfirmDialog from "./ConfirmDialog.vue";
import { FileObject } from "@/common/files";
import { ipcRenderer, invoke, removeAllListeners } from "@/vue/utils/ipcUtils";
import { scrollToElement } from "@/vue/utils/domUtils";
import Folder from "./Folder.vue";

// Uses Vue.extend so we can refer to the component type and load dynamically
const File = Vue.extend({
  components: { ConfirmDialog },
  props: {
    name: String,
    path: String,
    parent: Folder
  },
  data: (): Record<string, unknown> => ({
    isFolder: false,
    isOpen: false
  }),
  computed: mapState({
    game: state => state["game"]
  }),
  methods: {
    ...mapActions(["selectFile"]),
    self() {  // Passing "this" as prop or saving "this" on data was not working, hacky workaround
      return this;
    },
    getPath(): string {
      return this.path;
    },
    getIcon(): string {
      return "mdi-file";
    },
    componentType(file: FileObject) {
      return file.isFolder ? Folder : File;
    },
    isSelected(): boolean {
      return (this.game.selected.folder + "\\" + this.game.selected.file) === this.path;
    },
    select(isKeyEvent: boolean): void {
      if (isKeyEvent) this.scrollTo();
      
      if (!this.isSelected()) {
        this.selectFile({ folder: this.parent.getPath(), file: this.name });
        this.parent.selectFileByName(this.name);
        this.refreshListeners();
      } else {
        this.selectFile({ folder: null, file: null });
      }     
    },
    selectNext(): void {
      if (this.isSelected()) this.parent.selectNext();
    },
    selectPrevious(): void {
      if (this.isSelected()) this.parent.selectPrevious();
    },
    revealInExplorer(): void {
      invoke("revealInExplorer", this.path);
    },
    renameFile(): void {
      this.$refs.renameDialog.open().then(output => {
        const isSelected = this.isSelected();
        if (output != null) invoke("rename", this.path, this.parent.getPath() + "\\" + output.name).then(() => {
          this.parent.refresh().then(() => {
            if (isSelected) this.select();
          });
        });
      });
    },
    deleteFile(): void {
      this.$refs.deleteDialog.open().then(output => {
        if (this.isSelected()) this.selectFile({ folder: null, file: null });
        if (output != null) invoke("remove", this.path).then(this.parent.refresh);
      });
    },
    refreshListeners(): void {
      removeAllListeners();
      ipcRenderer.on("selectNext", () => this.selectNext());
      ipcRenderer.on("selectPrevious", () => this.selectPrevious());
      ipcRenderer.on("refreshSelected", this.parent.refresh);
    },
    scrollTo(): void {
      scrollToElement(document.getElementById("root-folder"), this.$refs.root.$el);
    },
    openMenu(event, menuActivator) {
      this.$refs.container.click(event);  // Click somewhere else first to close existing menus
      menuActivator.click(event);
    }
  },
  mounted(): void {
    if (!this.isRoot && this.isSelected()) {
      this.refreshListeners();
      setTimeout(this.scrollTo, 0);  // Does not work without tiny delay
    }
  }
});

export default File;
</script>
