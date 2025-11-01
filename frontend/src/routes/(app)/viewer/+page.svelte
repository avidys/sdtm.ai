<script lang="ts">
	import { onMount } from 'svelte';
	import DataFileViewer from '$lib/components/DataFileViewer.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { parseFileWithParser } from '$lib/utils/fileParser';
	import type { ParsedDataset } from '$lib/standards/types';
	
	// Load dataset from sessionStorage on mount
	let dataset = $state<ParsedDataset | null>(null);
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let showFeatures = $state(false);
	let selectedParser = $state<'pandas' | 'r'>('pandas');
	let currentFile = $state<File | null>(null);
	let previousParser = $state<'pandas' | 'r' | null>(null);
	let isParsingDueToParserChange = $state(false);
	let showParserChangeAck = $state(false);
	
	// Load dataset from sessionStorage on mount
	onMount(() => {
		try {
			const stored = sessionStorage.getItem('viewer-dataset');
			if (stored) {
				const parsed = JSON.parse(stored);
				dataset = parsed.dataset;
				selectedParser = parsed.parser || 'pandas';
				previousParser = parsed.parser || 'pandas';
			}
		} catch (err) {
			console.error('Failed to load viewer dataset from sessionStorage:', err);
		}
	});
	
	// Save dataset to sessionStorage whenever it changes
	$effect(() => {
		if (typeof window !== 'undefined') {
			if (dataset) {
				try {
					sessionStorage.setItem('viewer-dataset', JSON.stringify({
						dataset,
						parser: selectedParser
					}));
				} catch (err) {
					console.error('Failed to save viewer dataset to sessionStorage:', err);
				}
			} else {
				// Clear sessionStorage when dataset is cleared
				sessionStorage.removeItem('viewer-dataset');
			}
		}
	});
	
	async function handleFileUpload(files: File[], parser: 'pandas' | 'r') {
		uploading = true;
		uploadError = null;
		dataset = null;
		previousParser = null; // Reset previous parser
		isParsingDueToParserChange = false; // This is a manual file upload
		
		try {
			// Use the selected parser from the header (parser param is ignored, we use selectedParser)
			// For viewer, we only process the first file
			const file = files[0];
			if (file) {
				currentFile = file; // Store the file for re-parsing when parser changes
				dataset = await parseFileWithParser(file, selectedParser);
				previousParser = selectedParser; // Set initial parser after successful load
			}
		} catch (err) {
			uploadError = err instanceof Error ? err.message : String(err);
			dataset = null; // Clear dataset on error to show empty state
			// Keep currentFile even on error so we can retry with a different parser
			// Set previousParser to track which parser was attempted (even if it failed)
			previousParser = selectedParser;
		} finally {
			uploading = false;
		}
	}
	
	// Re-parse when parser changes (but only if a file is already loaded)
	$effect(() => {
		const parser = selectedParser;
		
		// Skip if:
		// - No file is loaded
		// - Currently uploading (from manual file selection)
		// - Currently parsing due to parser change (prevent loop)
		// - Parser hasn't changed from previous value
		if (!currentFile || uploading || isParsingDueToParserChange) {
			return;
		}
		
		// Only re-parse if the parser actually changed from a previous value
		if (previousParser !== null && previousParser !== parser) {
			// Set flag to prevent re-entry
			isParsingDueToParserChange = true;
			previousParser = parser; // Update immediately to prevent duplicate triggers
			
			// Re-parse the current file with the new parser
			(async () => {
				uploading = true;
				uploadError = null;
				dataset = null; // Clear dataset while re-parsing
				try {
					dataset = await parseFileWithParser(currentFile!, parser);
					// Show acknowledgment message after successful re-parsing
					showParserChangeAck = true;
					setTimeout(() => {
						showParserChangeAck = false;
					}, 2000); // Auto-hide after 2 seconds
				} catch (err) {
					uploadError = err instanceof Error ? err.message : String(err);
					dataset = null; // Clear dataset on error to show empty state
				} finally {
					uploading = false;
					isParsingDueToParserChange = false;
				}
			})();
		}
	});
</script>

<svelte:head>
	<title>Data Viewer - SDTM Compliance Portal</title>
</svelte:head>

