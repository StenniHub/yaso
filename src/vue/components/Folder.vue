<script lang="ts">
import Vue from "vue";
import File from "./File.vue";
import { FileObject } from "@/common/files";
import { ipcRenderer, invoke } from "@/vue/utils/ipcUtils";

// Uses Vue.extend so we can refer to the component type and load dynamically
const Folder = Vue.extend({
  mixins: [File],
  data: () => ({
    isFolder: true,
    isOpen: false,
    isRoot: false,
    files: []
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
    select(keyEvent: boolean): void {
      if (keyEvent) this.scrollTo();
      else this.toggleFolder();

      const selectedPath = this.isSelected() && !this.isOpen ? null : this.path;
      this.selectFile({ folder: selectedPath, file: null });
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
    selectNext(caller: File): void {
      const files = this.$refs.file;
      if (caller == null) {  // Called directly from hotkey
        if (this.isOpen && files.length > 0) files[0].select(true);
        else if (!this.isRoot) this.$parent.selectNext(this);
        return;
      }

      const callerIdx = files.indexOf(caller);  // Called from child file
      if (callerIdx + 1 < files.length) files[callerIdx + 1].select(true);
      else if (this.isRoot) files[0].select(true);
      else this.$parent.selectNext(this);
    },
    selectPrevious(caller: File): void {
      if (caller == null) {  // Called directly from hotkey
        if (this.isRoot) this.selectLast();
        else this.$parent.selectPrevious(this);
        return;
      }

      const files = this.$refs.file;
      const callerIdx = files.indexOf(caller);    // Called from child file
      if (callerIdx - 1 >= 0) {
        const prev = files[callerIdx - 1];
        if (prev.isOpen && prev.files.length > 0) prev.selectLast();
        else prev.select(true);
        return;
      }

      if (this.isRoot) this.selectLast()
      else this.select(true);
    },
    selectLast() {
      const files = this.$refs.file;
      const last = files[files.length - 1];
      if (last.isOpen) last.selectLast();
      else last.select(true);
    },
    async refresh(): Promise<unknown> {
      this.isOpen = true;
      return invoke("readDir", this.getPath()).then((files: FileObject[]) => this.files = files);
    },
    refreshListeners(): void {
      // TODO: Mixins does not allow calling super methods. Enforce inheritance some other way or wait for Vue 3 to mature?
      this.removeAllListeners();
      ipcRenderer.on("selectNext", () => this.selectNext());
      ipcRenderer.on("selectPrevious", () => this.selectPrevious());
      ipcRenderer.on("refreshSelected", this.refresh);
      ipcRenderer.on("toggleFolder", this.toggleFolder);
    }
  },
  mounted(): void {
    if (this.isOnSelectionPath()) this.open();
  }
});

export default Folder;
</script>