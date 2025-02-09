<template>
  <div class="file-container" ref="container">
    <file-button ref="fileButton" @click="() => select(false)" :name="name" :icon="icon" :is-selected="isSelected" :contextOptions="contextOptions" />

    <!-- Would prefer v-show here but causes files to be selectable when not visible -->
    <div v-if="isOpen" class="folder-content" :class="{ dragging: dragging }">
      <draggable v-bind="draggableProps" v-on="draggableHandlers">
        <folder ref="file" v-for="file in folders" :key="file.name" :dir="path" :folders="file.folders" :files="file.files" @parent="onEvent" />
      </draggable>

      <draggable v-bind="draggableProps" v-on="draggableHandlers">
        <file ref="file" v-for="file in files" :key="file.name" :dir="path" @parent="onEvent" />
      </draggable>
    </div>



    <!-- TODO: Have these inside file button and trigger from outside? -->
    <confirm-dialog ref="renameDialog" :inputs="{ name: { type: 'text', label: 'Name of folder', default: name } }" />
    <confirm-dialog ref="deleteDialog" :header="'Are you sure you want delete ' + name + '?'" />
  </div>
</template>

<script lang="ts">
import Vue from "vue";
import { FileResult, FolderResult } from "@/common/files";
import ConfirmDialog from "./ConfirmDialog.vue";
import Draggable from "vuedraggable";
import FolderBase from "./FolderBase.vue";


// Uses Vue.extend so we can refer to the component type and load dynamically
const Folder = Vue.extend({
  name: "folder",
  mixins: [FolderBase],
  components: { ConfirmDialog, Draggable },
  props: {
    folders: Array<FolderResult>,
    files: Array<FileResult>
  }
});

export default Folder;
</script>