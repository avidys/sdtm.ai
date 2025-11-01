<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import type { PageData } from './$types';
	import type { ComplianceRun } from '$lib/standards/types';
	import { getDatasets, type EnhancedDataset } from '$lib/stores/datasets.svelte';
	import { runComplianceCheck } from '$lib/standards/compliance';
	import { getStandardSummary } from '$lib/standards/catalog';
	import * as XLSX from 'xlsx';

	let { data }: { data: PageData } = $props();

	const store = getDatasets();
	let complianceRuns = $state<ComplianceRun[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		if (data.error || !data.standard) {
			error = data.error || 'Failed to load standard definition';
			loading = false;
			return;
		}

		try {
			// Get datasets from store and filter out failed datasets
			const datasetsToCheck = data.datasetNames
				.map((name) => store.all.get(name))
				.filter((ds): ds is EnhancedDataset => 
					ds !== undefined && 
					!('parseStatus' in ds && ds.parseStatus === 'failed')
				);

			if (datasetsToCheck.length === 0) {
				error = 'No valid datasets found. Please return to dashboard and upload datasets.';
				loading = false;
				return;
			}

			// Run compliance checks
			const runs: ComplianceRun[] = [];
			for (const dataset of datasetsToCheck) {
				const run = runComplianceCheck({
					standard: data.standard!,
					dataset
				});
				runs.push(run);
			}

			complianceRuns = runs;
			loading = false;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to run compliance checks';
			loading = false;
		}
	});

	function downloadExcel() {
		if (complianceRuns.length === 0) return;

		// Create workbook with summary sheet
		const wb = XLSX.utils.book_new();

		// Summary sheet
		const summaryData = complianceRuns.map((run) => ({
			'Dataset Name': run.datasetName,
			'Standard': getStandardSummary(run.standardId)?.name || run.standardId,
			'Total Findings': run.summary.total,
			'Errors': run.summary.errors,
			'Warnings': run.summary.warnings,
			'Completed At': run.completedAt || run.startedAt
		}));
		const summarySheet = XLSX.utils.json_to_sheet(summaryData);
		XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

		// Findings sheet (all findings from all runs)
		const findingsData = complianceRuns.flatMap((run) =>
			run.findings.map((finding) => ({
				'Dataset': run.datasetName,
				'Domain': finding.domain,
				'Variable': finding.variable || '',
				'Severity': finding.severity,
				'Message': finding.message,
				'Rule Reference': finding.ruleReference || '',
				'Standard': getStandardSummary(run.standardId)?.name || run.standardId
			}))
		);
		const findingsSheet = XLSX.utils.json_to_sheet(findingsData);
		XLSX.utils.book_append_sheet(wb, findingsSheet, 'Findings');

		// Download
		const fileName = `compliance-results-${new Date().toISOString().split('T')[0]}.xlsx`;
		XLSX.writeFile(wb, fileName);
	}

	function goBack() {
		goto('/dashboard');
	}

	const totalFindings = $derived(complianceRuns.reduce((sum, run) => sum + run.summary.total, 0));
	const totalErrors = $derived(complianceRuns.reduce((sum, run) => sum + run.summary.errors, 0));
	const totalWarnings = $derived(complianceRuns.reduce((sum, run) => sum + run.summary.warnings, 0));
	const standardName = $derived(data.standard ? `${data.standard.name} v${data.standard.version}` : 'Unknown');
</script>

