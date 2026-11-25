const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('velveraDesktop', {
  platform: process.platform,
  channel: 'beta',
});
