import Vue from "vue";
import Vuex from "vuex";
import { invoke } from "@/vue/utils/ipcUtils";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    game: null,
    games: {},
    images: {},
    session: null,
    dragging: false
  },
  mutations: {
    setGame(state, id: string) {
      state.game = id != null ? state.games[id] : null;
      state.session.game = id;
    },
    setGames(state, games: Record<string, unknown>) {
      state.games = games;
    },
    setImage(state, { name, content }) {
      Vue.set(state.images, name, content);
    },
    setSession(state, session: Record<string, unknown>) {
      state.session = session;
    },
    setAlwaysOnTop(state, value) {
      Vue.set(state.session.alwaysOnTop, "enabled", value);
    },
    setSelected(state, { folder, file }) {
      state.game.selected.folder = folder;
      state.game.selected.file = file;
    },
    setSavefile(state, filepath: string) {
      state.game.savefile = filepath;
    },
    setBackups(state, filepath: string) {
      state.game.backups = filepath;
    },
    setDragging(state, dragging: boolean) {
      state.dragging = dragging;
    }
  },
  actions: {
    async loadAll({ dispatch }) {
      dispatch("loadGames");
      dispatch("loadSession");
    },
    async loadGames({ commit }) {
      invoke("readConfig", "games").then(games => {
        commit("setGames", games);

        Object.values(games).forEach(async game => {
          invoke("readImage", game["img"]).then(content => {
            commit("setImage", { name: game["img"], content: "data:image/jpeg;base64," + content });
          });
        });
      });
    },
    async loadSession({ dispatch }){
      invoke("readConfig", "session").then(session => {
        dispatch("setSession", { session: session, save: false });
      });
    },
    selectGame( { state, commit }, id: string) {
      commit("setGame", id);
      invoke("saveConfig", "session", state.session);
    },
    selectFile({ state, commit }, { folder, file }) {
      commit("setSelected", { folder, file });
      invoke("saveConfig", "games", state.games);
    },
    toggleAlwaysOnTop({ state, commit }) {
      commit("setAlwaysOnTop", !state.session.alwaysOnTop.enabled);
      invoke("saveConfig", "session", state.session);
      invoke("alwaysOnTop", state.session.alwaysOnTop.enabled);
    },
    saveGames({ state }) {
      invoke("saveConfig", "games", state.games);
    },
    saveSession({ state }) {
      invoke("saveConfig", "session", state.session);
    },
    setSession({ commit }, { session, save }) {
      commit("setSession", session);
      if (save) invoke("saveConfig", "session", session);
      if (session.alwaysOnTop.enabled) invoke("alwaysOnTop", true);
      window.webFrame.setZoomFactor(session.zoom);
    }
  },
  modules: {}
});
