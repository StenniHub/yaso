<script lang="ts">
import Vue from "vue";
import File from "./File.vue";
import { FileObject } from "@/common/files";
import { ipcRenderer, invoke, removeAllListeners } from "@/vue/utils/ipcUtils";

// Uses Vue.extend so we can refer to the component type and load dynamically
const Folder = Vue.extend({
  mixins: [File],
  data: () => ({
    isFolder: true,
    isOpen: false,
    isRoot: false,
    files: [],
    selectedFile: null
  }),
  methods: {
    getIcon(): string {
      return this.isOpen ? "mdi-folder-open" : "mdi-folder";
    },
    isOnSelectionPath(): boolean {
      return (this.game.selected.folder + "\\").startsWith(this.path + "\\"); 
    },
    isSelected(): boolean {
      const isSelected = this.game.selected.folder == this.path && this.game.selected.file == null;
      if (isSelected) this.refreshListeners();
      return isSelected;
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

      const selectedPath = this.isSelected() && !this.isOpen ? null : this.path;
      this.selectFile({ folder: selectedPath, file: null });
      this.selectedFile = null;
      this.refreshListeners();
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
      else if (this.isSelected()) this.close();
    },
    selectNextFromParent() {
      this.selectedFile = null;
      this.$parent.selectNext();
    },
    selectPreviousFromParent() {
      this.selectedFile = null;
      this.$parent.selectPrevious();
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
      if (selectedIdx >= 1) {
        const prevFile = files[selectedIdx - 1];
        const prevElement = this.getFileElement(prevFile);
        if (prevElement.isOpen && prevElement.files.length > 0) prevElement.selectLast();
        else this.selectFileElement(prevFile);
        return;
      }

      if (this.isRoot) this.selectLast()
      else this.select(true);
    },
    selectLast() {
      const lastFile = this.files[this.files.length - 1];
      const lastElement = this.getFileElement(lastFile);
      if (lastElement.isOpen) lastElement.selectLast();
      else this.selectFileElement(lastFile);
    },
    async refresh(): Promise<unknown> {
      this.isOpen = true;
      return invoke("readDir", this.getPath()).then((files: FileObject[]) => {
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
    selectFileElement(file: FileObject) {
      this.selectedFile = file;
      this.getFileElement(file).select(true);
    },
    getFileElement(file: FileObject) {
      return this.$refs.file.find(element => element.name == file.name);
    },
    selectFileByName(name: string) {
      this.selectedFile = this.files.find(file => file.name == name);
      if (!this.isRoot) this.$parent.selectFileByName(this.name);
    }
  },
  mounted(): void {
    if (this.isOnSelectionPath()) this.open();
  }
});

export default Folder;
</script>