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

export interface FailedDataset {
	name: string;
	error: string;
	parseStatus: 'failed';
}

export type DatasetEntry = EnhancedDataset | FailedDataset;

// Module-level state
let datasets = $state<Map<string, DatasetEntry>>(new Map());
let selectedStandard = $state<string>('');

// Load from sessionStorage on initialization
if (typeof window !== 'undefined') {
	try {
		const stored = sessionStorage.getItem('uploaded-datasets');
		if (stored) {
			const parsed = JSON.parse(stored);
			const entries = Object.entries(parsed) as [string, DatasetEntry | ParsedDataset][];
			
			// Ensure all datasets have sdtmCompliance property
			const enhancedEntries: [string, DatasetEntry][] = entries.map(([name, dataset]) => {
				// Check if this is a failed dataset
				if ('parseStatus' in dataset && dataset.parseStatus === 'failed' && 'error' in dataset) {
					return [name, dataset as FailedDataset];
				}
				// Check if dataset already has sdtmCompliance, if not compute it
				const enhanced: EnhancedDataset = ('sdtmCompliance' in dataset && (dataset as EnhancedDataset).sdtmCompliance)
					? (dataset as EnhancedDataset)
					: {
						...dataset as ParsedDataset,
						sdtmCompliance: detectSDTMCompliance(dataset.name)
					};
				return [name, enhanced];
			});
			
			datasets = new Map<string, DatasetEntry>(enhancedEntries);
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

export function addFailedDataset(name: string, error: string) {
	const failed: FailedDataset = {
		name,
		error,
		parseStatus: 'failed'
	};
	datasets.set(name, failed);
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
			// Only count successful datasets for compliance
			const successfulCount = Array.from(datasets.values()).filter(
				entry => !('parseStatus' in entry && entry.parseStatus === 'failed')
			).length;
			return successfulCount > 0 && selectedStandard !== '';
		}
	};
}

