export const IPC = {
  main: {
    openCamera: 'main:open-camera',
    openInstagram: 'main:open-instagram',
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
  instagram: {
    close: 'instagram:close',
    getReels: 'instagram:get-reels',
    getProcrastinationState: 'instagram:get-procrastination-state',
    recordProcrastinationMilestone: 'instagram:record-procrastination-milestone',
    startStudying: 'instagram:start-studying',
  },
} as const;
