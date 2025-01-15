import { useState, useEffect } from "react";

interface AudioDevice {
  deviceId: string;
  kind: "audioinput" | "audiooutput";
  label: string;
  groupId: string;
}

interface AudioDevices {
  inputs: AudioDevice[];
  outputs: AudioDevice[];
}

const VoiceSettings = () => {
  const [audioDevices, setAudioDevices] = useState<AudioDevices | null>(null);
  const [selectedInput, setSelectedInput] = useState<string>("");
  const [selectedOutput, setSelectedOutput] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const getDevices = async () => {
      try {
        setIsLoading(true);
        setError("");

        const devices = await window.electron?.getCurrentAudioDevices();
        console.log("Algılanan ses cihazları:", devices);

        if (mounted && devices) {
          setAudioDevices(devices);

          // Varsayılan cihazları seç
          if (devices.inputs.length > 0) {
            // "default" ID'li cihazı veya ilk cihazı seç
            const defaultInput =
              devices.inputs.find((d) => d.deviceId === "default") ||
              devices.inputs[0];
            setSelectedInput(defaultInput.deviceId);
          }

          if (devices.outputs.length > 0) {
            // "default" ID'li cihazı veya ilk cihazı seç
            const defaultOutput =
              devices.outputs.find((d) => d.deviceId === "default") ||
              devices.outputs[0];
            setSelectedOutput(defaultOutput.deviceId);
          }
        }
      } catch (err) {
        console.error("Ses cihazları alınamadı:", err);
        if (mounted) {
          setError(
            "Ses cihazlarına erişilemiyor. Lütfen tarayıcı izinlerini kontrol edin ve sayfayı yenileyin."
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    getDevices();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // Cihaz değişikliklerini dinle
  useEffect(() => {
    const handleDeviceChange = () => {
      console.log("Ses cihazları değişti, yeniden yükleniyor...");
      window.electron?.getCurrentAudioDevices().then((devices) => {
        if (devices) {
          setAudioDevices(devices);
        }
      });
    };

    navigator.mediaDevices.addEventListener("devicechange", handleDeviceChange);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        handleDeviceChange
      );
    };
  }, []);

  const getDeviceLabel = (device: AudioDevice) => {
    return (
      device.label ||
      `${device.kind === "audioinput" ? "Mikrofon" : "Hoparlör"}`
    );
  };

  if (isLoading) {
    return (
      <div className="text-discord-textPrimary text-center py-8">
        Ses cihazları yükleniyor...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 rounded-md bg-red-500 bg-opacity-10">
        <h3 className="font-semibold mb-2">Hata</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (
    !audioDevices ||
    (audioDevices.inputs.length === 0 && audioDevices.outputs.length === 0)
  ) {
    return (
      <div className="text-discord-textSecondary text-center py-8">
        Ses cihazı bulunamadı. Lütfen bir mikrofon veya hoparlör bağlayın.
      </div>
    );
  }

  return (
    <div className="text-discord-textPrimary">
      {/* Giriş Cihazları */}
      {audioDevices.inputs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-2">Giriş Cihazı</h3>
          <select
            value={selectedInput}
            onChange={(e) => setSelectedInput(e.target.value)}
            className="w-full bg-discord-tertiary text-discord-textPrimary p-2 rounded-md outline-none focus:ring-2 focus:ring-discord-accent"
          >
            {audioDevices.inputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {getDeviceLabel(device)}
              </option>
            ))}
          </select>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-discord-tertiary h-1 rounded-full overflow-hidden">
              <div
                className="bg-discord-accent h-full w-0"
                style={{ width: "0%" }}
              ></div>
            </div>
            <span className="ml-2 text-xs text-discord-textSecondary">0%</span>
          </div>
        </div>
      )}

      {/* Çıkış Cihazları */}
      {audioDevices.outputs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-white font-semibold mb-2">Çıkış Cihazı</h3>
          <select
            value={selectedOutput}
            onChange={(e) => setSelectedOutput(e.target.value)}
            className="w-full bg-discord-tertiary text-discord-textPrimary p-2 rounded-md outline-none focus:ring-2 focus:ring-discord-accent"
          >
            {audioDevices.outputs.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {getDeviceLabel(device)}
              </option>
            ))}
          </select>
          <div className="mt-4">
            <button
              onClick={() => {
                /* Test sesi çal */
              }}
              className="bg-discord-accent hover:bg-opacity-80 text-white px-4 py-2 rounded-md text-sm"
            >
              Test Sesi Çal
            </button>
          </div>
        </div>
      )}

      <div className="text-discord-textSecondary text-sm">
        Not: Ses cihazı değişiklikleri sistem ayarlarınızda da güncellenir.
      </div>
    </div>
  );
};

export default VoiceSettings;
