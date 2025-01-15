"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electron", {
  minimize: () => electron.ipcRenderer.send("window-control", "minimize"),
  maximize: () => electron.ipcRenderer.send("window-control", "maximize"),
  close: () => electron.ipcRenderer.send("window-control", "close"),
  // Ses cihazları için API'ler
  getCurrentAudioDevices: async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioDevices = {
        inputs: devices.filter((device) => device.kind === "audioinput").map((device) => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label || "Mikrofon",
          groupId: device.groupId
        })),
        outputs: devices.filter((device) => device.kind === "audiooutput").map((device) => ({
          deviceId: device.deviceId,
          kind: device.kind,
          label: device.label || "Hoparlör",
          groupId: device.groupId
        }))
      };
      return audioDevices;
    } catch (error) {
      console.error("Ses cihazları alınamadı:", error);
      throw error;
    }
  }
});
