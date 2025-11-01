<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	import { SvelteSet } from 'svelte/reactivity';

	// Props
	let { 
		preloadedDataset = null,
		hideFileUpload = false
	}: { 
		preloadedDataset?: ParsedDataset | null;
		hideFileUpload?: boolean;
	} = $props();

	// Reactive state using Svelte 5's $state rune
	let dataset = $state<ParsedDataset | null>(preloadedDataset);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedRows = new SvelteSet<number>();
	let sortColumn = $state<string | null>(null);
	let sortAscending = $state(true);
	let filterText = $state('');
	
	// Update dataset whenever preloadedDataset changes
	$effect(() => {
		dataset = preloadedDataset;
		// Reset UI state when dataset changes
		if (preloadedDataset !== null) {
			selectedRows.clear();
			sortColumn = null;
			sortAscending = true;
			filterText = '';
			scrollTop = 0;
			error = null;
			loading = false;
		}
	});
	
	// Virtualization settings
	let rowHeight = 32; // px
	let viewportHeight = 500; // px
	let scrollTop = $state(0);
	
	// Derived state using $derived rune
	let columns = $derived(
		dataset ? Object.keys(dataset.columns) : []
	);
	
	let rows = $derived.by(() => {
		if (!dataset) return [];
		
		let filtered = dataset.rows;
		
		// Apply filter
		if (filterText.trim()) {
			const search = filterText.toLowerCase();
			filtered = filtered.filter(row =>
				Object.values(row).some(val => 
					String(val).toLowerCase().includes(search)
				)
			);
		}
		
		// Apply sorting
		if (sortColumn !== null) {
			const col = sortColumn;
			filtered = [...filtered].sort((a, b) => {
				const aVal = a[col];
				const bVal = b[col];
				
				if (aVal == null && bVal == null) return 0;
				if (aVal == null) return 1;
				if (bVal == null) return -1;
				
				const direction = sortAscending ? 1 : -1;
				
				if (aVal < bVal) return -direction;
				if (aVal > bVal) return direction;
				return 0;
			});
		}
		
		return filtered;
	});
	
	// Virtualization calculations
	let totalRows = $derived(rows.length);
	let startIndex = $derived(Math.max(0, Math.floor(scrollTop / rowHeight) - 10));
	let visibleCount = $derived(Math.ceil(viewportHeight / rowHeight) + 20);
	let endIndex = $derived(Math.min(totalRows, startIndex + visibleCount));
	let visibleRows = $derived(rows.slice(startIndex, endIndex));
	
	// Column statistics
	let columnStats = $derived.by(() => {
		if (!dataset) return {};
		
		const stats: Record<string, {
			type: string;
			missing: number;
			percentMissing: number;
			unique: number;
		}> = {};
		
		for (const col of columns) {
			const values = dataset.rows.map(row => row[col]);
			const missing = values.filter(v => v == null || v === '').length;
			const unique = new Set(values.filter(v => v != null && v !== '')).size;
			
			stats[col] = {
				type: dataset.columns[col] || 'string',
				missing,
				percentMissing: Math.round((missing / dataset.rows.length) * 1000) / 10,
				unique
			};
		}
		
		return stats;
	});
	
	// File upload is now handled externally via props/events
	
	// Sort handler
	function handleSort(column: string) {
		if (sortColumn === column) {
			sortAscending = !sortAscending;
		} else {
			sortColumn = column;
			sortAscending = true;
		}
	}
	
	// Row selection toggle
	function toggleRowSelection(index: number) {
		if (selectedRows.has(index)) {
			selectedRows.delete(index);
		} else {
			selectedRows.add(index);
		}
	}
	
	// Clear selection
	function clearSelection() {
		selectedRows.clear();
	}
	
	// Scroll handler
	function handleScroll(event: Event) {
		const el = event.currentTarget as HTMLElement;
		scrollTop = el.scrollTop;
	}
	
	// Export selected rows as JSON
	function exportSelected() {
		const selected = Array.from(selectedRows)
			.map(i => rows[i])
			.filter(Boolean);
		
		const blob = new Blob([JSON.stringify(selected, null, 2)], {
			type: 'application/json'
		});
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${dataset?.name || 'data'}_selected.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<div class="data-file-viewer">
	{#if dataset}
		<div class="toolbar">
			<div class="dataset-info">
				<strong>{dataset.name}</strong>
				<span>({totalRows} rows, {columns.length} columns)</span>
			</div>
			
			<div class="toolbar-right">
				<input
					type="search"
					class="filter-input"
					placeholder="Filter data..."
					bind:value={filterText}
				/>
				{#if selectedRows.size > 0}
					<div class="selection-info">
						<span>{selectedRows.size} selected</span>
						<button onclick={clearSelection}>Clear</button>
						<button onclick={exportSelected}>Export Selected</button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
	
	{#if loading}
		<div class="status loading">
			<div class="spinner"></div>
			<p>Loading and parsing file...</p>
		</div>
	{/if}
	
	{#if error}
		<div class="status error">
			<p><strong>Error:</strong> {error}</p>
		</div>
	{/if}
	
	{#if dataset && !loading}
		<!-- Column Statistics -->
		<details class="stats-section">
			<summary>Column Statistics</summary>
			<div class="stats-grid">
				<div class="stat-header">Column</div>
				<div class="stat-header">Type</div>
				<div class="stat-header">Missing</div>
				<div class="stat-header">% Missing</div>
				<div class="stat-header">Unique</div>
				
				{#each columns as col (col)}
					<div class="stat-cell">{col}</div>
					<div class="stat-cell">{columnStats[col]?.type || 'unknown'}</div>
					<div class="stat-cell">{columnStats[col]?.missing || 0}</div>
					<div class="stat-cell">{columnStats[col]?.percentMissing || 0}%</div>
					<div class="stat-cell">{columnStats[col]?.unique || 0}</div>
				{/each}
			</div>
		</details>
		
		<!-- Data Table with Virtualization -->
		<div class="table-container" style="height: {viewportHeight}px" onscroll={handleScroll}>
			<div class="spacer" style="height: {totalRows * rowHeight}px">
				<table class="data-table" style="transform: translateY({startIndex * rowHeight}px)">
					<thead>
						<tr>
							<th class="select-col">#</th>
							{#each columns as col (col)}
								<th>
									<button
										class="sort-button"
										onclick={() => handleSort(col)}
									>
										{col}
										{#if sortColumn === col}
											<span class="sort-indicator">
												{sortAscending ? '▲' : '▼'}
											</span>
										{/if}
									</button>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#each visibleRows as row, i (startIndex + i)}
							{@const rowIndex = startIndex + i}
							<tr
								class:selected={selectedRows.has(rowIndex)}
								onclick={() => toggleRowSelection(rowIndex)}
							>
								<td class="select-col">{rowIndex + 1}</td>
								{#each columns as col (col)}
									<td>{row[col] ?? ''}</td>
								{/each}
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{:else if !loading && !error && hideFileUpload}
		<div class="empty-state">
			<p>No dataset loaded. Upload a file using the upload component above.</p>
			<p>If there is an error, try a different parser.</p>
		</div>
	{:else if !loading && !error && !hideFileUpload}
		<div class="empty-state">
			<p>Upload a CSV or SAS XPT file to visualize the data</p>
		</div>
	{/if}
</div>

<style>
	.data-file-viewer {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		width: 100%;
	}
	
	.toolbar {
		display: flex;
		gap: 1rem;
		align-items: center;
		flex-wrap: wrap;
		padding: 1rem;
		background: var(--color-surface);
		border-radius: 8px;
		border: 1px solid var(--color-border);
		justify-content: space-between;
	}
	
	.button {
		display: inline-block;
		padding: 0.5rem 1rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-strong);
		border-radius: 6px;
		color: var(--color-primary);
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
	}
	
	.button:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}
	
	.dataset-info {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		color: var(--color-text);
		flex: 0 0 auto;
	}
	
	.dataset-info span {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
	}
	
	.toolbar-right {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-left: auto;
		flex: 0 0 auto;
	}
	
	.filter-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		min-width: 200px;
	}
	
	.filter-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}
	
	.filter-input::placeholder {
		color: var(--color-text-muted);
	}
	
	.selection-info {
		display: flex;
		gap: 0.5rem;
		align-items: center;
		color: var(--color-primary);
	}
	
	.selection-info button {
		padding: 0.25rem 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border-strong);
		border-radius: 4px;
		color: var(--color-primary);
		cursor: pointer;
		font-size: 0.875rem;
	}
	
	.selection-info button:hover {
		background: var(--color-surface-hover);
	}
	
	.status {
		padding: 2rem;
		text-align: center;
		border-radius: 8px;
		border: 1px solid var(--color-border);
	}
	
	.status.loading {
		background: var(--color-bg-secondary);
		color: var(--color-primary);
	}
	
	.status.error {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
	}
	
	.spinner {
		width: 40px;
		height: 40px;
		margin: 0 auto 1rem;
		border: 4px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
	}
	
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	
	.controls {
		display: flex;
		gap: 1rem;
		padding: 0 1rem;
	}
	
	.controls input[type="search"] {
		flex: 1;
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 6px;
		color: var(--color-text);
		font-size: 0.9rem;
	}
	
	.controls input[type="search"]::placeholder {
		color: var(--color-text-muted);
	}
	
	.stats-section {
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
	}
	
	.stats-section summary {
		padding: 0.75rem 1rem;
		cursor: pointer;
		font-weight: 500;
		color: var(--color-text);
		user-select: none;
	}
	
	.stats-section summary:hover {
		background: var(--color-surface-hover);
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
		gap: 1px;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border-top: 1px solid var(--color-border);
	}
	
	.stat-header {
		padding: 0.5rem;
		font-weight: 600;
		color: var(--color-primary);
		font-size: 0.875rem;
	}
	
	.stat-cell {
		padding: 0.5rem;
		color: var(--color-text);
		font-size: 0.875rem;
	}
	
	.table-container {
		position: relative;
		overflow: auto;
		border: 1px solid var(--color-border);
		border-radius: 8px;
		background: var(--color-surface);
	}
	
	.spacer {
		position: relative;
	}
	
	.data-table {
		width: 100%;
		border-collapse: collapse;
		position: absolute;
		top: 0;
		left: 0;
	}
	
	.data-table thead {
		position: sticky;
		top: 0;
		z-index: 10;
		background: var(--color-surface);
		border-bottom: 2px solid var(--color-border);
	}
	
	.data-table th {
		padding: 0;
		border-bottom: 2px solid var(--color-border-strong);
		white-space: nowrap;
	}
	
	.sort-button {
		width: 100%;
		padding: 0.5rem 0.75rem;
		background: none;
		border: none;
		color: var(--color-primary);
		font-weight: 600;
		cursor: pointer;
		text-align: left;
		display: flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.875rem;
	}
	
	.sort-button:hover {
		background: var(--color-surface-hover);
	}
	
	.sort-indicator {
		font-size: 0.75rem;
	}
	
	.data-table td {
		padding: 0.4rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
		white-space: nowrap;
		font-size: 0.875rem;
	}
	
	.select-col {
		width: 60px;
		text-align: center;
		color: var(--color-text-secondary);
	}
	
	.data-table tbody tr {
		cursor: pointer;
		transition: background-color 0.15s;
		background: var(--color-surface);
	}
	
	.data-table tbody tr:hover {
		background: var(--color-surface-hover);
	}
	
	.data-table tbody tr.selected {
		background: var(--color-bg-secondary);
	}
	
	.empty-state {
		padding: 4rem 2rem;
		text-align: center;
		color: var(--color-text-secondary);
		border: 2px dashed var(--color-border);
		border-radius: 8px;
		background: var(--color-bg-secondary);
	}
	
	.empty-state p {
		font-size: 1.1rem;
	}
	
	/* Mobile Responsive Styles */
	@media (max-width: 768px) {
		.toolbar {
			flex-wrap: wrap;
			gap: 0.75rem;
			padding: 0.75rem;
		}
		
		.controls {
			flex-direction: column;
			gap: 0.75rem;
			padding: 0 0.75rem;
		}
		
		.controls input[type="search"] {
			width: 100%;
			font-size: 16px; /* Prevents zoom on iOS */
		}
		
		.stats-section summary {
			padding: 0.6rem 0.75rem;
			font-size: 0.875rem;
		}
		
		.stats-grid {
			grid-template-columns: 1fr;
			gap: 0.5rem;
			padding: 0.75rem;
		}
		
		.table-container {
			border-radius: 0.5rem;
		}
		
		.data-table th,
		.data-table td {
			padding: 0.5rem 0.4rem;
			font-size: 0.8rem;
		}
		
		.sort-button {
			padding: 0.4rem 0.5rem;
			font-size: 0.8rem;
		}
		
		.empty-state {
			padding: 2rem 1rem;
		}
		
		.empty-state p {
			font-size: 1rem;
		}
	}
	
	@media (max-width: 480px) {
		.toolbar {
			padding: 0.5rem;
		}
		
		.filter-input {
			min-width: 120px;
			font-size: 16px; /* Prevents zoom on iOS */
		}
		
		.data-table th,
		.data-table td {
			padding: 0.4rem 0.3rem;
			font-size: 0.75rem;
		}
		
		.sort-button {
			padding: 0.35rem 0.4rem;
			font-size: 0.75rem;
		}
	}
</style>

