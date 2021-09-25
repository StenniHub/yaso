import Vue from "vue";
import Vuex from "vuex";
import { invoke } from "@/vue/utils/ipcUtils";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    game: null,
    games: {},
    images: {},
    keybinds: {},
    session: null
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
    setKeybinds(state, keybinds: Record<string, unknown>) {
      state.keybinds = keybinds;
    },
    setSession(state, session: Record<string, unknown>) {
      state.session = session;
    },
    setAlwaysOnTop(state, value) {
      Vue.set(state.session, "alwaysOnTop", value);
    },
    setSelected(state, { folder, file }) {
      state.game.selected.folder = folder;
      state.game.selected.file = file;
    },
    setKeybind(state, { action, keys }) {
      Vue.set(state.keybinds, action, keys);
    },
    setSavefile(state, filepath: string) {
      state.game.savefile = filepath;
    },
    setBackups(state, filepath: string) {
      state.game.backups = filepath;
    }
  },
  actions: {
    async loadAll({ dispatch }) {
      dispatch("loadGames");
      dispatch("loadKeybinds");
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
    async loadKeybinds({ commit }) {
      invoke("readConfig", "keybinds").then(keybinds => {
        commit("setKeybinds", keybinds);

        Object.entries(keybinds).forEach(async ([action, keys]) => {
          if (keys != null) invoke("bindKeys", action, keys);
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
      commit("setAlwaysOnTop", !state.session.alwaysOnTop);
      invoke("saveConfig", "session", state.session);
      invoke("alwaysOnTop", state.session.alwaysOnTop);
    },
    bindKeys({ state, commit }, { action, keys }) {
      invoke("bindKeys", action, keys).then(bound => {
        const previousKeys = state.keybinds[action];
        if (bound) {
          commit("setKeybind", { action, keys });
          invoke("saveConfig", "keybinds", state.keybinds);

          if (previousKeys) invoke("unbindKeys", previousKeys);
        }
      });
    },
    unbindKeys({ state, commit }, action: string) {
      invoke("unbindKeys", state.keybinds[action]);
      commit("setKeybind", { action, keys: null });
    },
    saveGames({ state }) {
      invoke("saveConfig", "games", state.games);
    },
    setSession({ commit }, { session, save}) {
      commit("setSession", session);
      if (save) invoke("saveConfig", "session", session);
      if (session.alwaysOnTop) invoke("alwaysOnTop", true);
      window.webFrame.setZoomFactor(session.zoom);
    }
  },
  modules: {}
});
