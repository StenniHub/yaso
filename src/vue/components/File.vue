<template>
  <div class="file-container" ref="container">
    <file-button ref="fileButton" :click="() => select(false)" :name="name" icon="mdi-file" :is-selected="isSelected" :contextOptions="contextOptions" />

    <confirm-dialog ref="renameDialog" :inputs="{ name: { type: 'text', label: 'Name of file', default: name } }" />
    <confirm-dialog ref="deleteDialog" :header="'Are you sure you want delete ' + name + '?'" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState, mapActions } from "vuex";
import { ipcRenderer, invoke, removeAllListeners } from "@/vue/utils/ipcUtils";
import { scrollToElement } from "@/vue/utils/domUtils";
import Folder from "./Folder.vue";
import FileButton from "./FileButton.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

// Uses Vue.extend so we can refer to the component type and load dynamically
const File = Vue.extend({
  components: { FileButton, ConfirmDialog },
  props: {
    name: String,
    path: String,
    parent: Folder  // TODO: Remove this dependency
  },
  data: (): Record<string, unknown> => ({
    contextOptions: [],
    isRoot: false
  }),
  computed: {
    isSelected(): boolean {
      return (this.game.selected.folder + "\\" + this.game.selected.file) === this.path;
    },
    ...mapState({
      game: state => state["game"]
    })
  },
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
    select(isKeyEvent: boolean): void {
      if (isKeyEvent) this.scrollTo();
      
      if (!this.isSelected) {
        this.selectFile({ folder: this.parent.getPath(), file: this.name });
        this.parent.selectFileByName(this.name);
        this.refreshListeners();
      } else {
        this.selectFile({ folder: null, file: null });
      }     
    },
    selectNext(): void {
      if (this.isSelected) this.parent.selectNext();
    },
    selectPrevious(): void {
      if (this.isSelected) this.parent.selectPrevious();
    },
    revealInExplorer(): void {
      invoke("revealInExplorer", this.path);
    },
    renameFile(): void {
      this.$refs.renameDialog.open().then(output => {
        if (output != null) invoke("rename", this.path, this.parent.getPath() + "\\" + output.name).then(() => {
          this.parent.refresh().then(() => {
            if (this.isSelected) this.select();
          });
        });
      });
    },
    deleteFile(): void {
      this.$refs.deleteDialog.open().then(output => {
        if (this.isSelected) this.selectFile({ folder: null, file: null });
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
      scrollToElement(document.getElementById("root-folder"), this.$refs.fileButton.$el);
    },
    openMenu(event, menuActivator) {
      this.$refs.container.click(event);  // Click somewhere else first to close existing menus
      menuActivator.click(event);
    }
  },
  mounted(): void {
    this.contextOptions = [
      { name: "Reveal in explorer", action: this.revealInExplorer },
      { name: "Rename", action: this.renameFile },
      { name: "Delete", action: this.deleteFile }
    ]

    if (this.isSelected) {
      this.refreshListeners();
      if (!this.isRoot) setTimeout(this.scrollTo, 0);  // Does not work without tiny delay
    }
  }
});

export default File;
</script>
