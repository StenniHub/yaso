import Vue from "vue";
import App from "@/vue/App.vue";
import router from "@/vue/router";
import store from "@/vue/store";
import vuetify from "@/vue/plugins/vuetify";
import { IpcRenderer, WebContents, WebFrame } from "electron";

Vue.config.productionTip = false;

declare global {
  interface Window {
    isWindows: boolean;
    ipcRenderer: IpcRenderer;
    webContents: WebContents;
    webFrame: WebFrame;
  }
}

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount("#app");
