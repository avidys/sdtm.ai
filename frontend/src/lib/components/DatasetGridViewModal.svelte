<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	
	let { dataset, onClose }: { 
		dataset: ParsedDataset;
		onClose: () => void;
	} = $props();
	
	const columns = Object.keys(dataset.columns);
	const displayRows = dataset.rows; // Display all rows
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>Grid Viewer: {dataset.name}</h2>
			<button class="btn-close" onclick={onClose}>&times;</button>
		</div>
		
		<div class="modal-body">
			<div class="grid-wrapper">
				<!-- Fixed Header Row -->
				<div class="grid-header-row" style="grid-template-columns: repeat({columns.length}, minmax(150px, 1fr));">
					{#each columns as col}
						<div class="grid-header-cell">
							<strong>{col}</strong>
						</div>
					{/each}
				</div>
				<!-- Scrollable Data Container -->
				<div class="grid-container">
					<div class="data-grid" style="grid-template-columns: repeat({columns.length}, minmax(150px, 1fr));">
						<!-- Data rows -->
						{#each displayRows as row}
							{#each columns as col}
								<div class="grid-data-cell">
									{row[col] ?? ''}
								</div>
							{/each}
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
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
		width: 95vw;
		height: 95vh;
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
		font-size: 1.25rem;
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
		padding: 1rem;
	}
	
	.grid-wrapper {
		display: flex;
		flex-direction: column;
		height: 100%;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		background: var(--color-bg);
		overflow: hidden;
	}
	
	.grid-header-row {
		display: grid;
		gap: 0.5rem;
		padding: 0.5rem;
		background: var(--color-bg-secondary);
		border-bottom: 2px solid var(--color-border);
		flex-shrink: 0;
		position: sticky;
		top: 0;
		z-index: 10;
	}
	
	.grid-container {
		flex: 1;
		overflow: auto;
		padding: 0.5rem;
	}
	
	.data-grid {
		display: grid;
		gap: 0.5rem;
	}
	
	.grid-header-cell {
		padding: 0.5rem;
		background: var(--color-primary);
		color: white;
		border-radius: 0.25rem;
		font-weight: 600;
		font-size: 0.875rem;
		text-align: center;
	}
	
	.grid-data-cell {
		padding: 0.25rem 0.5rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		font-size: 0.875rem;
		color: var(--color-text);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-height: 28px;
		display: flex;
		align-items: center;
	}
	
	.grid-data-cell:hover {
		white-space: normal;
		word-break: break-word;
		z-index: 5;
		position: relative;
	}
</style>

