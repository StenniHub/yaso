<template>
  <v-container fluid class="game-container">
    <div v-for="([id, game]) in Object.entries(games)" :key="id">
      <v-hover v-slot="{ hover }">
        <v-card :class="{ 'on-hover': hover }" @click="select(id)">
          <v-img :src="images[game.img]" class="white--text align-end">
            <div class="img-title">
              <v-card-title v-text="game.title" />
            </div>
          </v-img>
        </v-card>
      </v-hover>
    </div>
  </v-container>
</template>

<script lang="ts">
import { mapState } from "vuex";

export default {
  computed: mapState({
    games: state => state["games"],
    images: state => state["images"]
  }),
  methods: {
    select(id: string): void {
      this.$router.push({ name: "Game", params: { id: id } });
    }
  }
};
</script>
