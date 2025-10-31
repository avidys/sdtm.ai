/**
 * Datasets store for persisting uploaded datasets across navigation
 */

import type { ParsedDataset } from '$lib/standards/types';
import { detectSDTMCompliance } from '$lib/utils/sdtm';

export interface EnhancedDataset extends ParsedDataset {
	sdtmCompliance: {
		isCompliant: boolean;
		domain: string | null;
		type: 'domain' | 'supplemental' | null;
		icon: string;
	};
}

// Module-level state
let datasets = $state<Map<string, EnhancedDataset>>(new Map());
let selectedStandard = $state<string>('');

// Load from sessionStorage on initialization
if (typeof window !== 'undefined') {
	try {
		const stored = sessionStorage.getItem('uploaded-datasets');
		if (stored) {
			const parsed = JSON.parse(stored);
			const entries = Object.entries(parsed) as [string, ParsedDataset | EnhancedDataset][];
			
			// Ensure all datasets have sdtmCompliance property
			const enhancedEntries = entries.map(([name, dataset]) => {
				// Check if dataset already has sdtmCompliance, if not compute it
				const enhanced: EnhancedDataset = (dataset as EnhancedDataset).sdtmCompliance
					? (dataset as EnhancedDataset)
					: {
						...dataset,
						sdtmCompliance: detectSDTMCompliance(dataset.name)
					};
				return [name, enhanced] as [string, EnhancedDataset];
			});
			
			datasets = new Map(enhancedEntries);
		}
		
		const storedStandard = sessionStorage.getItem('selected-standard');
		if (storedStandard) {
			selectedStandard = storedStandard;
		}
	} catch (err) {
		console.error('Failed to load datasets from storage:', err);
	}
}

// Save to sessionStorage whenever datasets change
function saveToStorage() {
	if (typeof window === 'undefined') return;
	
	try {
		// Convert Map to object for storage
		const datasetsObj = Object.fromEntries(datasets);
		sessionStorage.setItem('uploaded-datasets', JSON.stringify(datasetsObj));
		sessionStorage.setItem('selected-standard', selectedStandard);
	} catch (err) {
		console.error('Failed to save datasets to storage:', err);
	}
}

export function addDataset(dataset: ParsedDataset) {
	const sdtmCompliance = detectSDTMCompliance(dataset.name);
	const enhanced: EnhancedDataset = {
		...dataset,
		sdtmCompliance
	};
	datasets.set(dataset.name, enhanced);
	datasets = new Map(datasets); // Trigger reactivity
	saveToStorage();
}

export function removeDataset(name: string) {
	datasets.delete(name);
	datasets = new Map(datasets); // Trigger reactivity
	saveToStorage();
}

export function clearAllDatasets() {
	datasets.clear();
	datasets = new Map(datasets); // Trigger reactivity
	selectedStandard = '';
	saveToStorage();
}

export function setSelectedStandard(standardId: string) {
	selectedStandard = standardId;
	saveToStorage();
}

export function getDatasets() {
	return {
		get all() {
			return datasets;
		},
		get selectedStandard() {
			return selectedStandard;
		},
		get hasDatasets() {
			return datasets.size > 0;
		},
		get canRunCompliance() {
			return datasets.size > 0 && selectedStandard !== '';
		}
	};
}

