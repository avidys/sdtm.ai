<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	import { SvelteSet } from 'svelte/reactivity';
	import { getDataViewerSettings } from '$lib/stores/dataViewerSettings.svelte';
	import ColumnDetailsModal from './ColumnDetailsModal.svelte';
	import MultiSortModal, { type SortRule } from './MultiSortModal.svelte';

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
	let sortRules = $state<SortRule[]>([]);
	let filterText = $state('');
	let selectedColumnForDetails = $state<string | null>(null);
	let showMultiSortModal = $state(false);
	
	// Update dataset whenever preloadedDataset changes
	$effect(() => {
		dataset = preloadedDataset;
		// Reset UI state when dataset changes
		if (preloadedDataset !== null) {
			selectedRows.clear();
			sortColumn = null;
			sortAscending = true;
			sortRules = [];
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
	
	// Settings
	const viewerSettings = getDataViewerSettings();
	
	// Derived state using $derived rune
	let columns = $derived(
		dataset ? Object.keys(dataset.columns) : []
	);
	
	// Calculate column widths based on all data when fixedColumnWidths is enabled
	let columnWidths = $derived.by(() => {
		if (!dataset || !viewerSettings.fixedColumnWidths) return {};
		
		const widths: Record<string, number> = {};
		
		for (const col of columns) {
			// Calculate header width (column name + sort button + stats if shown)
			let headerWidth = col.length * 8; // ~8px per character for header font
			
			// Add space for sort button
			headerWidth += 30;
			
			if (viewerSettings.showColumnStats) {
				// Add space for stats section below header
				// Stats take: "Type: xxx", "Miss: x (x%)", "Unique: x"
				headerWidth = Math.max(headerWidth, 140); // Minimum width for stats
			}
			
			// Add padding (left + right)
			headerWidth += 30;
			
			// Get all values for this column and calculate max content width
			const values = dataset.rows.map(row => String(row[col] ?? ''));
			let maxContentWidth = headerWidth;
			
			if (values.length > 0) {
				// For better accuracy, sample more values
				// Check first 2000, last 2000, and all long values (>30 chars)
				const sampleSize = Math.min(2000, values.length);
				const samples = [
					...values.slice(0, sampleSize),
					...values.slice(-sampleSize),
					...values.filter(v => v.length > 30) // Long values
				];
				
				// Remove duplicates to avoid checking same value multiple times
				const uniqueSamples = Array.from(new Set(samples));
				
				// Calculate width for each sample
				const contentWidths = uniqueSamples.map(val => {
					// More accurate estimation:
					// - Numbers/dates: ~9px per character (monospace)
					// - Text: ~6-7px per character (proportional)
					// - Use 7.5px average for mixed content
					const charWidth = /^[\d.\-+\s:]+$/.test(val) ? 9 : 7;
					return val.length * charWidth;
				});
				
				if (contentWidths.length > 0) {
					const maxSampleWidth = Math.max(...contentWidths);
					maxContentWidth = Math.max(maxContentWidth, maxSampleWidth);
				}
			}
			
			// Set minimum and maximum widths
			const minWidth = viewerSettings.showColumnStats ? 140 : 90;
			const maxWidth = 600; // Increased max width
			
			// Add extra padding for cell content
			const calculatedWidth = maxContentWidth + 40; // +40 for padding and safety margin
			
			widths[col] = Math.max(minWidth, Math.min(maxWidth, calculatedWidth));
		}
		
		return widths;
	});
	
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
		
		// Apply sorting (multi-column if rules exist, otherwise single column)
		if (sortRules.length > 0) {
			filtered = [...filtered].sort((a, b) => {
				for (const rule of sortRules) {
					const aVal = a[rule.column];
					const bVal = b[rule.column];
					
					if (aVal == null && bVal == null) continue;
					if (aVal == null) return 1;
					if (bVal == null) return -1;
					
					const direction = rule.ascending ? 1 : -1;
					
					if (aVal < bVal) return -direction;
					if (aVal > bVal) return direction;
				}
				return 0;
			});
		} else if (sortColumn !== null) {
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
	
	// Log virtualization variables when scrollTop changes
	$effect(() => {
		if (dataset) {
			console.log('Virtualization Variables:', {
				scrollTop,
				rowHeight,
				viewportHeight,
				totalRows,
				startIndex,
				visibleCount,
				endIndex,
				visibleRowsLength: visibleRows.length,
				translateY: startIndex * rowHeight
			});
		}
	});
	
	// Helper function to parse date/time values
	function parseTemporalValue(value: unknown): Date | null {
		if (value instanceof Date) return value;
		if (value === null || value === undefined || value === '') return null;
		
		const str = String(value);
		
		// Try ISO formats
		if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
			const isoDate = new Date(str);
			if (!isNaN(isoDate.getTime())) return isoDate;
		}
		
		// Try parsing various date/time formats
		const date = new Date(str);
		if (!isNaN(date.getTime())) {
			return date;
		}
		
		return null;
	}
	
	// Detect temporal column type (date, time, datetime)
	function detectTemporalType(col: string): 'date' | 'time' | 'datetime' | null {
		if (!dataset) return null;
		
		const columnType = dataset.columns[col]?.toLowerCase() || '';
		const columnNameLower = col.toLowerCase();
		const values = dataset.rows.map(row => row[col]).filter(v => v != null && v !== '');
		
		if (values.length === 0) return null;
		
		// Check column type annotation
		if (columnType.includes('date') || columnType.includes('time') || columnType.includes('timestamp')) {
			const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
			if (parsedDates.length / values.length > 0.7) {
				// Determine if it's date, time, or datetime
				const hasTime = parsedDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = parsedDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		// Check column name patterns
		if (columnNameLower.includes('date') || columnNameLower.includes('time') || 
			columnNameLower.includes('timestamp') || columnNameLower.endsWith('dtc')) {
			const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
			if (parsedDates.length / values.length > 0.7) {
				const hasTime = parsedDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = parsedDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		// Try to parse values as dates
		const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
		if (parsedDates.length / values.length > 0.7) {
			// Check if parsed dates make sense (not all epoch 0)
			const validDates = parsedDates.filter(d => {
				const year = d!.getFullYear();
				return year >= 1900 && year <= 2100;
			});
			
			if (validDates.length / parsedDates.length > 0.8) {
				const hasTime = validDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = validDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		return null;
	}
	
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
			
			// Detect temporal type first
			const temporalType = detectTemporalType(col);
			const baseType = dataset.columns[col] || 'string';
			
			// Use temporal type if detected, otherwise use base type
			const displayType = temporalType ? temporalType : baseType;
			
			stats[col] = {
				type: displayType,
				missing,
				percentMissing: Math.round((missing / dataset.rows.length) * 1000) / 10,
				unique
			};
		}
		
		return stats;
	});
	
	// File upload is now handled externally via props/events
	
	// Sort handler
	function handleSort(column: string, event?: MouseEvent) {
		// If clickColumnForDetails is enabled, show details instead of sorting
		if (viewerSettings.clickColumnForDetails && event) {
			event.preventDefault();
			event.stopPropagation();
			selectedColumnForDetails = column;
			return;
		}
		
		// Clear multi-sort when using single column sort
		sortRules = [];
		
		if (sortColumn === column) {
			sortAscending = !sortAscending;
		} else {
			sortColumn = column;
			sortAscending = true;
		}
	}
	
	// Multi-sort handlers
	function handleApplyMultiSort(rules: SortRule[]) {
		sortRules = rules;
		sortColumn = null; // Clear single column sort
		sortAscending = true;
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
		console.log('🔍 Scroll event triggered - scrollTop:', scrollTop);
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
				<button
					class="sort-button-toolbar"
					onclick={() => showMultiSortModal = true}
					title="Multi-column sort"
				>
					⇅ Sort
					{#if sortRules.length > 0}
						<span class="sort-badge">{sortRules.length}</span>
					{/if}
				</button>
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
		<!-- Data Table with Virtualization -->
		<div class="table-container" style="height: {viewportHeight}px" onscroll={handleScroll}>
			<div class="spacer" style="height: {totalRows * rowHeight}px">
				<table class="data-table" class:fixed-columns={viewerSettings.fixedColumnWidths}>
					<thead>
						<tr>
							<th class="select-col">#</th>
							{#each columns as col (col)}
								<th style={viewerSettings.fixedColumnWidths && columnWidths[col] ? `width: ${columnWidths[col]}px !important; min-width: ${columnWidths[col]}px !important; max-width: ${columnWidths[col]}px !important;` : ''}>
									<div class="column-header">
										<button
											class="sort-button"
											class:details-mode={viewerSettings.clickColumnForDetails}
											onclick={(e) => handleSort(col, e)}
											title={viewerSettings.clickColumnForDetails ? 'Click to view column details' : 'Click to sort'}
										>
											{col}
											{#if !viewerSettings.clickColumnForDetails && sortColumn === col}
												<span class="sort-indicator">
													{sortAscending ? '▲' : '▼'}
												</span>
											{/if}
										</button>
										{#if viewerSettings.showColumnStats}
											<div class="column-stats">
												<div class="stat-item">
													<span class="stat-label">Type:</span>
													<span class="stat-value">{columnStats[col]?.type || 'unknown'}</span>
												</div>
												<div class="stat-item">
													<span class="stat-label">Miss:</span>
													<span class="stat-value">{columnStats[col]?.missing || 0} ({columnStats[col]?.percentMissing || 0}%)</span>
												</div>
												<div class="stat-item">
													<span class="stat-label">Unique:</span>
													<span class="stat-value">{columnStats[col]?.unique || 0}</span>
												</div>
											</div>
										{/if}
									</div>
								</th>
							{/each}
						</tr>
					</thead>
					<tbody>
						{#if startIndex > 0}
							<tr style="height: {startIndex * rowHeight}px; visibility: hidden;"><td colspan={columns.length + 1}></td></tr>
						{/if}
						{#each visibleRows as row, i (startIndex + i)}
							{@const rowIndex = startIndex + i}
							<tr
								class:selected={selectedRows.has(rowIndex)}
								onclick={() => toggleRowSelection(rowIndex)}
							>
								<td class="select-col">{rowIndex + 1}</td>
								{#each columns as col (col)}
									<td style={viewerSettings.fixedColumnWidths && columnWidths[col] ? `width: ${columnWidths[col]}px !important; min-width: ${columnWidths[col]}px !important; max-width: ${columnWidths[col]}px !important;` : ''}>{row[col] ?? ''}</td>
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
	
	{#if dataset && selectedColumnForDetails}
		<ColumnDetailsModal 
			dataset={dataset}
			columnName={selectedColumnForDetails}
			onClose={() => selectedColumnForDetails = null}
		/>
	{/if}
	
	{#if dataset && showMultiSortModal}
		<MultiSortModal 
			columns={columns}
			sortRules={sortRules}
			onClose={() => showMultiSortModal = false}
			onApply={handleApplyMultiSort}
		/>
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
	
	.sort-button-toolbar {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
		position: relative;
		white-space: nowrap;
	}
	
	.sort-button-toolbar:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
	}
	
	.sort-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		height: 1.25rem;
		padding: 0 0.375rem;
		background: var(--color-primary);
		color: white;
		border-radius: 0.75rem;
		font-size: 0.75rem;
		font-weight: 600;
		margin-left: 0.25rem;
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
	
	.column-header {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		min-width: 120px;
	}
	
	.column-stats {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.1rem 0.75rem 0.1rem;
		width: 100%;
		font-size: 0.7rem;
	}
	
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 0.5rem;
		width: 4.5rem;
	}
	
	.stat-label {
		color: var(--color-text-muted);
		font-weight: 500;
		flex-shrink: 0;
	}
	
	.stat-value {
		color: var(--color-text);
		font-weight: 400;
		text-align: right;
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
	
	.data-table.fixed-columns {
		table-layout: fixed;
		width: auto; /* Allow table to size based on column widths */
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
		vertical-align: top;
	}
	
	.sort-button {
		width: 100%;
		padding: 0.5rem 0.75rem 0.1rem;
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
	
	.sort-button.details-mode {
		cursor: pointer;
	}
	
	.sort-button.details-mode:hover {
		text-decoration: underline;
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
		
		.column-header {
			min-width: 100px;
		}
		
		.column-stats {
			font-size: 0.65rem;
			padding: 0.05rem 0.2rem 0.2rem;
			gap: 0.01rem;
		}
		
		.stat-item {
			gap: 0.25rem;
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

