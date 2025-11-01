<script lang="ts">
	import DataFileViewer from './DataFileViewer.svelte';
	import type { ParsedDataset } from '$lib/standards/types';
	
	let { dataset, onClose }: { 
		dataset: ParsedDataset;
		onClose: () => void;
	} = $props();
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>{dataset.name}</h2>
			<button class="btn-close" onclick={onClose}>&times;</button>
		</div>
		
		<div class="modal-body">
			<DataFileViewer preloadedDataset={dataset} hideFileUpload={true} />
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
	
	/* Mobile Responsive Styles */
	@media (max-width: 768px) {
		.modal-content {
			width: 100vw;
			height: 100vh;
			border-radius: 0;
			max-height: 100vh;
		}
		
		.modal-overlay {
			padding: 0;
		}
		
		.modal-header {
			padding: 0.75rem 1rem;
		}
		
		.modal-header h2 {
			font-size: 1rem;
			overflow: hidden;
			text-overflow: ellipsis;
			white-space: nowrap;
			flex: 1;
			min-width: 0;
		}
		
		.btn-close {
			width: 2.5rem;
			height: 2.5rem;
			min-width: 44px;
			min-height: 44px;
		}
		
		.modal-body {
			padding: 0.75rem;
		}
	}
</style>

