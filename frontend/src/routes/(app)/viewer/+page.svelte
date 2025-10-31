<script lang="ts">
	import DataFileViewer from '$lib/components/DataFileViewer.svelte';
</script>

<svelte:head>
	<title>Data Viewer - SDTM Compliance Portal</title>
</svelte:head>

<div class="page-container">
	<header>
		<h1>Data Viewer</h1>
		<p>Upload and visualize CSV files with interactive data exploration features</p>
		<p class="note">Note: XPT and Parquet files require server-side processing and should use the main upload feature.</p>
	</header>

	<DataFileViewer />
	
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
		color: var(--color-text);
		font-size: 2rem;
		font-weight: 700;
		margin-bottom: 0.5rem;
	}
	
	header p {
		color: var(--color-text-muted);
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
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 8px;
	}
	
	.info h2 {
		color: var(--color-primary);
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
		color: var(--color-text);
		padding: 0.75rem;
		background: var(--color-bg-secondary);
		border-left: 3px solid var(--color-primary);
		border-radius: 4px;
	}
	
	.info strong {
		color: var(--color-primary);
	}
</style>

