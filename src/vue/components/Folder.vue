<template>
  <div class="file-container" ref="container">
    <file-button ref="fileButton" @click="() => select(false)" :name="name" :icon="icon" :is-selected="isSelected" :contextOptions="contextOptions" />

    <draggable v-show="isOpen" class="folder-content" :class="{ dragging: dragging }" v-bind="draggableProps" v-on="draggableHandlers">
      <component ref="file" v-for="file in files" :is="getFileComponent(file)" :key="file.name" :dir="path" @parent="onEvent" />
    </draggable>

    <!-- TODO: Have these inside file button and trigger from outside? -->
    <confirm-dialog ref="renameDialog" :inputs="{ name: { type: 'text', label: 'Name of folder', default: name } }" />
    <confirm-dialog ref="deleteDialog" :header="'Are you sure you want delete ' + name + '?'" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import File from "./File.vue";
import { FileObject } from "@/common/files";
import { ipcRenderer, invoke, removeAllListeners } from "@/vue/utils/ipcUtils";
import ConfirmDialog from "./ConfirmDialog.vue";
import Draggable from "vuedraggable";
import { mapState, mapMutations } from "vuex";

// Uses Vue.extend so we can refer to the component type and load dynamically
const Folder = Vue.extend({
  mixins: [File],
  components: { ConfirmDialog, Draggable },
  data: () => ({
    isOpen: false,
    files: [],
    selectedFile: null
  }),
  computed: {
    isSelected(): boolean {
      return this.game.selected.folder == this.path && this.game.selected.file == null;
    },
    isOnSelectionPath(): boolean {
      return (this.game.selected.folder + "\\").startsWith(this.path + "\\");
    },
    icon(): string {
      return this.isOpen ? "mdi-folder-open" : "mdi-folder";
    },
    draggableProps(): Record<string, unknown> {
      return {
        disabled: this.disableDrag,
        group: "folderGroup",
        list: this.files,
        forceFallback: true,
        scrollSensitivity: 80
      }
    },
    draggableHandlers(): Record<string, unknown> {
      return {
        change: this.onFileMove,
        start: this.startDrag,
        end: this.endDrag
      }
    },
    ...mapState({
      dragging: state => state["dragging"],
      disableDrag: state => state["session"].disableDrag
    })
  },
  methods: {
    ...mapMutations(["setDragging"]),
    startDrag(): void {
      this.setDragging(true);
    },
    endDrag(): void {
      this.setDragging(false);
    },
    onEvent(action: string, payload: Record<string, unknown>) {
      if (action === "selectNext") this.selectNext();
      else if (action === "selectPrevious") this.selectPrevious();
      else if (action === "selectFileByName") this.selectFileByName(payload.name);
      else if (action === "refresh") this.refresh();
    },
    async onFileMove(event): Promise<void> {
      // TODO: Can we just revert move events instead of refreshing, and only update on added/removed?
      if (event.added) {
        const file: FileObject = event.added.element;
        const toPath = this.path + "\\" + file.name;
        
        // Have to exclude file with original path, since VueDraggable has already moved it to the new list
        if (this.files.some(otherFile => otherFile.name === file.name && otherFile.path !== file.path)) {
          invoke("errorMsg", "A file with the same name already exists");
        } else {
          await invoke("move", file.path, toPath);
        }
      }

      this.refresh();
    },
    getFileComponent(file: FileObject) {
      return file.isFolder ? Folder : File;
    },
    isFileSelected(file: FileObject): boolean {
      return file.path == (this.game.selected.folder + "\\" + this.game.selected.file);
    },
    isFileOnSelectionPath(file: FileObject): boolean {
      return (this.game.selected.folder + "\\").startsWith(file.path + "\\");
    },
    select(keyEvent: boolean): void {
      if (keyEvent) this.scrollTo();
      else this.toggleFolder();

      const selectedPath = this.isSelected && !this.isOpen ? null : this.path;
      this.selectFile({ folder: selectedPath, file: null });
      this.selectedFile = null;
      this.refreshListeners();

      if (!this.isRoot) this.$emit("parent", "selectFileByName", { name: this.name });
    },
    open(): void {
      this.isOpen = true;
      if (this.files.length === 0) this.refresh();
    },
    close(): void {
      this.isOpen = false;
    },
    toggleFolder(): void {
      if (!this.isOpen) this.open();
      else if (this.isSelected) this.close();
    },
    selectNextFromParent() {
      this.selectedFile = null;
      this.$emit("parent", "selectNext");
    },
    selectPreviousFromParent() {
      this.selectedFile = null;
      this.$emit("parent", "selectPrevious");
    },
    selectNext(): void {
      const files = this.files;
      const selectedFile = this.selectedFile;

      if (selectedFile == null) {
        if (this.isOpen && files.length > 0) this.selectFileElement(files[0]);
        else if (!this.isRoot) this.selectNextFromParent();
        return;
      }

      const selectedIdx = files.indexOf(selectedFile);
      if (selectedIdx < files.length - 1) this.selectFileElement(files[selectedIdx + 1])
      else if (this.isRoot) this.selectFileElement(files[0])
      else this.selectNextFromParent();
    },
    selectPrevious(): void {
      const files = this.files;
      const selectedFile = this.selectedFile;

      if (selectedFile == null) {
        if (this.isRoot) this.selectLast();
        else this.selectPreviousFromParent();
        return;
      }

      const selectedIdx = files.indexOf(selectedFile);
      if (selectedIdx > 0) {
        const prevElement = this.getFileElement(files[selectedIdx - 1]);
        if (prevElement.isOpen && prevElement.files.length > 0) prevElement.selectLast();
        else prevElement.select(true);
        return;
      }

      if (this.isRoot) this.selectLast()
      else this.select(true);
    },
    selectLast() {
      if (this.files.length === 0) {
        this.select(true);
        return;
      }

      const lastElement = this.getFileElement(this.files[this.files.length - 1]);
      if (lastElement.isOpen) lastElement.selectLast();
      else lastElement.select(true);
    },
    refresh() {
      this.isOpen = true;
      invoke("readDir", this.path).then((files: FileObject[]) => {
        this.files = files;
        for (const file of files) {
          if (this.isFileSelected(file) || this.isFileOnSelectionPath(file)) {
            this.selectedFile = file;
            break;
          }
        }
      });
    },
    refreshListeners(): void {
      // TODO: Mixins does not allow calling super methods. Enforce inheritance some other way or wait for Vue 3 to mature?
      removeAllListeners();
      ipcRenderer.on("selectNext", () => this.selectNext());
      ipcRenderer.on("selectPrevious", () => this.selectPrevious());
      ipcRenderer.on("refreshSelected", this.refresh);
      ipcRenderer.on("toggleFolder", this.toggleFolder);
    },
    getFileElement(file: FileObject) {
      return this.$refs.file.find(element => element.name == file.name);
    },
    selectFileElement(file: FileObject) {
      this.selectedFile = file;
      this.getFileElement(file).select(true);
    },
    selectFileByName(name: string) {
      this.selectedFile = this.files.find(file => file.name == name);
      if (!this.isRoot) this.$emit("parent", "selectFileByName", { name: this.name });
    }
  },
  mounted(): void {
    this.contextOptions.unshift({ name: "Refresh", action: this.refresh })

    if (this.isOnSelectionPath) this.open();
  }
});

export default Folder;
</script>