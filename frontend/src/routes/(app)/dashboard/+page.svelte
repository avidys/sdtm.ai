<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	import type { StoredDataset, StoredComplianceRun } from '$lib/server/database';
	import type { StandardSummary } from '$lib/standards/types';
	import { 
		getDatasets, 
		addDataset,
		addFailedDataset,
		removeDataset, 
		clearAllDatasets,
		setSelectedStandard,
		type DatasetEntry,
		type EnhancedDataset,
		type FailedDataset
	} from '$lib/stores/datasets.svelte';
	import DatasetRawView from '$lib/components/DatasetRawView.svelte';
	import DatasetViewerModal from '$lib/components/DatasetViewerModal.svelte';
	import DatasetGridViewModal from '$lib/components/DatasetGridViewModal.svelte';
	import FileUpload from '$lib/components/FileUpload.svelte';
	import { parseFileWithParser } from '$lib/utils/fileParser';
	import { shortenStandardName } from '$lib/utils/standardNames';
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
	let selectedParser = $state<'pandas' | 'r'>('pandas');
	let viewingRawDataset = $state<EnhancedDataset | null>(null);
	let viewingDataset = $state<EnhancedDataset | null>(null);
	let viewingGridDataset = $state<EnhancedDataset | null>(null);
	let openDropdown = $state<string | null>(null);
	
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
					let errorMessage = err instanceof Error ? err.message : String(err);
					// Extract just the backend error message if it contains prefixes
					const parserPrefix = 'parser replied: ';
					if (errorMessage.toLowerCase().includes(parserPrefix.toLowerCase())) {
						const prefixIndex = errorMessage.toLowerCase().indexOf(parserPrefix.toLowerCase());
						errorMessage = errorMessage.substring(prefixIndex + parserPrefix.length).trim();
					}
					// Remove "Failed to parse {filename};" prefix if still present
					const filePrefix = `Failed to parse ${file.name};`;
					if (errorMessage.startsWith(filePrefix)) {
						errorMessage = errorMessage.substring(filePrefix.length).trim();
					}
					// Add failed dataset to store so it appears in the table
					// Don't set uploadError here - the table shows individual status for each dataset
					addFailedDataset(file.name, errorMessage);
				}
			}
		} finally {
			uploading = false;
			// Clear any error message since the table shows individual parsing status
			uploadError = null;
		}
	}
	
	// Remove dataset handler
	function handleRemoveDataset(name: string) {
		removeDataset(name);
	}
	
	// Toggle dropdown
	function toggleDropdown(name: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		openDropdown = openDropdown === name ? null : name;
	}
	
	// Close dropdown
	function closeDropdown() {
		openDropdown = null;
	}
	
	// Close dropdown when clicking outside
	$effect(() => {
		if (typeof window !== 'undefined' && openDropdown) {
			const handleClick = (e: MouseEvent) => {
				const target = e.target as HTMLElement;
				if (!target.closest(`[data-dropdown="${openDropdown}"]`)) {
					closeDropdown();
				}
			};
			window.addEventListener('click', handleClick);
			return () => window.removeEventListener('click', handleClick);
		}
	});
	
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
			<div class="header-actions">
				{#if showUploadArea || !store.hasDatasets}
					<div class="parser-selector-header">
						<label for="parser-select-dashboard">
							<span>Parser:</span>
							<select 
								id="parser-select-dashboard"
								bind:value={selectedParser}
								disabled={uploading}
							>
								<option value="pandas">Pandas</option>
								<option value="r">R (haven)</option>
							</select>
						</label>
					</div>
				{/if}
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
		</div>
		
		{#if showUploadArea || !store.hasDatasets}
			<FileUpload 
				onUpload={handleFileUpload}
				bind:uploading
				bind:uploadError
				bind:showUpload={showUploadArea}
				hideParser={true}
				bind:selectedParser
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
							<th>SDTM</th>
							<th>Dataset Name</th>
							<th class="text-right">Rows</th>
							<th class="text-right">Columns</th>
							<th class="text-left">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#each Array.from(store.all.entries()) as [name, entry] (name)}
							{@const isFailed = 'parseStatus' in entry && entry.parseStatus === 'failed'}
							{@const dataset = isFailed ? null : entry as EnhancedDataset}
							{@const failed = isFailed ? entry as FailedDataset : null}
							<tr class:failed-row={isFailed}>
								<td class="status-cell">
									{#if isFailed}
										<span class="status-icon status-error" title="Parsing failed">
											✗
										</span>
									{:else if dataset}
										<span 
											class="status-icon" 
											title={dataset.sdtmCompliance.isCompliant 
												? `SDTM ${dataset.sdtmCompliance.type}: ${dataset.sdtmCompliance.domain}`
												: 'Not recognized as SDTM'}
										>
											{dataset.sdtmCompliance.icon}
										</span>
									{/if}
								</td>
								<td class="dataset-name">
									<strong>{name}</strong>
									{#if !isFailed && dataset?.sdtmCompliance.domain}
										<span class="domain-tag">{dataset.sdtmCompliance.domain}</span>
									{/if}
								</td>
								{#if isFailed}
									<td class="text-right">—</td>
									<td class="text-right">—</td>
								{:else if dataset}
									<td class="text-right">{dataset.rowCount.toLocaleString()}</td>
									<td class="text-right">{Object.keys(dataset.columns).length}</td>
								{/if}
								<td class="actions-cell">
									<!-- Desktop buttons -->
									<div class="actions-buttons-desktop">
										<button 
											class="btn-table btn-view" 
											onclick={() => !isFailed && dataset && openInViewer(dataset)}
											disabled={isFailed}
											title={isFailed ? 'View not available (parsing failed)' : 'View dataset in modal'}
										>
											View
										</button>
										<button 
											class="btn-table btn-grid" 
											onclick={() => !isFailed && dataset && openGridViewer(dataset)}
											disabled={isFailed}
											title={isFailed ? 'Grid view not available (parsing failed)' : 'View dataset in grid'}
										>
											Grid
										</button>
										<button 
											class="btn-table btn-raw" 
											onclick={() => !isFailed && dataset && viewRaw(dataset)}
											disabled={isFailed}
											title={isFailed ? 'Raw view not available (parsing failed)' : 'View raw data'}
										>
											Raw
										</button>
										<button 
											class="btn-table btn-check" 
											onclick={() => runComplianceCheck(name)}
											disabled={isFailed || !store.selectedStandard}
											title={isFailed ? 'Check not available (parsing failed)' : 'Check compliance'}
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
									</div>
									
									<!-- Mobile dropdown -->
									<div class="actions-dropdown-mobile" data-dropdown={name}>
										<button 
											class="btn-dropdown-toggle"
											onclick={(e) => toggleDropdown(name, e)}
											aria-expanded={openDropdown === name}
											aria-label="Actions menu"
										>
											Actions
											<span class="dropdown-arrow">▼</span>
										</button>
										{#if openDropdown === name}
											<div class="dropdown-menu">
												<button 
													class="dropdown-item"
													onclick={() => {
														if (!isFailed && dataset) openInViewer(dataset);
														closeDropdown();
													}}
													disabled={isFailed}
												>
													View
												</button>
												<button 
													class="dropdown-item"
													onclick={() => {
														if (!isFailed && dataset) openGridViewer(dataset);
														closeDropdown();
													}}
													disabled={isFailed}
												>
													Grid
												</button>
												<button 
													class="dropdown-item"
													onclick={() => {
														if (!isFailed && dataset) viewRaw(dataset);
														closeDropdown();
													}}
													disabled={isFailed}
												>
													Raw
												</button>
												<button 
													class="dropdown-item"
													onclick={() => {
														runComplianceCheck(name);
														closeDropdown();
													}}
													disabled={isFailed || !store.selectedStandard}
												>
													Check
												</button>
												<button 
													class="dropdown-item dropdown-item-danger"
													onclick={() => {
														handleRemoveDataset(name);
														closeDropdown();
													}}
												>
													Remove
												</button>
											</div>
										{/if}
									</div>
									
									{#if isFailed && failed}
										<span class="parse-status parse-status-error" title={failed.error}>
											fail: {failed.error}
										</span>
									{:else}
										<span class="parse-status parse-status-success">
											Success
										</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
			
			<!-- Mobile Card View -->
			<div class="datasets-mobile">
				{#each Array.from(store.all.entries()) as [name, entry] (name)}
					{@const isFailed = 'parseStatus' in entry && entry.parseStatus === 'failed'}
					{@const dataset = isFailed ? null : entry as EnhancedDataset}
					{@const failed = isFailed ? entry as FailedDataset : null}
					<div class="dataset-card-mobile" class:failed-card={isFailed}>
						<div class="dataset-card-row">
							<div class="dataset-card-info">
								{#if isFailed}
									<span class="status-icon status-error" title="Parsing failed">
										✗
									</span>
								{:else if dataset}
									<span 
										class="status-icon" 
										title={dataset.sdtmCompliance.isCompliant 
											? `SDTM ${dataset.sdtmCompliance.type}: ${dataset.sdtmCompliance.domain}`
											: 'Not recognized as SDTM'}
									>
										{dataset.sdtmCompliance.icon}
									</span>
								{/if}
								<div class="dataset-card-name">
									<strong>{name}</strong>
									{#if !isFailed && dataset?.sdtmCompliance.domain}
										<span class="domain-tag">{dataset.sdtmCompliance.domain}</span>
									{/if}
								</div>
								<div class="dataset-card-stats">
									{#if isFailed}
										<span class="stat-abbr">—/—</span>
									{:else if dataset}
										<span class="stat-abbr">
											{dataset.rowCount.toLocaleString()}/{Object.keys(dataset.columns).length}
										</span>
									{/if}
								</div>
							</div>
						</div>
						<div class="dataset-card-actions">
							<div class="actions-dropdown-mobile" data-dropdown={name}>
								<button 
									class="btn-dropdown-toggle"
									onclick={(e) => toggleDropdown(name, e)}
									aria-expanded={openDropdown === name}
									aria-label="Actions menu"
								>
									Actions
									<span class="dropdown-arrow">▼</span>
								</button>
								{#if openDropdown === name}
									<div class="dropdown-menu">
										<button 
											class="dropdown-item"
											onclick={() => {
												if (!isFailed && dataset) openInViewer(dataset);
												closeDropdown();
											}}
											disabled={isFailed}
										>
											View
										</button>
										<button 
											class="dropdown-item"
											onclick={() => {
												if (!isFailed && dataset) openGridViewer(dataset);
												closeDropdown();
											}}
											disabled={isFailed}
										>
											Grid
										</button>
										<button 
											class="dropdown-item"
											onclick={() => {
												if (!isFailed && dataset) viewRaw(dataset);
												closeDropdown();
											}}
											disabled={isFailed}
										>
											Raw
										</button>
										<button 
											class="dropdown-item"
											onclick={() => {
												runComplianceCheck(name);
												closeDropdown();
											}}
											disabled={isFailed || !store.selectedStandard}
										>
											Check
										</button>
										<button 
											class="dropdown-item dropdown-item-danger"
											onclick={() => {
												handleRemoveDataset(name);
												closeDropdown();
											}}
										>
											Remove
										</button>
									</div>
								{/if}
							</div>
							{#if isFailed && failed}
								<span class="parse-status parse-status-error" title={failed.error}>
									fail: {failed.error}
								</span>
							{:else}
								<span class="parse-status parse-status-success">
									Success
								</span>
							{/if}
						</div>
					</div>
				{/each}
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
							{shortenStandardName(standard.name, standard.version)} - {standard.description}
						</option>
					{/each}
				</select>
				
				{#if store.selectedStandard}
					<div class="alert alert-success">
						Standard selected: {
							(() => {
								const std = data.standards.find(s => s.id === store.selectedStandard);
								return std ? shortenStandardName(std.name, std.version) : store.selectedStandard;
							})()
						}
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
		width: 100%;
		box-sizing: border-box;
		overflow: hidden;
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
	
	.header-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
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

	.action-buttons {
		display: flex;
		gap: 0.75rem;
		align-items: center;
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
		align-items: flex-start;
		position: relative;
	}
	
	.actions-buttons-desktop {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.actions-dropdown-mobile {
		display: none;
		position: relative;
		width: 100%;
	}
	
	.failed-row {
		opacity: 0.7;
	}
	
	.failed-row td {
		color: var(--color-text-muted);
	}
	
	.status-error {
		color: var(--color-error);
		font-weight: 600;
	}
	
	.parse-status {
		padding: 0.4rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		display: inline-flex;
		align-items: center;
		margin-left: 0.5rem;
	}
	
	.parse-status-success {
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		white-space: nowrap;
	}
	
	.parse-status-error {
		color: var(--color-error);
		background: rgba(239, 68, 68, 0.1);
		max-width: 300px;
		word-wrap: break-word;
		white-space: normal;
		line-height: 1.3;
	}
	
	.btn-table {
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		background: var(--color-bg-secondary);
		color: var(--color-text-secondary);
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
	
	/* Mobile Dropdown */
	.btn-dropdown-toggle {
		padding: 0.5rem 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		background: var(--color-bg-secondary);
		color: var(--color-text);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.btn-dropdown-toggle:hover {
		background: var(--color-surface-hover);
		transform: translateY(-1px);
		box-shadow: var(--shadow-sm);
	}
	
	.dropdown-arrow {
		font-size: 0.6rem;
		transition: transform 0.2s;
	}
	
	.btn-dropdown-toggle[aria-expanded="true"] .dropdown-arrow {
		transform: rotate(180deg);
	}
	
	.dropdown-menu {
		position: absolute;
		top: calc(100% + 0.5rem);
		right: 0;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: var(--shadow-lg);
		min-width: 140px;
		z-index: 1000;
		overflow: hidden;
	}
	
	/* Mobile Card Layout */
	.dataset-card-mobile {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1rem;
		margin-bottom: 0.5rem;
		width: 100%;
		box-sizing: border-box;
	}
	
	.dataset-card-mobile.failed-card {
		opacity: 0.7;
	}
	
	.dataset-card-row {
		margin-bottom: 0.5rem;
	}
	
	.dataset-card-info {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: nowrap;
		width: 100%;
	}
	
	.dataset-card-name {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.dataset-card-name strong {
		font-size: 1rem;
		color: var(--color-text);
		word-break: break-word;
		display: inline-block;
	}
	
	.dataset-card-stats {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		margin-left: auto;
		font-size: 0.875rem;
	}
	
	.stat-abbr {
		font-weight: 600;
		color: var(--color-text);
		white-space: nowrap;
	}
	
	.stat {
		display: flex;
		gap: 0.25rem;
		align-items: center;
	}
	
	.stat-label {
		font-weight: 500;
	}
	
	.stat-value {
		font-weight: 600;
		color: var(--color-text);
	}
	
	.dataset-card-actions {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--color-border);
		flex-wrap: wrap;
		justify-content: space-between;
	}
	
	.dropdown-item {
		display: block;
		width: 100%;
		padding: 0.75rem 1rem;
		text-align: left;
		border: none;
		background: transparent;
		color: var(--color-text);
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.2s;
		border-bottom: 1px solid var(--color-border);
	}
	
	.dropdown-item:last-child {
		border-bottom: none;
	}
	
	.dropdown-item:hover:not(:disabled) {
		background: var(--color-surface-hover);
		color: var(--color-primary);
	}
	
	.dropdown-item:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.dropdown-item-danger {
		color: var(--color-error);
	}
	
	.dropdown-item-danger:hover:not(:disabled) {
		background: rgba(239, 68, 68, 0.1);
		color: var(--color-error);
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
	.datasets-table-wrapper {
		overflow-x: auto;
		margin-top: 1rem;
	}
	
	.datasets-mobile {
		display: none;
		width: 100%;
		box-sizing: border-box;
	}
	
	.datasets-table {
		width: 100%;
		border-collapse: separate;
		border-spacing: 0;
	}
	
	.datasets-table th,
	.datasets-table td {
		padding: 0.5rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}
	
	/* First 4 columns (SDTM, Dataset Name, Rows, Columns) - reduced gap */
	.datasets-table th:nth-child(-n+4),
	.datasets-table td:nth-child(-n+4) {
		padding-right: 0.5rem;
	}
	
	/* Actions column - keep normal spacing */
	.datasets-table th:nth-child(5),
	.datasets-table td:nth-child(5) {
		padding-right: 1rem;
	}
	
	/* Status column (last) - no extra padding on right */
	.datasets-table th:last-child,
	.datasets-table td:last-child {
		padding-right: 1.25rem;
	}
	
	/* All columns except last have spacing */
	.datasets-table th:not(:last-child),
	.datasets-table td:not(:last-child) {
		border-right: 1px solid transparent;
	}
	
	.datasets-table th {
		font-weight: 600;
		color: var(--color-text-secondary);
		background: var(--color-bg-secondary);
		text-align: left;
	}
	
	.datasets-table tbody tr:hover {
		background: var(--color-bg-secondary);
	}
	
	.datasets-table .text-right {
		text-align: right;
	}
	
	.datasets-table .text-center {
		text-align: center;
	}
	
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
	
	/* Mobile Responsive Styles */
	@media (max-width: 768px) {
		.page-header {
			margin-top: 0.5rem;
			margin-bottom: 0.5rem;
		}
		
		.page-header h1 {
			font-size: 1.75rem;
			margin-bottom: 0.25rem;
		}
		
		.page-header p {
			font-size: 1rem;
		}
		
		.card {
			padding: 1.5rem;
			width: 100%;
			box-sizing: border-box;
			overflow-x: hidden;
			max-width: 100vw;
		}
		
		.section-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		
		.section-header h2 {
			font-size: 1.25rem;
		}
		
		.header-actions {
			width: 100%;
			flex-wrap: wrap;
			gap: 0.75rem;
		}
		
		.parser-selector-header {
			width: 100%;
		}
		
		.parser-selector-header label {
			width: 100%;
		}
		
		.parser-selector-header select {
			flex: 1;
			min-width: 0;
		}
		
		.datasets-table-wrapper {
			display: none !important;
			width: 0 !important;
			height: 0 !important;
			overflow: hidden !important;
			padding: 0 !important;
			margin: 0 !important;
		}
		
		.datasets-table {
			display: none !important;
		}
		
		.datasets-mobile {
			display: block !important;
			width: 100% !important;
			padding: 0;
			margin: 0;
			box-sizing: border-box;
			max-width: 100%;
		}
		
		.dataset-card-actions {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
			gap: 0.75rem;
		}
		
		.actions-dropdown-mobile {
			display: block !important;
			width: auto;
			flex-shrink: 0;
		}
		
		.parse-status {
			flex: 1;
			text-align: right;
			justify-content: flex-end;
		}
		
		.btn-dropdown-toggle {
			width: auto;
			justify-content: center;
			display: flex;
			padding: 0.5rem 1rem;
		}
		
		.actions-buttons-desktop {
			display: none !important;
		}
		
		.parse-status {
			font-size: 0.75rem;
			padding: 0.35rem 0.6rem;
			text-align: right;
			flex: 1;
			display: flex;
			justify-content: flex-end;
		}
		
		.parse-status-error {
			max-width: none;
			font-size: 0.7rem;
			word-wrap: break-word;
			white-space: normal;
			text-align: right;
		}
		
		.actions-dropdown-mobile {
			flex-shrink: 0;
		}
		
		.dataset-card-info {
			flex-wrap: nowrap;
			align-items: center;
		}
		
		.dataset-card-name {
			flex: 1;
			min-width: 120px;
		}
		
		.dataset-card-stats {
			flex-shrink: 0;
		}
		
		.action-buttons {
			display: flex;
			align-items: center;
			gap: 0.75rem;
			flex-wrap: nowrap;
			width: 100%;
			justify-content: space-between;
			overflow: hidden;
		}
		
		.action-buttons button {
			flex-shrink: 1;
			min-width: 0;
		}
		
		.dataset-card-stats {
			text-align: right;
		}
	}
	
	@media (max-width: 480px) {
		.card {
			padding: 1rem;
		}
		
		.page-header {
			margin-top: 0.25rem;
			margin-bottom: 0.25rem;
		}
		
		.page-header h1 {
			font-size: 1.5rem;
			margin-bottom: 0.25rem;
		}
		
		.dataset-card-mobile {
			padding: 0.75rem;
		}
		
		.dataset-card-title-row {
			gap: 0.5rem;
		}
		
		.dataset-card-name strong {
			font-size: 0.9rem;
		}
		
		.dataset-card-stats {
			font-size: 0.8rem;
		}
	}
</style>