<div class="compliance-results">
	<header class="page-header">
		<h1>📋 Compliance Check Results</h1>
		<div class="header-actions">
			<button class="btn-secondary" onclick={goBack}>← Back to Dashboard</button>
			{#if !loading && complianceRuns.length > 0}
				<button class="btn-primary" onclick={downloadExcel}>📥 Download Excel</button>
			{/if}
		</div>
	</header>

	{#if loading}
		<div class="loading-state">
			<div class="spinner"></div>
			<p>Running compliance checks...</p>
		</div>
	{:else if error}
		<div class="error-state">
			<div class="alert alert-error">
				<h2>⚠️ Error</h2>
				<p>{error}</p>
				<button class="btn-primary" onclick={goBack}>Return to Dashboard</button>
			</div>
		</div>
	{:else if complianceRuns.length === 0}
		<div class="empty-state">
			<div class="alert alert-warning">
				<h2>No Results</h2>
				<p>No compliance results found. Please return to dashboard and run a compliance check.</p>
				<button class="btn-primary" onclick={goBack}>Return to Dashboard</button>
			</div>
		</div>
	{:else}
		<!-- Summary Cards -->
		<div class="summary-cards">
			<div class="summary-card">
				<div class="summary-label">Standard</div>
				<div class="summary-value">{standardName}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Datasets Checked</div>
				<div class="summary-value">{complianceRuns.length}</div>
			</div>
			<div class="summary-card">
				<div class="summary-label">Total Findings</div>
				<div class="summary-value">{totalFindings}</div>
			</div>
			<div class="summary-card summary-card-error">
				<div class="summary-label">Errors</div>
				<div class="summary-value">{totalErrors}</div>
			</div>
			<div class="summary-card summary-card-warning">
				<div class="summary-label">Warnings</div>
				<div class="summary-value">{totalWarnings}</div>
			</div>
		</div>

		<!-- Results Table -->
		<div class="results-section">
			<h2>Dataset Results</h2>
			<div class="table-wrapper">
				<table class="results-table">
					<thead>
						<tr>
							<th>Dataset</th>
							<th>Total</th>
							<th>Errors</th>
							<th>Warnings</th>
							<th>Status</th>
						</tr>
					</thead>
					<tbody>
						{#each complianceRuns as run}
							<tr class={run.summary.errors > 0 ? 'has-errors' : run.summary.warnings > 0 ? 'has-warnings' : 'compliant'}>
								<td>
									<strong>{run.datasetName}</strong>
								</td>
								<td>{run.summary.total}</td>
								<td class={run.summary.errors > 0 ? 'error-count' : ''}>{run.summary.errors}</td>
								<td class={run.summary.warnings > 0 ? 'warning-count' : ''}>{run.summary.warnings}</td>
								<td>
									{#if run.summary.errors > 0}
										<span class="badge badge-error">❌ Non-Compliant</span>
									{:else if run.summary.warnings > 0}
										<span class="badge badge-warning">⚠️ Warnings</span>
									{:else}
										<span class="badge badge-success">✓ Compliant</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>

		<!-- Detailed Findings -->
		<div class="findings-section">
			<h2>Detailed Findings</h2>
			{#each complianceRuns as run}
				<div class="dataset-findings">
					<h3>
						{run.datasetName}
						<span class="finding-count">
							({run.summary.total} finding{run.summary.total !== 1 ? 's' : ''})
						</span>
					</h3>

					{#if run.findings.length === 0}
						<div class="no-findings">
							<p>✓ No issues found. Dataset is compliant.</p>
						</div>
					{:else}
						<div class="findings-list">
							{#each run.findings as finding}
								<div class="finding finding-{finding.severity}">
									<div class="finding-header">
										<span class="finding-severity">{finding.severity.toUpperCase()}</span>
										<span class="finding-domain">{finding.domain}</span>
										{#if finding.variable}
											<span class="finding-variable">.{finding.variable}</span>
										{/if}
									</div>
									<div class="finding-message">{finding.message}</div>
									{#if finding.ruleReference}
										<div class="finding-reference">Reference: {finding.ruleReference}</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	.compliance-results {
		padding: 2rem;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--color-border);
	}

	.page-header h1 {
		margin: 0;
		font-size: 2rem;
		color: var(--color-text);
	}

	.header-actions {
		display: flex;
		gap: 1rem;
	}

	.loading-state,
	.error-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
	}

	.spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--color-border);
		border-top-color: var(--color-primary);
		border-radius: 50%;
		animation: spin 1s linear infinite;
		margin-bottom: 1rem;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.summary-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.summary-card {
		background: var(--color-surface);
		border-radius: 0.75rem;
		padding: 1.5rem;
		border: 2px solid var(--color-border);
		box-shadow: var(--shadow-sm);
	}

	.summary-card-error {
		border-color: #ef4444;
	}

	.summary-card-warning {
		border-color: #f59e0b;
	}

	.summary-label {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		margin-bottom: 0.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.summary-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.results-section,
	.findings-section {
		background: var(--color-surface);
		border-radius: 0.75rem;
		padding: 1.5rem;
		margin-bottom: 2rem;
		box-shadow: var(--shadow-sm);
	}

	.results-section h2,
	.findings-section h2 {
		margin: 0 0 1.5rem 0;
		font-size: 1.5rem;
		color: var(--color-text);
	}

	.table-wrapper {
		overflow-x: auto;
	}

	.results-table {
		width: 100%;
		border-collapse: collapse;
	}

	.results-table thead {
		background: var(--color-bg-secondary);
	}

	.results-table th {
		padding: 1rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-border);
	}

	.results-table td {
		padding: 1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.results-table tbody tr:hover {
		background: var(--color-bg-secondary);
	}

	.results-table tbody tr.compliant {
		border-left: 4px solid #10b981;
	}

	.results-table tbody tr.has-warnings {
		border-left: 4px solid #f59e0b;
	}

	.results-table tbody tr.has-errors {
		border-left: 4px solid #ef4444;
	}

	.error-count {
		color: #ef4444;
		font-weight: 600;
	}

	.warning-count {
		color: #f59e0b;
		font-weight: 600;
	}

	.badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 600;
	}

	.badge-success {
		background: #d1fae5;
		color: #065f46;
	}

	.badge-warning {
		background: #fef3c7;
		color: #92400e;
	}

	.badge-error {
		background: #fee2e2;
		color: #991b1b;
	}

	.dataset-findings {
		margin-bottom: 2rem;
		padding-bottom: 2rem;
		border-bottom: 1px solid var(--color-border);
	}

	.dataset-findings:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.dataset-findings h3 {
		margin: 0 0 1rem 0;
		font-size: 1.25rem;
		color: var(--color-text);
	}

	.finding-count {
		font-size: 1rem;
		font-weight: normal;
		color: var(--color-text-muted);
	}

	.no-findings {
		padding: 1rem;
		background: #d1fae5;
		border-radius: 0.5rem;
		color: #065f46;
	}

	.findings-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.finding {
		background: var(--color-bg-secondary);
		border-radius: 0.5rem;
		padding: 1rem;
		border-left: 4px solid var(--color-border);
	}

	.finding-error {
		border-left-color: #ef4444;
		background: #fef2f2;
	}

	.finding-warning {
		border-left-color: #f59e0b;
		background: #fffbeb;
	}

	.finding-info {
		border-left-color: #3b82f6;
		background: #eff6ff;
	}

	.finding-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-bottom: 0.5rem;
		font-weight: 600;
	}

	.finding-severity {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.finding-error .finding-severity {
		background: #ef4444;
		color: white;
	}

	.finding-warning .finding-severity {
		background: #f59e0b;
		color: white;
	}

	.finding-info .finding-severity {
		background: #3b82f6;
		color: white;
	}

	.finding-domain {
		color: var(--color-text);
	}

	.finding-variable {
		color: var(--color-text-muted);
		font-family: 'Fira Code', 'Cascadia Code', monospace;
	}

	.finding-message {
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.finding-reference {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		font-style: italic;
	}

	.btn-primary,
	.btn-secondary {
		padding: 0.6rem 1.2rem;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
		border: none;
	}

	.btn-primary {
		background: var(--color-primary);
		color: white;
	}

	.btn-primary:hover {
		background: var(--color-primary-hover);
	}

	.btn-secondary {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover {
		background: var(--color-surface-hover);
	}

	.alert {
		padding: 1.5rem;
		border-radius: 0.75rem;
		max-width: 600px;
		text-align: center;
	}

	.alert-error {
		background: #fef2f2;
		border: 2px solid #ef4444;
		color: #991b1b;
	}

	.alert-warning {
		background: #fffbeb;
		border: 2px solid #f59e0b;
		color: #92400e;
	}

	.alert h2 {
		margin: 0 0 1rem 0;
	}

	.alert p {
		margin: 0 0 1rem 0;
	}
</style>

