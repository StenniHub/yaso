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
      <component ref="file" v-for="file in files" :is="componentType(file)" :key="file.name" :name="file.name" :path="file.path" />
    </v-container>

    <div class="button-footer">
      <icon-button icon="mdi-folder-plus" :onClick="newFolder" tooltip="Create new folder" />
      <icon-button icon="mdi-file-move" :onClick="importSavefile" tooltip="Import savefile" />
      <icon-button icon="mdi-file-restore" :onClick="loadSavefile" tooltip="Load savefile" :disabled="!isFileSelected()" />
    </div>

    <!-- v-for causes ref to return an array, this will be changed in vue 3 -->
    <div v-for="([ref, params]) in Object.entries(dialogs)" :key="ref">
      <confirm-dialog :ref="ref" :header="params.header" :inputs="params.inputs" />
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
  computed: mapState({
    game: state => state["game"],
    images: state => state["images"],
    dialogs: state => {
      const game = state["game"] || {};
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
            file: { type: 'text', label: 'Name of file', default: game.savefile && game.savefile.split("\\").pop() }
          }
        },
        settingsDialog: {
          inputs: {
            savefile: { type: 'file', label: 'Path to savefile', default: game.savefile },
            backups: { type: 'folder', label: 'Path to backups', default: game.backups }
          }
        }
      }
    }
  }),
  methods: {
    ...mapActions(["saveGames"]),
    getPath(): string {  // Overrides value when calling refresh and when children ask for parent path
      return this.game.backups;
    },
    isFileSelected(): boolean {
      this.isSelected();  // Required to refresh listeners
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
        const basePath = this.game.selected.folder || this.getPath();
        if (output != null) invoke("createFolder", basePath + "\\" + output.folder).then(this.refreshSelected);
      });
    },
    importSavefile(): void {
      this.$refs.fileDialog[0].open().then(output => {
        const basePath = this.game.selected.folder || this.getPath();
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