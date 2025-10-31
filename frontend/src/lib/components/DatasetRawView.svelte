<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	
	let { dataset, onClose }: { 
		dataset: ParsedDataset;
		onClose: () => void;
	} = $props();
	
	// Format JSON with pretty print
	let jsonString = $derived(JSON.stringify(dataset, null, 2));
	
	function copyToClipboard() {
		navigator.clipboard.writeText(jsonString);
		alert('Copied to clipboard!');
	}
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>Raw Dataset: {dataset.name}</h2>
			<button class="btn-close" onclick={onClose}>&times;</button>
		</div>
		
		<div class="modal-body">
			<div class="json-viewer">
				<pre><code>{jsonString}</code></pre>
			</div>
		</div>
		
		<div class="modal-footer">
			<button class="btn-secondary" onclick={copyToClipboard}>
				Copy to Clipboard
			</button>
			<button class="btn-primary" onclick={onClose}>
				Close
			</button>
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
	}
	
	.modal-content {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 1rem;
		max-width: 90vw;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid var(--color-border);
	}
	
	.modal-header h2 {
		margin: 0;
		color: var(--color-primary);
		font-size: 1.5rem;
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
		padding: 1.5rem;
	}
	
	.json-viewer {
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1rem;
		overflow: auto;
		max-height: 60vh;
	}
	
	.json-viewer pre {
		margin: 0;
		font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
		font-size: 0.875rem;
		line-height: 1.5;
		color: var(--color-text);
	}
	
	.json-viewer code {
		color: var(--color-text);
	}
	
	.modal-footer {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		padding: 1.5rem;
		border-top: 2px solid var(--color-border);
	}
	
	.btn-primary, .btn-secondary {
		padding: 0.5rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
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
</style>

