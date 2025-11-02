/**
 * Data Viewer Settings Store
 * Manages preferences for the DataFileViewer component
 */

export interface DataViewerSettings {
	fixedColumnWidths: boolean;
	showColumnStats: boolean;
	clickColumnForDetails: boolean;
	numberPrecision: number;
}

const DEFAULT_SETTINGS: DataViewerSettings = {
	fixedColumnWidths: true,
	showColumnStats: true,
	clickColumnForDetails: true,
	numberPrecision: 1
};

let settings = $state<DataViewerSettings>({ ...DEFAULT_SETTINGS });

// Load from localStorage on initialization
if (typeof window !== 'undefined') {
	try {
		const stored = localStorage.getItem('data-viewer-settings');
		if (stored) {
			const parsed = JSON.parse(stored);
			settings = { ...DEFAULT_SETTINGS, ...parsed };
		}
	} catch (err) {
		console.error('Failed to load data viewer settings:', err);
	}
}

export function setFixedColumnWidths(enabled: boolean) {
	settings.fixedColumnWidths = enabled;
	saveToStorage();
}

export function setShowColumnStats(enabled: boolean) {
	settings.showColumnStats = enabled;
	saveToStorage();
}

export function setClickColumnForDetails(enabled: boolean) {
	settings.clickColumnForDetails = enabled;
	saveToStorage();
}

export function setNumberPrecision(precision: number) {
	settings.numberPrecision = Math.max(0, Math.min(10, Math.round(precision))); // Clamp between 0 and 10
	saveToStorage();
}

function saveToStorage() {
	if (typeof window === 'undefined') return;
	try {
		localStorage.setItem('data-viewer-settings', JSON.stringify(settings));
	} catch (err) {
		console.error('Failed to save data viewer settings:', err);
	}
}

export function getDataViewerSettings() {
	return {
		get fixedColumnWidths() {
			return settings.fixedColumnWidths;
		},
		get showColumnStats() {
			return settings.showColumnStats;
		},
		get clickColumnForDetails() {
			return settings.clickColumnForDetails;
		},
		get numberPrecision() {
			return settings.numberPrecision;
		}
	};
}

