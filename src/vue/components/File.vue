<template>
  <div class="file-container" ref="container">
    <file-button ref="fileButton" @click="() => select(false)" :name="name" icon="mdi-file" :is-selected="isSelected" :contextOptions="contextOptions" />

    <confirm-dialog ref="renameDialog" :inputs="{ name: { type: 'text', label: 'Name of file', default: name } }" />
    <confirm-dialog ref="deleteDialog" :header="'Are you sure you want delete ' + name + '?'" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { mapState, mapActions } from "vuex";
import { ipcRenderer, invoke, removeAllListeners } from "@/vue/utils/ipcUtils";
import { scrollToElement } from "@/vue/utils/domUtils";
import FileButton from "./FileButton.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

// Uses Vue.extend so we can refer to the component type and load dynamically
const File = Vue.extend({
  components: { FileButton, ConfirmDialog },
  props: {
    dir: String
  },
  data: (): Record<string, unknown> => ({
    contextOptions: [],
    isRoot: false
  }),
  computed: {
    name(): string {
      return this.$vnode.key;
    },
    path(): string {
      return this.dir + "\\" + this.name;
    },
    isSelected(): boolean {
      return (this.game.selected.folder + "\\" + this.game.selected.file) === this.path;
    },
    ...mapState({
      game: state => state["game"]
    })
  },
  methods: {
    ...mapActions(["selectFile"]),
    select(isKeyEvent: boolean): void {
      if (this.isSelected) {
        this.deselect();
        return;
      }
      
      this.selectFile({ folder: this.dir, file: this.name });
      this.$emit("parent", "selectFileByName", { name: this.name });
      this.refreshListeners();
      
      if (isKeyEvent) this.scrollTo();
    },
    deselect() {
      if (this.isSelected) {
        this.selectFile({ folder: null, file: null });
        removeAllListeners();
      }
    },
    selectNext(): void {
      if (this.isSelected) this.$emit("parent", "selectNext");
    },
    selectPrevious(): void {
      if (this.isSelected) this.$emit("parent", "selectPrevious");
    },
    revealInExplorer(): void {
      invoke("revealInExplorer", this.path);
    },
    renameFile(): void {
      this.$refs.renameDialog.open().then(output => {
        if (output == null) return;

        invoke("move", this.path, this.dir + "\\" + output.name).then(() => {
          this.deselect();  // Deselect to prevent attempt to load non-existing file
          this.$emit("parent", "refresh");
        });
      });
    },
    replaceFile(): void {
      invoke("copyFile", this.game.savefile, this.path);
    },
    deleteFile(): void {
      this.$refs.deleteDialog.open().then(output => {
        this.deselect();
        if (output != null) invoke("remove", this.path).then(() => this.$emit("parent", "refresh"));
      });
    },
    refreshListeners(): void {
      removeAllListeners();
      ipcRenderer.on("selectNext", this.selectNext);
      ipcRenderer.on("selectPrevious", this.selectPrevious);
      ipcRenderer.on("refreshSelected", () => this.$emit("parent", "refresh"));
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
      { name: "Replace", action: this.replaceFile },
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