<div class="page-container">
	<header class="page-header">
		<div class="header-content">
			<div class="title-row">
				<h1>Data Viewer</h1>
				<button 
					class="features-btn-header"
					onclick={() => showFeatures = true}
					type="button"
					title="View features"
				>
					?
				</button>
			</div>
			<div class="subtitle-row">
				<p>Upload and visualize data files with interactive data exploration features</p>
				<div class="parser-selector-header">
					<label for="parser-select-header">
						<span>Parser:</span>
						<select 
							id="parser-select-header"
							bind:value={selectedParser}
							disabled={uploading}
						>
							<option value="pandas">Pandas</option>
							<option value="r">R (haven)</option>
						</select>
					</label>
				</div>
			</div>
		</div>
	</header>

	<FileUpload 
		onUpload={handleFileUpload}
		bind:uploading
		bind:uploadError
		showUpload={true}
		hideParser={true}
		bind:selectedParser
		multiple={false}
	/>
	
	{#if showParserChangeAck && currentFile}
		<div class="parser-change-ack">
			<span class="ack-message">Dataset {currentFile.name} has been re-parsed</span>
		</div>
	{/if}

	<div class="data-viewer-wrapper">
		<DataFileViewer preloadedDataset={dataset} hideFileUpload={true} />
	</div>
</div>

{#if showFeatures}
	<div class="modal-overlay" onclick={() => showFeatures = false}>
		<div class="modal-content" onclick={(e) => e.stopPropagation()}>
			<div class="modal-header">
				<h2>Features</h2>
				<button class="btn-close" onclick={() => showFeatures = false}>&times;</button>
			</div>
			
			<div class="modal-body">
				<ul class="features-list">
					<li><strong>File Support:</strong> CSV, Excel, JSON, Parquet, SAS (.xpt, .sas7bdat), TSV</li>
					<li><strong>Parser Options:</strong> Choose between Pandas or R (haven) parser</li>
					<li><strong>Reactive State:</strong> Built with Svelte 5's $state and $derived runes</li>
					<li><strong>Virtualization:</strong> Efficiently handles large datasets (10,000+ rows)</li>
					<li><strong>Sorting:</strong> Click column headers to sort data</li>
					<li><strong>Filtering:</strong> Real-time search across all columns</li>
					<li><strong>Row Selection:</strong> Click rows to select, export selected data as JSON</li>
					<li><strong>Column Statistics:</strong> View data types, missing values, and unique counts</li>
				</ul>
			</div>
		</div>
	</div>
{/if}

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	.page-container > :global(.file-upload-container) {
		max-width: 100%;
		margin-bottom: 2rem;
	}
	
	.data-viewer-wrapper {
		margin-top: 2rem;
	}
	
	.page-header {
		margin-bottom: 1.5rem;
	}
	
	.header-content {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.title-row {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}
	
	h1 {
		color: var(--color-text);
		font-size: 2rem;
		font-weight: 700;
		margin: 0;
	}
	
	.features-btn-header {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		padding: 0;
	}
	
	.features-btn-header:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	
	.subtitle-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}
	
	header p {
		color: var(--color-text-muted);
		font-size: 1.1rem;
		margin: 0;
	}
	
	.parser-selector-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.5rem;
	}
	
	.parser-selector-header label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: var(--color-text);
		font-size: 0.9rem;
	}
	
	.parser-selector-header select {
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
	}
	
	.parser-selector-header select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	header p.note {
		color: #fbbf24;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		font-style: italic;
	}
	
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		backdrop-filter: blur(4px);
		padding: 1rem;
	}
	
	.modal-content {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 1rem;
		max-width: 800px;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 2px solid var(--color-border);
		background: var(--color-bg-secondary);
	}
	
	.modal-header h2 {
		margin: 0;
		color: var(--color-primary);
		font-size: 1.5rem;
	}
	
	.btn-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--color-text-muted);
		width: 2rem;
		height: 2rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.25rem;
		transition: all 0.2s;
	}
	
	.btn-close:hover {
		background: var(--color-error);
		color: white;
	}
	
	.modal-body {
		flex: 1;
		overflow: auto;
		padding: 1.5rem;
	}
	
	.features-list {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}
	
	.features-list li {
		color: var(--color-text);
		padding: 0.75rem;
		background: var(--color-bg-secondary);
		border-left: 3px solid var(--color-primary);
		border-radius: 4px;
	}
	
	.features-list strong {
		color: var(--color-primary);
	}
	
	.parser-change-ack {
		position: relative;
		background: var(--color-primary);
		color: white;
		padding: 0.75rem 1.25rem;
		border-radius: 0.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: var(--shadow-lg);
		margin: 0 auto 1.5rem;
		max-width: fit-content;
		animation: slideIn 0.3s ease-out;
		font-size: 0.9rem;
		font-weight: 500;
	}
	
	.ack-message {
		white-space: nowrap;
	}
	
	@keyframes slideIn {
		from {
			transform: translateY(-100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
</style>

