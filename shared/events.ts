export const IPC = {
  main: {
    openCamera: 'main:open-camera',
    getAppInfo: 'main:get-app-info',
  },
  camera: {
    close: 'camera:close',
    getPreferences: 'camera:get-preferences',
    updatePreferences: 'camera:update-preferences',
    attentionUpdated: 'attention:updated',
  },
  fred: {
    reaction: 'fred:reaction',
  },
} as const;
