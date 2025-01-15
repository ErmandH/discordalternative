import { contextBridge, ipcRenderer } from 'electron'

// Electron API'lerini window nesnesine ekle
contextBridge.exposeInMainWorld('electron', {
  minimize: () => ipcRenderer.send('window-control', 'minimize'),
  maximize: () => ipcRenderer.send('window-control', 'maximize'),
  close: () => ipcRenderer.send('window-control', 'close'),
  // Ses cihazları için API'ler
  getCurrentAudioDevices: async () => {
    try {
      // Mikrofon izni iste
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Tüm cihazları listele
      const devices = await navigator.mediaDevices.enumerateDevices();

      // Ses cihazlarını filtrele ve etiketlerini kontrol et
      const audioDevices = {
        inputs: devices
          .filter(device => device.kind === 'audioinput')
          .map(device => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label || 'Mikrofon',
            groupId: device.groupId
          })),
        outputs: devices
          .filter(device => device.kind === 'audiooutput')
          .map(device => ({
            deviceId: device.deviceId,
            kind: device.kind,
            label: device.label || 'Hoparlör',
            groupId: device.groupId
          }))
      };

      return audioDevices;
    } catch (error) {
      console.error('Ses cihazları alınamadı:', error);
      throw error;
    }
  }
})
