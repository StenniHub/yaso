<template>
  <div class="game-main" v-if="game">
    
    <div class="game-settings">
      <v-menu v-if="useProfiles" left max-height="10rem">
        <template v-slot:activator="{ on, attrs }">
          <v-btn icon v-bind="attrs" v-on="on">
            <v-icon>mdi-account</v-icon>
          </v-btn>
        </template>

        <v-list class="context-menu centered">
          <v-list-item v-if="getProfile() != null" @click="selectProfile(null)">
            <v-list-item-title>(no profile)</v-list-item-title>
          </v-list-item>
          
          <v-list-item v-for="profile in profiles.filter(profile => profile != getProfile())" :key="profile" @click="selectProfile(profile)">
            <v-list-item-title>{{profile}}</v-list-item-title>
          </v-list-item>

          <v-list-item @click="addProfile">
            <v-list-item-title>
              <v-icon>mdi-plus</v-icon>
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </v-menu>


      <v-btn icon @click="editSettings">
        <v-icon>mdi-cog</v-icon>
      </v-btn>
    </div>

    <v-img class="background-image" :src="images[game.img]" />

    <div class="game-header">
      <h2>{{ getProfile() || game.title }}</h2>
    </div>

    <v-container v-if="validSettings" id="root-folder">
      <draggable v-bind="draggableProps" v-on="draggableHandlers">
        <component ref="file" v-for="file in files" :is="getFileComponent(file)" :key="file.name" :dir="path" @parent="onEvent" />
      </draggable>
    </v-container>

    <div class="button-footer">
      <icon-button icon="mdi-folder-plus" :onClick="newFolder" tooltip="Create new folder" />
      <icon-button icon="mdi-file-move" :onClick="importSavefile" tooltip="Import savefile" />
      <icon-button icon="mdi-file-restore" :onClick="loadSavefile" tooltip="Load savefile" :disabled="!canLoadSavefile" />
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
import Draggable from "vuedraggable";

export default {
  components: { ConfirmDialog, IconButton, Draggable },
  mixins: [Folder],  // Makes the game view act as a root folder, but with overriden template and logic
  data: (): Record<string, unknown> => ({
    isRoot: true,
    profiles: [],
    profile: null
  }),
  computed: {
    gameId(): string {
      return this.$route.params.id;
    },
    useProfiles(): boolean {
      return this.session && this.session.useProfiles;
    },
    path(): string {
      return this.getProfile() ? this.game.backups + "\\" + this.profile : this.game.backups;
    },
    isSelected(): boolean {
      return this.game.selected.folder == null && this.game.selected.file == null;
    },
    canLoadSavefile(): boolean {
      if (this.isSelected) this.refreshListeners();  // TODO: Find a better place to do this
      return this.game.selected.file != null;
    },
    validSettings(): boolean {
      return this.game.savefile != null && this.game.backups != null;
    },
    dialogs(): Record<string, unknown> {
      return {
        profileDialog: {
          header: "Create new profile",
          inputs: {
            profile: { type: 'text', label: 'Name of profile' }
          }
        },
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
      images: state => state["images"],
      session: state => state["session"]
    })
  },
  methods: {
    ...mapActions(["selectGame", "saveGames"]),
    open(): void {
      // Do nothing
    },
    close(): void {
      // Do nothing
    },
    editSettings(): void {
      this.$refs.settingsDialog[0].open().then(output => {
        if (output == null) return;

        this.game.savefile = output.savefile;
        this.game.backups = output.backups;
        this.saveGames();
        this.refreshAll();
      });
    },
    addProfile(): void {
      this.$refs.profileDialog[0].open().then(output => {
        if (output == null || output.profile == null) return;

        const profile = output.profile;
        const profilePath = this.game.backups + "\\" + profile
        invoke("createFolder", profilePath).then(() => {
          this.profiles.push(profile);
          this.profiles.sort();
          this.selectProfile(profile);
        });
      });
    },
    getProfile(): string {  // Only return selected profile if it matches one of the root folders
      return this.profiles.includes(this.profile) ? this.profile : null;
    },
    newFolder(): void {  // TODO: If no folder is selected should add to profiles too
      this.$refs.folderDialog[0].open().then(output => {
        if (output == null || output.folder == null) return;

        const folderPath = (this.game.selected.folder || this.path) + output.folder;
        invoke("createFolder", folderPath).then(this.refreshSelected);
      });
    },
    importSavefile(): void {
      this.$refs.fileDialog[0].open().then(output => {
        if (output == null) return;

        const backupPath = (this.game.selected.folder || this.path) + "\\" + output.file;
        invoke("copyFile", this.game.savefile, backupPath).then(this.refreshSelected);
      });
    },
    loadSavefile(): void {
      invoke("loadSavefile");
    },
    refreshSelected(): void {
      invoke("refreshSelected");  // TODO: Very roundabout way of triggering event, can we do this directly instead? (this.$root does not have removeAllListeners)
    },
    saveConfig(): void {
      const config = {
        "profile": this.profile
      }

      localStorage[this.gameId] = JSON.stringify(config);
    },
    selectProfile(profile: string) {
      if (!this.profiles.includes(profile)) profile = null;

      this.selectFile({ folder: null, file: null });
      this.profile = profile;
      this.saveConfig();
      this.refresh();
    },
    refreshAll() {
      const selectedProfile = this.profile;
      this.profile = null;  // Make sure we are at the root folder for loading profiles

      this.refresh().then(() => {
        if (!this.useProfiles) return;

        this.profiles = this.files.filter(file => file.isFolder).map(folder => folder.name);
        this.profile = selectedProfile;
      });
    },
  },
  created(): void {
    this.selectGame(this.gameId);
    if (localStorage[this.gameId]) {
      // Write each value individually in case the parameter names change
      const savedConfig = JSON.parse(localStorage[this.gameId]);
      this.profile = savedConfig.profile;
    }
  },
  mounted(): void {
    if (!this.validSettings) {
      this.editSettings();
    } else {
      this.refreshAll();
    }
  },
  destroyed(): void {
    removeAllListeners();
  }
};
</script>
