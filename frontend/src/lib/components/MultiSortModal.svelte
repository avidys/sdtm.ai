<script lang="ts">
	export interface SortRule {
		column: string;
		ascending: boolean;
	}
	
	let { 
		columns, 
		sortRules, 
		onClose, 
		onApply 
	}: { 
		columns: string[];
		sortRules: SortRule[];
		onClose: () => void;
		onApply: (rules: SortRule[]) => void;
	} = $props();

	let currentRules = $state<SortRule[]>([...sortRules]);
	let draggedColumn = $state<string | null>(null);
	let dragOverIndex = $state<number | null>(null);

	const availableColumns = $derived(
		columns.filter(col => !currentRules.some(r => r.column === col))
	);

	function handleDragStart(event: DragEvent, column: string) {
		if (event.dataTransfer) {
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', column);
			draggedColumn = column;
		}
	}

	function handleDragOver(event: DragEvent, index: number) {
		event.preventDefault();
		if (event.dataTransfer) {
			event.dataTransfer.dropEffect = 'move';
		}
		dragOverIndex = index;
	}

	function handleDragLeave() {
		dragOverIndex = null;
	}

	function handleDrop(event: DragEvent, targetIndex?: number) {
		event.preventDefault();
		dragOverIndex = null;
		
		if (!draggedColumn) return;
		
		const column = draggedColumn;
		
		// Check if column is already in sort rules
		const existingIndex = currentRules.findIndex(r => r.column === column);
		
		if (existingIndex !== -1) {
			// Column is already in sort rules, reorder it
			if (targetIndex !== undefined && targetIndex !== existingIndex) {
				const newRules = [...currentRules];
				const [moved] = newRules.splice(existingIndex, 1);
				newRules.splice(targetIndex, 0, moved);
				currentRules = newRules;
			}
		} else {
			// Add new column to sort rules
			const newRule: SortRule = { column, ascending: true };
			if (targetIndex !== undefined) {
				const newRules = [...currentRules];
				newRules.splice(targetIndex, 0, newRule);
				currentRules = newRules;
			} else {
				currentRules = [...currentRules, newRule];
			}
		}
		
		draggedColumn = null;
	}

	function handleDropInAvailable(event: DragEvent) {
		event.preventDefault();
		dragOverIndex = null;
		
		if (!draggedColumn) return;
		
		// Remove column from sort rules
		currentRules = currentRules.filter(r => r.column !== draggedColumn);
		draggedColumn = null;
	}

	function toggleDirection(index: number) {
		const newRules = [...currentRules];
		newRules[index].ascending = !newRules[index].ascending;
		currentRules = newRules;
	}

	function handleApply() {
		onApply(currentRules);
		onClose();
	}

	function handleClear() {
		currentRules = [];
	}
</script>

<div 
	class="modal-overlay" 
	onclick={onClose}
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			onClose();
		}
	}}
	role="dialog" 
	aria-labelledby="modal-title"
	aria-modal="true"
	tabindex="-1"
