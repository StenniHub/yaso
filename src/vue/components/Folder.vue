<template>
  <div class="file-container" ref="container">
    <file-button ref="fileButton" @click="() => select(false)" :name="name" :icon="icon" :is-selected="isSelected" :contextOptions="contextOptions" />

    <!-- Would prefer v-show here but causes files to be selectable when not visible -->
    <draggable v-if="isOpen" class="folder-content" :class="{ dragging: dragging }" v-bind="draggableProps" v-on="draggableHandlers">
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
import { invoke } from "@/vue/utils/ipcUtils";
import ConfirmDialog from "./ConfirmDialog.vue";
import Draggable from "vuedraggable";
import { mapState, mapMutations } from "vuex";

// Uses Vue.extend so we can refer to the component type and load dynamically
const Folder = Vue.extend({
  mixins: [File],
  components: { ConfirmDialog, Draggable },
  data: () => ({
    isFolder: true,
    isOpen: false,
    files: []
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
    onEvent(action: string) {
      if (action === "refresh") this.refresh();
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
      if (this.isSelected && this.isOpen) {
        this.deselect();
        return;
      }

      this.selectFile({ folder: this.path, file: null });
      if (keyEvent) this.scrollTo();
      else this.open();
    },
    deselect(): void {
      this.selectedFile = null;
      this.selectFile({ folder: null, file: null });
      this.close();
    },
    open(): void {
      this.isOpen = true;
      if (this.files.length === 0) this.refresh();
    },
    close(): void {
      this.isOpen = false;
    },
    toggleFolder(): void {
      if (this.isOpen) this.close();
      else this.open();
    },
    async refresh(): Promise<unknown> {
      this.isOpen = true;
      return invoke("readDir", this.path).then((files: FileObject[]) => {
        this.files = files;
      });
    }
  },
  mounted(): void {
    this.contextOptions = this.contextOptions.filter(opt => opt.name !== "Replace");  // Not valid for folders
    this.contextOptions.unshift({ name: "Refresh", action: this.refresh })
    if (this.isOnSelectionPath) this.open();
  }
});

export default Folder;
</script>