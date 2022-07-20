module.exports = {
  transpileDependencies: ["vuetify"],
  pluginOptions: {
    electronBuilder: {
      preload: "src/electron/preload.js",
      mainProcessFile: "src/electron/background.ts",
      rendererProcessFile: "src/electron/renderer.ts",
      mainProcessWatch: ["src/electron/**/*.ts", "src/common/**/*.ts"],
      nodeIntegration: false,
      externals: ["node-global-key-listener"],
      builderOptions: {
        extraResources: [],
        win: {
          'signAndEditExecutable': false,
          target: ['nsis', 'portable']
        },
        nsis: {
          artifactName: '${name}-${version}.exe'
        },
        portable: {
          artifactName: '${name}-${version}-portable.exe'
        }
      }
    }
  }
};
