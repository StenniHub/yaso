export const actions = [
  {
    id: "loadSavefile",
    description: "Load selected savefile",
    config: null
  },
  {
    id: "selectNext",
    description: "Select next savefile",
    config: null
  },
  {
    id: "selectPrevious",
    description: "Select previous savefile",
    config: null
  },
  {
    id: "toggleFolder",
    description: "Open/close selected folder",
    config: null
  },
  {
    id: "toggleAlwaysOnTop",
    description: "Toggle always on top",
    config: null
  },
  {
    id: "toggleReadOnly",
    description: "Toggle read only mode for game savefile",
    config: null
  },
  {
    id: "openFile",
    description: "Open custom file/application",
    config: {
      filePath: null
    }
  },
  {
    id: "playSound",
    description: "Play a sound file",
    config: {
      filePath: null
    }
  },
  {
    id: "startTimer",
    description: "Start timer",
    config: {
      filePath: null
    }
  },
  {
    id: "pauseTimer",
    description: "Pause timer",
    config: null
  },
  {
    id: "stopTimer",
    description: "Stop timer",
    config: null
  },
  {
    id: "muteTimer",
    description: "Mute timer",
    config: null
  }
]

export const actionsById = (() => {
  const actionsById = {};
  
  actions.forEach(action => {
    actionsById[action.id] = {
      description: action.description,
      config: action.config
    }
  })

  return actionsById;
})()