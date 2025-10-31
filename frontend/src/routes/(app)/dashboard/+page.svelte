<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	import type { StoredDataset, StoredComplianceRun } from '$lib/server/database';
	import type { StandardSummary } from '$lib/standards/types';
	import type { EnhancedDataset } from '$lib/stores/datasets.svelte';
	import { 
		getDatasets, 
		addDataset, 
		removeDataset, 
		clearAllDatasets,
		setSelectedStandard 
	} from '$lib/stores/datasets.svelte';
	import DatasetRawView from '$lib/components/DatasetRawView.svelte';
	import DatasetViewerModal from '$lib/components/DatasetViewerModal.svelte';
	import DatasetGridViewModal from '$lib/components/DatasetGridViewModal.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { parseFileWithParser } from '$lib/utils/fileParser';
	import { goto } from '$app/navigation';
	
	let { data }: { 
		data: {
			datasets: StoredDataset[]; 
			runs: StoredComplianceRun[];
			standards: StandardSummary[];
		}
	} = $props();
	
	
	// Get datasets from store
	const store = getDatasets();
	
	// State for file upload and parsing
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let showUploadArea = $state(true);
	let viewingRawDataset = $state<EnhancedDataset | null>(null);
	let viewingDataset = $state<EnhancedDataset | null>(null);
	let viewingGridDataset = $state<EnhancedDataset | null>(null);
	
	// Auto-hide upload area when datasets are loaded
	$effect(() => {
		if (store.hasDatasets) {
			showUploadArea = false;
		}
	});
	
	// File upload handler using shared component
	async function handleFileUpload(files: File[], parser: 'pandas' | 'r') {
		uploading = true;
		uploadError = null;
		
		try {
			for (const file of files) {
				try {
					const dataset = await parseFileWithParser(file, parser);
					addDataset(dataset);
				} catch (err) {
					console.error(`Failed to parse ${file.name}:`, err);
					uploadError = `Failed to parse ${file.name}: ${err instanceof Error ? err.message : String(err)}`;
				}
			}
		} finally {
			uploading = false;
		}
	}
	
	// Remove dataset handler
	function handleRemoveDataset(name: string) {
		removeDataset(name);
	}
	
	// Open dataset in viewer (modal)
	function openInViewer(dataset: EnhancedDataset) {
		viewingDataset = dataset;
	}
	
	// View raw dataset
	function viewRaw(dataset: EnhancedDataset) {
		viewingRawDataset = dataset;
	}
	
	// Open grid viewer for a dataset
	function openGridViewer(dataset: EnhancedDataset) {
		viewingGridDataset = dataset;
	}
	
	// Run compliance check for a single dataset
	function runComplianceCheck(datasetName: string) {
		if (!store.selectedStandard) {
			alert('Please select a compliance standard first');
			return;
		}
		
		const dataset = store.all.get(datasetName);
		if (!dataset) return;
		
		// Navigate to compliance results page with single dataset
		goto(`/compliance-results?datasets=${encodeURIComponent(datasetName)}&standard=${encodeURIComponent(store.selectedStandard)}`);
	}
	
	// Clear all datasets handler
	function handleClearAll() {
		if (confirm('Clear all uploaded datasets?')) {
			clearAllDatasets();
			showUploadArea = true; // Show upload area after clearing
		}
	}
	
	// Toggle upload area
	function toggleUploadArea() {
		showUploadArea = !showUploadArea;
	}
	
	// Handle standard selection change
	function handleStandardChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		setSelectedStandard(select.value);
	}
	
	// Run batch compliance check
	async function runBatchCompliance() {
		if (!store.selectedStandard) {
			alert('Please select a compliance standard first');
			return;
		}
		
		if (!confirm(`Run compliance check on all ${store.all.size} datasets?`)) {
			return;
		}
		
		// Navigate to results page with dataset names
		const datasetNames = Array.from(store.all.keys()).join(',');
		goto(`/compliance-results?datasets=${encodeURIComponent(datasetNames)}&standard=${encodeURIComponent(store.selectedStandard)}`);
	}
</script>

