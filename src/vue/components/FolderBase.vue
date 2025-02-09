<script lang="ts">
import File from "./File.vue";
import { FolderResult } from "@/common/files";
import { invoke } from "@/vue/utils/ipcUtils";
import { mapState, mapMutations } from "vuex";
  
// Very poor code structure, rewrite root so it does not depend on this component
export default {
  mixins: [File],
  data: () => ({
    isFolder: true,
    isOpen: false
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
    ...mapMutations(["setDragging", "addFolder"]),
    async refresh(): Promise<unknown> {
      this.isOpen = true;
      return invoke("readDir", this.path).then((result: FolderResult) => {
        this.addFolder({path: this.path, result: result});
      });
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
    startDrag(): void {
      this.setDragging(true);
    },
    endDrag(): void {
      this.setDragging(false);
    },
    async onFileMove(event): Promise<void> {
      // TODO: Can we just revert move events instead of refreshing, and only update on added/removed?
      if (event.added) {
        const file: FolderResult = event.added.element;
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
    }
  },
  mounted(): void {
    this.contextOptions = this.contextOptions.filter(opt => opt.name !== "Replace");  // Not valid for folders
    this.contextOptions.unshift({ name: "Refresh", action: this.refresh })
    if (this.isOnSelectionPath) this.open();
  }
}
</script>