>
	<div 
		class="modal-content" 
		onclick={(e) => e.stopPropagation()}
		role="none"
	>
		<div class="modal-header">
			<h2 id="modal-title">Multi-Column Sort</h2>
			<button class="btn-close" onclick={onClose} aria-label="Close">&times;</button>
		</div>
		
		<div class="modal-body">
			<div class="sort-container">
				<!-- Sort Order List -->
				<div class="sort-section">
					<h3>Sort Order (drag to reorder)</h3>
					<div 
						class="sort-list"
						role="list"
						aria-label="Sort order list"
						ondragover={(e) => {
							e.preventDefault();
							if (e.dataTransfer) {
								e.dataTransfer.dropEffect = 'move';
							}
						}}
						ondrop={(e) => {
							e.preventDefault();
							if (draggedColumn && !currentRules.some(r => r.column === draggedColumn)) {
								// Dropping new column at the end
								currentRules = [...currentRules, { column: draggedColumn, ascending: true }];
								draggedColumn = null;
							}
						}}
					>
						{#if currentRules.length === 0}
							<div class="empty-placeholder">
								<p>Drag columns here to sort</p>
							</div>
						{:else}
							{#each currentRules as rule, index (rule.column)}
								<div 
									class="sort-item"
									class:drag-over={dragOverIndex === index}
									role="listitem"
									draggable="true"
									ondragstart={(e) => handleDragStart(e, rule.column)}
									ondragover={(e) => handleDragOver(e, index)}
									ondragleave={handleDragLeave}
									ondrop={(e) => handleDrop(e, index)}
								>
									<span class="sort-order">{index + 1}</span>
									<span class="column-name">{rule.column}</span>
									<button 
										class="direction-btn" 
										onclick={() => toggleDirection(index)}
										title="Toggle sort direction"
									>
										{rule.ascending ? '↑ Asc' : '↓ Desc'}
									</button>
								</div>
							{/each}
						{/if}
					</div>
				</div>

				<!-- Available Columns List -->
				<div class="available-section">
					<h3>Available Columns</h3>
					<div 
						class="available-list"
						role="list"
						aria-label="Available columns"
						ondragover={(e) => {
							e.preventDefault();
							if (e.dataTransfer) {
								e.dataTransfer.dropEffect = 'move';
							}
						}}
						ondrop={handleDropInAvailable}
					>
						{#if availableColumns.length === 0}
							<div class="empty-placeholder">
								<p>All columns are in use</p>
							</div>
						{:else}
							{#each availableColumns as col (col)}
								<div 
									class="column-item"
									role="listitem"
									draggable="true"
									ondragstart={(e) => handleDragStart(e, col)}
								>
									<span class="column-name">{col}</span>
								</div>
							{/each}
						{/if}
					</div>
				</div>
			</div>
		</div>
		
		<div class="modal-footer">
			<button class="btn btn-secondary" onclick={handleClear} disabled={currentRules.length === 0}>
				Clear All
			</button>
			<button class="btn btn-primary" onclick={handleApply}>
				Apply Sort
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
		z-index: 2000;
		backdrop-filter: blur(4px);
		padding: 1rem;
	}

	.modal-content {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 1rem;
		max-width: 700px;
		width: 100%;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
		max-height: 90vh;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid var(--color-border);
		background: var(--color-bg-secondary);
	}

	.modal-header h2 {
		margin: 0;
		color: var(--color-primary);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.75rem;
		cursor: pointer;
		color: var(--color-text-muted);
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		transition: all 0.2s;
		line-height: 1;
	}

	.btn-close:hover {
		background: var(--color-error);
		color: white;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.sort-container {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.sort-section, .available-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sort-section h3, .available-section h3 {
		margin: 0;
		font-size: 1rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.sort-list, .available-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		min-height: 200px;
		max-height: 400px;
		overflow-y: auto;
		padding: 0.75rem;
		background: var(--color-bg-secondary);
		border: 2px dashed var(--color-border);
		border-radius: 0.5rem;
	}

	.empty-placeholder {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 150px;
		color: var(--color-text-muted);
		font-style: italic;
		text-align: center;
	}

	.sort-item, .column-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		cursor: grab;
		transition: all 0.2s;
	}

	.sort-item:active, .column-item:active {
		cursor: grabbing;
	}

	.sort-item:hover, .column-item:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	}

	.sort-item.drag-over {
		border-color: var(--color-primary);
		background: var(--color-bg-secondary);
		border-style: dashed;
		transform: translateY(-2px);
	}

	.sort-item[draggable="true"]:not(.drag-over) {
		opacity: 0.8;
	}

	.sort-order {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 1.75rem;
		height: 1.75rem;
		background: var(--color-primary);
		color: white;
		border-radius: 50%;
		font-weight: 600;
		font-size: 0.875rem;
		flex-shrink: 0;
	}

	.column-name {
		flex: 1;
		font-weight: 500;
		color: var(--color-text);
		font-size: 0.9rem;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.direction-btn {
		padding: 0.35rem 0.75rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.8rem;
		transition: all 0.2s;
		flex-shrink: 0;
		white-space: nowrap;
	}

	.direction-btn:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		color: var(--color-primary);
	}

	.column-item {
		cursor: grab;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
	}

	.btn {
		padding: 0.5rem 1.5rem;
		border-radius: 0.375rem;
		font-weight: 500;
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
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.btn-secondary:hover:not(:disabled) {
		background: var(--color-surface-hover);
		border-color: var(--color-border-strong);
	}

	.btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.modal-content {
			max-width: 100vw;
			max-height: 100vh;
			border-radius: 0;
		}

		.modal-header {
			padding: 1rem;
		}

		.modal-body {
			padding: 1rem;
		}

		.modal-footer {
			padding: 1rem;
		}

		.sort-container {
			grid-template-columns: 1fr;
			gap: 1rem;
		}

		.sort-list, .available-list {
			min-height: 150px;
			max-height: 250px;
		}
	}
</style>
