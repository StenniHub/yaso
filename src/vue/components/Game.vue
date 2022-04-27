<template>
  <div class="game-main">
    <v-btn icon class="game-settings-btn" @click="editSettings">
      <v-icon>mdi-cog</v-icon>
    </v-btn>

    <v-img class="background-image" :src="images[game.img]" />

    <div class="game-header">
      <h1>{{ game.title }}</h1>
    </div>

    <v-container v-if="validSettings()" id="root-folder">
      <component ref="file" v-for="file in files" :is="componentType(file)" :key="file.name" :name="file.name" :dir="path" @parent="onEvent" />
    </v-container>

    <div class="button-footer">
      <icon-button icon="mdi-folder-plus" :onClick="newFolder" tooltip="Create new folder" />
      <icon-button icon="mdi-file-move" :onClick="importSavefile" tooltip="Import savefile" />
      <icon-button icon="mdi-file-restore" :onClick="loadSavefile" tooltip="Load savefile" :disabled="!isFileSelected()" />
    </div>

    <!-- v-for causes ref to return an array, this will be changed in vue 3 -->
    <div v-for="([id, params]) in Object.entries(dialogs)" :key="id">
      <confirm-dialog :ref="id" :header="params.header" :inputs="params.inputs" />
    </div>
  </div>
</template>

<script lang="ts">
import { mapActions, mapState } from "vuex";
import { invoke, removeAllListeners } from "@/vue/utils/ipcUtils";
import ConfirmDialog from "./ConfirmDialog.vue";
import IconButton from "./IconButton.vue";
import Folder from "./Folder.vue";

export default {
  components: { ConfirmDialog, IconButton },
  mixins: [Folder],  // Makes the game view act as a root folder, but with overriden template and logic
  data: (): Record<string, unknown> => ({
    isRoot: true
  }),
  computed: {
    path(): string {
      return this.game.backups;
    },
    isSelected(): boolean {
      return this.game.selected.folder == null && this.game.selected.file == null;
    },
    dialogs(): Record<string, unknown> {
      return {
        folderDialog: {
          header: "Create new folder",
          inputs: {
            folder: { type: 'text', label: 'Name of folder' }
          }
        },
        fileDialog: {
          header: "Import savefile",
          inputs: {
            file: { type: 'text', label: 'Name of file', default: this.game.savefile && this.game.savefile.split("\\").pop() }
          }
        },
        settingsDialog: {
          inputs: {
            savefile: { type: 'file', label: 'Path to savefile', default: this.game.savefile },
            backups: { type: 'folder', label: 'Path to backups', default: this.game.backups }
          }
        }
      }
    },
    ...mapState({
      game: state => state["game"],
      images: state => state["images"]
    })
  },
  methods: {
    ...mapActions(["saveGames"]),
    isFileSelected(): boolean {
      if (this.isSelected) this.refreshListeners();  // TODO: Find a better place to do this

      return this.game.selected.file != null;
    },
    validSettings(): boolean {
      return this.game.savefile != null && this.game.backups != null;
    },
    editSettings(): void {
      this.$refs.settingsDialog[0].open().then(output => {
        if (output != null) {
          this.game.savefile = output.savefile;
          this.game.backups = output.backups;
          this.saveGames();
          this.refresh();
        }
      });
    },
    newFolder(): void {
      this.$refs.folderDialog[0].open().then(output => {
        const basePath = this.game.selected.folder || this.path;
        if (output != null) invoke("createFolder", basePath + "\\" + output.folder).then(this.refreshSelected);
      });
    },
    importSavefile(): void {
      this.$refs.fileDialog[0].open().then(output => {
        const basePath = this.game.selected.folder || this.path;
        if (output != null) invoke("copyFile", this.game.savefile, basePath + "\\" + output.file).then(this.refreshSelected);
      });
    },
    loadSavefile(): void {
      invoke("loadSavefile");
    },
    refreshSelected(): void {
      invoke("refreshSelected");  // TODO: Very roundabout way of triggering event, can we do this directly instead? (this.$root does not have removeAllListeners)
    }
  },
  mounted(): void {
    if (this.game == null) {
      this.$router.push("/");
      return;
    }

    if (!this.validSettings()) {
      this.editSettings();
    } else {
      this.refresh();
    }
  },
  destroyed(): void {
    removeAllListeners();
  }
};
</script>
