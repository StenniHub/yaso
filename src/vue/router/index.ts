import Vue from "vue";
import VueRouter, { RouteConfig } from "vue-router";
import Games from "@/vue/components/Games.vue";
import Game from "@/vue/components/Game.vue";
import Keybinds from "@/vue/components/Keybinds.vue";
import Settings from "@/vue/components/Settings.vue";
import About from "@/vue/components/About.vue";
import Timer from "@/vue/components/Timer.vue"

Vue.use(VueRouter);

const routes: Array<RouteConfig> = [
  {
    path: "/games",
    name: "Games",
    component: Games
  },
  {
    path: "/game/:id",
    name: "Game",
    component: Game
  },
  {
    path: "/keybinds",
    name: "Keybinds",
    component: Keybinds
  },
  {
    path: "/timer",
    name: "Timer",
    component: Timer
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings
  },
  {
    path: "/about",
    name: "About",
    component: About
  },
  {
    path: "*",
    redirect: "/games"
  }
];

const router = new VueRouter({
  mode: "history",
  base: process.env.BASE_URL,
  routes
});

export default router;