<div class="dashboard">
	<header class="page-header">
		<h1>Compliance Dashboard</h1>
		<p>Upload datasets, select a standard, and run compliance checks</p>
	</header>
	
	<!-- Upload Section -->
	<section class="card upload-section">
		<div class="section-header">
			<h2>1. Upload Datasets</h2>
			{#if store.hasDatasets && !showUploadArea}
				<div class="action-buttons">
					<button class="btn-primary" onclick={toggleUploadArea}>
						Add More Datasets
					</button>
					<button class="btn-danger" onclick={handleClearAll}>
						Delete All
					</button>
				</div>
			{/if}
		</div>
		
		{#if showUploadArea || !store.hasDatasets}
			<FileUpload 
				onUpload={handleFileUpload}
				bind:uploading
				bind:uploadError
				bind:showUpload={showUploadArea}
			/>
			
			{#if store.hasDatasets && showUploadArea}
				<button class="btn-secondary" onclick={toggleUploadArea}>
					Done Adding
				</button>
			{/if}
		{/if}
		
		{#if store.hasDatasets}
			<div class="datasets-table-wrapper">
				<table class="datasets-table">
					<thead>
						<tr>
							<th>Status</th>
							<th>Dataset Name</th>
							<th class="text-right">Rows</th>
							<th class="text-right">Columns</th>
							<th class="text-center">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each Array.from(store.all.entries()) as [name, dataset] (name)}
							<tr>
								<td class="status-cell">
									<span 
										class="status-icon" 
										title={dataset.sdtmCompliance.isCompliant 
											? `SDTM ${dataset.sdtmCompliance.type}: ${dataset.sdtmCompliance.domain}`
											: 'Not SDTM compliant'}
									>
										{dataset.sdtmCompliance.icon}
									</span>
								</td>
								<td class="dataset-name">
									<strong>{dataset.name}</strong>
									{#if dataset.sdtmCompliance.domain}
										<span class="domain-tag">{dataset.sdtmCompliance.domain}</span>
									{/if}
								</td>
								<td class="text-right">{dataset.rowCount.toLocaleString()}</td>
								<td class="text-right">{Object.keys(dataset.columns).length}</td>
								<td class="actions-cell">
									<button 
										class="btn-table btn-view" 
										onclick={() => openInViewer(dataset)}
										title="View dataset in modal"
									>
										View
									</button>
									<button 
										class="btn-table btn-grid" 
										onclick={() => openGridViewer(dataset)}
										title="View dataset in grid"
									>
										Grid
									</button>
									<button 
										class="btn-table btn-raw" 
										onclick={() => viewRaw(dataset)}
										title="View raw data"
									>
										Raw
									</button>
									<button 
										class="btn-table btn-check" 
										onclick={() => runComplianceCheck(name)}
										disabled={!store.selectedStandard}
										title="Check compliance"
									>
										Check
									</button>
									<button 
										class="btn-table btn-remove" 
										onclick={() => handleRemoveDataset(name)}
										title="Remove dataset"
									>
										Remove
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
	
	<!-- Compliance Standard Selection -->
	{#if store.hasDatasets}
		<section class="card standard-section">
			<div class="section-header">
				<h2>2. Select Compliance Standard</h2>
			</div>
			
			<div class="standard-select-wrapper">
				<select value={store.selectedStandard} onchange={handleStandardChange} class="standard-select">
					<option value="">-- Select a standard --</option>
					{#each data.standards as standard}
						<option value={standard.id}>
							{standard.name} v{standard.version} - {standard.description}
						</option>
					{/each}
				</select>
				
				{#if store.selectedStandard}
					<div class="alert alert-success">
						Standard selected: {data.standards.find(s => s.id === store.selectedStandard)?.name}
					</div>
				{/if}
			</div>
		</section>
		
		<!-- Batch Compliance Check -->
		<section class="card compliance-section">
			<div class="section-header">
				<h2>3. Run Compliance Checks</h2>
			</div>
			
			{#if !store.selectedStandard}
				<div class="alert alert-warning">
					Please select a compliance standard first
				</div>
			{:else}
				<div class="batch-actions">
					<p>You can run compliance checks individually using the "Check" button in the table above, or run them all at once:</p>
					<button 
						class="btn-primary btn-large"
						onclick={runBatchCompliance}
					>
						Run Batch Compliance Check ({store.all.size} datasets)
					</button>
				</div>
			{/if}
		</section>
	{/if}
	
	<!-- Recent Compliance Runs -->
	{#if data.runs.length > 0}
		<section class="card runs-section">
			<h2>Recent Compliance Runs</h2>
			
			<div class="runs-table-wrapper">
				<table class="runs-table">
					<thead>
						<tr>
							<th>Dataset</th>
							<th>Standard</th>
							<th>Total</th>
							<th>Errors</th>
							<th>Warnings</th>
							<th>Date</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each data.runs as run}
							<tr>
								<td><strong>{run.datasetName}</strong></td>
								<td>{run.standardId}</td>
								<td>{run.summary.total}</td>
								<td class={run.summary.errors > 0 ? 'text-error' : ''}>{run.summary.errors}</td>
								<td class={run.summary.warnings > 0 ? 'text-warning' : ''}>{run.summary.warnings}</td>
								<td>{new Date(run.startedAt).toLocaleString()}</td>
								<td>
									<a href={`/reviews/${run.id}`} class="btn-link">View Report →</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</section>
	{/if}
</div>

<!-- Modals -->
{#if viewingRawDataset}
	<DatasetRawView dataset={viewingRawDataset} onClose={() => viewingRawDataset = null} />
{/if}

{#if viewingDataset}
	<DatasetViewerModal dataset={viewingDataset} onClose={() => viewingDataset = null} />
{/if}

{#if viewingGridDataset}
	<DatasetGridViewModal dataset={viewingGridDataset} onClose={() => viewingGridDataset = null} />
{/if}

<style>
	.dashboard {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.page-header {
		text-align: center;
		margin-bottom: 1rem;
	}
	
	.page-header h1 {
		font-size: 2.5rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}
	
	.page-header p {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
	}
	
	.card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: var(--shadow-md);
	}
	
	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	
	.section-header h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
	}
	
	.action-buttons {
		display: flex;
		gap: 0.75rem;
	}
	
	
	/* Datasets List */
	.datasets-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		margin-top: 1.5rem;
	}
	
	.dataset-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		transition: all 0.2s;
	}
	
	.dataset-card:hover {
		border-color: var(--color-primary);
		box-shadow: var(--shadow-sm);
	}
	
	.dataset-info h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}
	
	.dataset-meta {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--color-text-muted);
	}
	
	.domain-badge {
		padding: 0.125rem 0.5rem;
		background: var(--color-primary);
		color: white;
		border-radius: 0.25rem;
		font-weight: 600;
	}
	
	.dataset-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	/* Buttons */
	.btn-primary, .btn-secondary, .btn-icon, .btn-danger {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}
	
	.btn-primary {
		background: var(--color-primary);
		color: white;
	}
	
	.btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-md);
	}
	
	.btn-primary:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		margin-top: 1rem;
		width: 100%;
	}
	
	.btn-secondary:hover {
		background: var(--color-surface-hover);
	}
	
	.btn-icon {
		background: var(--color-bg-secondary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}
	
	.btn-icon:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	
	.btn-danger {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}
	
	.btn-danger:hover {
		background: var(--color-error);
		color: white;
		border-color: var(--color-error);
	}
	
	.btn-link {
		color: var(--color-primary);
		text-decoration: none;
		font-weight: 600;
	}
	
	.btn-link:hover {
		text-decoration: underline;
	}
	
	/* Table Buttons */
	.actions-cell {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.btn-table {
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		background: var(--color-bg-secondary);
		color: var(--color-text);
	}
	
	.btn-table:hover:not(:disabled) {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.btn-table:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.btn-view {
		border-color: rgba(56, 189, 248, 0.3);
		color: #38bdf8;
	}
	
	.btn-view:hover {
		background: rgba(56, 189, 248, 0.1);
	}
	
	.btn-grid {
		border-color: rgba(168, 85, 247, 0.3);
		color: #a855f7;
	}
	
	.btn-grid:hover {
		background: rgba(168, 85, 247, 0.1);
	}
	
	.btn-raw {
		border-color: rgba(148, 163, 184, 0.3);
		color: #94a3b8;
	}
	
	.btn-raw:hover {
		background: rgba(148, 163, 184, 0.1);
	}
	
	.btn-check {
		border-color: rgba(34, 197, 94, 0.3);
		color: #22c55e;
	}
	
	.btn-check:hover:not(:disabled) {
		background: rgba(34, 197, 94, 0.1);
	}
	
	.btn-remove {
		border-color: rgba(239, 68, 68, 0.3);
		color: #ef4444;
	}
	
	.btn-remove:hover {
		background: rgba(239, 68, 68, 0.1);
	}
	
	/* Standard Selection */
	.standard-select-wrapper {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.standard-select {
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 2px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-bg);
		color: var(--color-text);
		cursor: pointer;
	}
	
	.standard-select:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	
	/* Compliance Actions */
	.compliance-actions {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.compliance-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem;
		background: var(--color-bg-secondary);
		border-radius: 0.5rem;
	}
	
	.compliance-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}
	
	/* Alerts */
	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 1rem;
	}
	
	.alert-error {
		background: rgba(220, 38, 38, 0.1);
		color: var(--color-error);
		border: 1px solid var(--color-error);
	}
	
	.alert-warning {
		background: rgba(245, 158, 11, 0.1);
		color: var(--color-warning);
		border: 1px solid var(--color-warning);
	}
	
	.alert-success {
		background: rgba(5, 150, 105, 0.1);
		color: var(--color-success);
		border: 1px solid var(--color-success);
	}
	
	/* Table */
	.runs-table-wrapper {
		overflow-x: auto;
	}
	
	.runs-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	
	.runs-table th,
	.runs-table td {
		text-align: left;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid var(--color-border);
	}
	
	.runs-table th {
		font-weight: 600;
		color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
	}
	
	.runs-table tbody tr:hover {
		background: var(--color-bg-secondary);
	}
	
	.text-muted {
		color: var(--color-text-muted);
	}
	
	.text-error {
		color: var(--color-error);
		font-weight: 600;
	}
	
	.text-warning {
		color: var(--color-warning);
		font-weight: 600;
	}
</style>
