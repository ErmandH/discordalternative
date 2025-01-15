interface AudioDevice {
	deviceId: string;
	kind: 'audioinput' | 'audiooutput';
	label: string;
	groupId: string;
}

interface AudioDevices {
	inputs: AudioDevice[];
	outputs: AudioDevice[];
}

interface ElectronAPI {
	minimize: () => void;
	maximize: () => void;
	close: () => void;
	getAudioDevices: () => Promise<MediaDeviceInfo[]>;
	getCurrentAudioDevices: () => Promise<AudioDevices>;
}

declare global {
	interface Window {
		electron?: ElectronAPI;
	}
} 