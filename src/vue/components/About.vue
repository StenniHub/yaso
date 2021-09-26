<template>
  <v-container fluid class="main-container">
    <h4>Version {{appVersion}}</h4>
    <h4>Developed by Stennis</h4>

    <div class="centered-container">
      <div class="about-grid">
        <div class="icon">
          <img src="../resources/logos/github.png" height="30" />
        </div>
        <a href="https://github.com/StenniHub/yaso" target="_blank">github.com/StenniHub/yaso</a>

        <div class="icon">
          <img src="../resources/logos/discord.svg" height="30" />
        </div>
        <p>Stennis#4562</p>

        <div class="icon">
          <img src="../resources/logos/twitch.png" height="30" />
        </div>
        <a href="https://www.twitch.tv/stennis" target="_blank">twitch.tv/stennis</a>
      </div>
    </div>
  </v-container>
</template>

<script lang="ts">
import {version} from "@/../package.json";

export default {
  data: () => ({
    appVersion: version
  })
}
</script>