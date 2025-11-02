<script lang="ts">
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
	import { getDataViewerSettings, setFixedColumnWidths, setShowColumnStats, setClickColumnForDetails, setNumberPrecision } from '$lib/stores/dataViewerSettings.svelte';
	
	const viewerSettings = getDataViewerSettings();
</script>

<svelte:head>
	<title>Settings - SDTM Compliance Portal</title>
</svelte:head>

<div class="settings-page">
	<header class="page-header">
		<h1>Settings</h1>
		<p>Manage your application preferences</p>
	</header>

	<div class="settings-content">
		<section class="settings-section">
			<h2>Appearance</h2>
			<div class="setting-item">
				<div class="setting-info">
					<h3>Theme</h3>
					<p>Choose between light, dark, or auto (follows system preference)</p>
				</div>
				<div class="setting-control">
					<ThemeSwitcher />
				</div>
			</div>
		</section>
		
		<section class="settings-section">
			<h2>Data Viewer</h2>
			<div class="setting-item">
				<div class="setting-info">
					<h3>Fixed Column Widths</h3>
					<p>Precalculate column widths based on all data to prevent width adjustments while scrolling</p>
				</div>
				<div class="setting-control">
					<label class="toggle-switch">
						<input 
							type="checkbox" 
							checked={viewerSettings.fixedColumnWidths}
							onchange={(e) => setFixedColumnWidths(e.currentTarget.checked)}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="setting-item">
				<div class="setting-info">
					<h3>Show Column Statistics</h3>
					<p>Display type, missing percentage, and unique count for each column in the header</p>
				</div>
				<div class="setting-control">
					<label class="toggle-switch">
						<input 
							type="checkbox" 
							checked={viewerSettings.showColumnStats}
							onchange={(e) => setShowColumnStats(e.currentTarget.checked)}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="setting-item">
				<div class="setting-info">
					<h3>Click Column for Details</h3>
					<p>Click column names to view detailed statistics (mean, median, quartiles, histogram for continuous; frequencies for categorical). When disabled, clicking sorts the column.</p>
				</div>
				<div class="setting-control">
					<label class="toggle-switch">
						<input 
							type="checkbox" 
							checked={viewerSettings.clickColumnForDetails}
							onchange={(e) => setClickColumnForDetails(e.currentTarget.checked)}
						/>
						<span class="toggle-slider"></span>
					</label>
				</div>
			</div>
			<div class="setting-item">
				<div class="setting-info">
					<h3>Number Precision</h3>
					<p>Number of decimal places to display for numeric values in statistics and charts (0-10)</p>
				</div>
				<div class="setting-control">
					<input 
						type="number" 
						min="0" 
						max="10" 
						value={viewerSettings.numberPrecision}
						onchange={(e) => setNumberPrecision(Number(e.currentTarget.value))}
						class="precision-input"
					/>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.settings-page {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	.page-header h1 {
		font-size: 2rem;
		font-weight: 700;
		color: var(--color-primary);
		margin-bottom: 0.5rem;
	}

	.page-header p {
		font-size: 1.125rem;
		color: var(--color-text-secondary);
	}

	.settings-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.settings-section {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		padding: 2rem;
		box-shadow: var(--shadow-md);
	}

	.settings-section h2 {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 1.5rem;
		border-bottom: 2px solid var(--color-border);
		padding-bottom: 0.75rem;
	}

	.setting-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 2rem;
		padding: 1.5rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.setting-item:last-child {
		border-bottom: none;
		padding-bottom: 0;
	}

	.setting-info {
		flex: 1;
		min-width: 0;
	}

	.setting-info h3 {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.setting-info p {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		line-height: 1.5;
	}

	.setting-control {
		flex-shrink: 0;
	}

	.toggle-switch {
		position: relative;
		display: inline-block;
		width: 50px;
		height: 26px;
	}

	.toggle-switch input {
		opacity: 0;
		width: 0;
		height: 0;
	}

	.toggle-slider {
		position: absolute;
		cursor: pointer;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: var(--color-border);
		transition: 0.3s;
		border-radius: 26px;
	}

	.toggle-slider:before {
		position: absolute;
		content: "";
		height: 20px;
		width: 20px;
		left: 3px;
		bottom: 3px;
		background-color: white;
		transition: 0.3s;
		border-radius: 50%;
	}

	input:checked + .toggle-slider {
		background-color: var(--color-primary);
	}

	input:checked + .toggle-slider:before {
		transform: translateX(24px);
	}

	.precision-input {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		width: 80px;
		text-align: center;
	}

	.precision-input:focus {
		outline: none;
		border-color: var(--color-primary);
		box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
	}

	/* Mobile Responsive */
	@media (max-width: 768px) {
		.settings-page {
			padding: 1rem;
		}

		.page-header h1 {
			font-size: 1.75rem;
		}

		.settings-section {
			padding: 1.5rem;
		}

		.setting-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.setting-control {
			width: 100%;
		}
	}
</style>

