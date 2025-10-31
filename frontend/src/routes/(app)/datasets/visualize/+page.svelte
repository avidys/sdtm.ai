<script lang="ts">
	import DataFileViewer from '$lib/components/DataFileViewer.svelte';
	import type { ParsedDataset } from '$lib/standards/types';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	let preloadedDataset = $state<ParsedDataset | null>(null);
	
	onMount(() => {
		// Check if a dataset was passed via URL parameter
		const datasetName = $page.url.searchParams.get('dataset');
		if (datasetName) {
			const key = `dataset-viewer-${datasetName}`;
			const stored = sessionStorage.getItem(key);
			if (stored) {
				try {
					preloadedDataset = JSON.parse(stored);
					// Clean up after loading
					sessionStorage.removeItem(key);
				} catch (err) {
					console.error('Failed to load preloaded dataset:', err);
				}
			}
		}
	});
</script>

<svelte:head>
	<title>Data File Visualizer</title>
</svelte:head>

<div class="page-container">
	<header>
		<h1>Data File Visualizer</h1>
		<p>Upload and visualize CSV files with interactive data exploration features</p>
		<p class="note">Note: XPT and Parquet files require server-side processing and should use the main upload feature.</p>
	</header>

	<DataFileViewer {preloadedDataset} />
	
	<section class="info">
		<h2>Features</h2>
		<ul>
			<li><strong>File Support:</strong> CSV and TXT formats (browser-compatible)</li>
			<li><strong>Reactive State:</strong> Built with Svelte 5's $state and $derived runes</li>
			<li><strong>Virtualization:</strong> Efficiently handles large datasets (10,000+ rows)</li>
			<li><strong>Sorting:</strong> Click column headers to sort data</li>
			<li><strong>Filtering:</strong> Real-time search across all columns</li>
			<li><strong>Row Selection:</strong> Click rows to select, export selected data as JSON</li>
			<li><strong>Column Statistics:</strong> View data types, missing values, and unique counts</li>
		</ul>
	</section>
</div>

<style>
	.page-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 2rem;
	}
	
	header {
		margin-bottom: 2rem;
	}
	
	h1 {
		color: #e2e8f0;
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	header p {
		color: #94a3b8;
		font-size: 1.1rem;
	}
	
	header p.note {
		color: #fbbf24;
		font-size: 0.9rem;
		margin-top: 0.5rem;
		font-style: italic;
	}
	
	.info {
		margin-top: 3rem;
		padding: 2rem;
		background: rgba(15, 23, 42, 0.4);
		border: 1px solid rgba(148, 163, 184, 0.25);
		border-radius: 8px;
	}
	
	.info h2 {
		color: #38bdf8;
		font-size: 1.5rem;
		margin-bottom: 1rem;
	}
	
	.info ul {
		list-style: none;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 1rem;
	}
	
	.info li {
		color: #e2e8f0;
		padding: 0.75rem;
		background: rgba(15, 23, 42, 0.3);
		border-left: 3px solid rgba(56, 189, 248, 0.5);
		border-radius: 4px;
	}
	
	.info strong {
		color: #38bdf8;
	}
</style>

