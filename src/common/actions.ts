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
    description: "Open a file (1)",
    config: {
      filePath: null
    }
  },
  {
    id: "openFile2",
    description: "Open a file (2)",
    config: {
      filePath: null
    }
  },
  {
    id: "openFile3",
    description: "Open a file (3)",
    config: {
      filePath: null
    }
  },
  {
    id: "openFile4",
    description: "Open a file (4)",
    config: {
      filePath: null
    }
  },
  {
    id: "openFile5",
    description: "Open a file (5)",
    config: {
      filePath: null
    }
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