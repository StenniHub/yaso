import Vue from "vue";
import Vuex from "vuex";
import { invoke } from "@/vue/utils/ipcUtils";
import { actions, actionsById } from "@/common/actions";

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
      const keybind = state.keybinds[action];
      Vue.set(keybind, "keys", keys);
    },
    setKeybindConfig(state, { action, config }) {
      const keybind = state.keybinds[action];
      Vue.set(keybind, "config", config);
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
        Object.entries(keybinds).forEach(async ([action, keybind]) => {
          if (keybind == null || typeof(keybind) == "string") {
            keybind = { "keys": keybind };
            if (actionsById[action].config) keybind["config"] = actionsById[action].config;
            keybinds[action] = keybind;
          }

          if (keybind["keys"] != null) invoke("bindKeys", action, keybind["keys"]);
        });

        actions.forEach(action => {
          if (!(action.id in keybinds)) {
            const keybind = { "keys": null };
            if (action.config) keybind["config"] = action.config;
            keybinds[action.id] = keybind;
          }
        });

        commit("setKeybinds", keybinds);
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
        const previousKeys = (state.keybinds[action] || {}).keys;
        if (bound) {
          commit("setKeybind", { action, keys });
          invoke("saveConfig", "keybinds", state.keybinds);

          if (previousKeys) invoke("unbindKeys", previousKeys);
        }
      });
    },
    unbindKeys({ state, commit }, action: string) {
      invoke("unbindKeys", state.keybinds[action].keys);
      commit("setKeybind", { action, keys: null });
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
      if (session.alwaysOnTop) invoke("alwaysOnTop", true);
      window.webFrame.setZoomFactor(session.zoom);
    },
    setKeybindConfig({ state, commit }, { action, config }) {
      commit("setKeybindConfig", { action, config })
      invoke("saveConfig", "keybinds", state.keybinds)
    }
  },
  modules: {}
});
