import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  openDevTools: () => ipcRenderer.send('open-devtools'),
  getAppInfo: () => ipcRenderer.invoke('get-app-info'),
  // legacy modal helpers removed; use in-page overlays instead
  // openSubsWindow: (data) => ipcRenderer.invoke('open-subs-window', data),
  // sendSubsAction: (action) => ipcRenderer.send('subs-action', action),
});
