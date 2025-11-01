<script lang="ts">
	let { 
		onUpload,
		uploading = $bindable(false),
		uploadError = $bindable(null as string | null),
		showUpload = $bindable(true),
		onShowFeatures,
		hideParser = false,
		selectedParser = $bindable('pandas' as 'pandas' | 'r'),
		multiple = true
	}: {
		onUpload: (files: File[], parser: 'pandas' | 'r') => Promise<void>;
		uploading?: boolean;
		uploadError?: string | null;
		showUpload?: boolean;
		onShowFeatures?: () => void;
		hideParser?: boolean;
		selectedParser?: 'pandas' | 'r';
		multiple?: boolean;
	} = $props();
	let dragOver = $state(false);
	let selectedFiles = $state<File[]>([]);
	
	// Supported file formats based on pandas and R capabilities
	const SUPPORTED_FORMATS = {
		csv: ['pandas', 'r'],
		txt: ['pandas', 'r'],
		xlsx: ['pandas'],
		xls: ['pandas'],
		xpt: ['pandas', 'r'],
		sas7bdat: ['pandas', 'r'],
		parquet: ['pandas'],
		pq: ['pandas'],
		json: ['pandas'],
		jsonl: ['pandas'],
		tsv: ['pandas', 'r']
	};
	
	// Generate accept string for input
	const acceptString = Object.keys(SUPPORTED_FORMATS)
		.map(ext => `.${ext}`)
		.join(',');
	
	// Check if parser supports the file format
	function parserSupportsFormat(extension: string, parser: 'pandas' | 'r'): boolean {
		const ext = extension.toLowerCase().replace(/^\./, '');
		return SUPPORTED_FORMATS[ext as keyof typeof SUPPORTED_FORMATS]?.includes(parser) ?? false;
	}
	
	// Handle file selection
	async function handleFileInput(event: Event) {
		const input = event.target as HTMLInputElement;
		const files = input.files;
		if (!files || files.length === 0) return;
		
		const fileArray = Array.from(files);
		// If multiple is false, only take the first file
		const filesToProcess = multiple ? fileArray : [fileArray[0]];
		selectedFiles = filesToProcess;
		await processFiles(filesToProcess);
		// Reset input to allow selecting the same file again
		input.value = '';
	}
	
	// Process files
	async function processFiles(files: File[]) {
		uploading = true;
		uploadError = null;
		
		// Validate all files are supported by selected parser
		const unsupported: string[] = [];
		for (const file of files) {
			const ext = file.name.split('.').pop()?.toLowerCase() || '';
			if (!parserSupportsFormat(ext, selectedParser)) {
				unsupported.push(`${file.name} (.${ext})`);
			}
		}
		
		if (unsupported.length > 0) {
			uploadError = `The following files are not supported by ${selectedParser.toUpperCase()} parser: ${unsupported.join(', ')}`;
			uploading = false;
			selectedFiles = []; // Clear on error
			return;
		}
		
		try {
			await onUpload(files, selectedParser);
		} catch (err) {
			uploadError = err instanceof Error ? err.message : String(err);
			selectedFiles = []; // Clear on error
		} finally {
			uploading = false;
		}
	}
	
	// Clear selected files when a new selection starts
	function clearSelectedFiles() {
		selectedFiles = [];
	}
	
	// Handle drag and drop
	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		dragOver = true;
	}
	
	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
	}
	
	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		dragOver = false;
		
		const files = Array.from(event.dataTransfer?.files || []);
		if (files.length > 0) {
			// If multiple is false, only take the first file
			const filesToProcess = multiple ? files : [files[0]];
			selectedFiles = filesToProcess;
			await processFiles(filesToProcess);
		}
	}
	
	// Get format hint text
	const formatHint = $derived.by(() => {
		const formats = Object.keys(SUPPORTED_FORMATS)
			.filter(ext => parserSupportsFormat(ext, selectedParser))
			.map(ext => ext.toUpperCase())
			.join(', ');
		return `Supports: ${formats}`;
	});
</script>

{#if showUpload}
	<div class="file-upload-container" class:has-files={selectedFiles.length > 0}>
		<div class="upload-controls-row">
			{#if !hideParser}
				<div class="parser-selector">
					<label for="parser-select">
						<span>Parser:</span>
						<select 
							id="parser-select"
							bind:value={selectedParser}
							disabled={uploading}
						>
							<option value="pandas">Pandas</option>
							<option value="r">R (haven)</option>
						</select>
					</label>
				</div>
			{/if}
			
			<div class="file-upload-wrapper">
				<label 
					class="file-upload-label"
					class:drag-over={dragOver}
					class:compact={selectedFiles.length > 0}
					ondragover={handleDragOver}
					ondragleave={handleDragLeave}
					ondrop={handleDrop}
				>
					<input
						type="file"
						multiple={multiple}
						accept={acceptString}
						onchange={handleFileInput}
						onclick={(e) => {
							// Allow selecting the same file again by clearing value on click
							if (selectedFiles.length > 0) {
								(e.target as HTMLInputElement).value = '';
								clearSelectedFiles();
							}
						}}
						disabled={uploading}
					/>
					<div class="upload-prompt">
						{#if selectedFiles.length > 0}
							<span class="upload-icon">📄</span>
							<span class="upload-text">
								{selectedFiles.map(f => f.name).join(', ')}
							</span>
							<span class="upload-hint">Click to select another file</span>
						{:else}
							<span class="upload-icon">📁</span>
							<span class="upload-text">
								{uploading 
									? (multiple ? 'Parsing files...' : 'Parsing file...')
									: (multiple ? 'Click to upload files or drag and drop' : 'Click to upload a file or drag and drop')}
							</span>
							<span class="upload-hint">{formatHint}</span>
						{/if}
					</div>
				</label>
				{#if onShowFeatures}
					<button 
						class="features-btn"
						onclick={onShowFeatures}
						type="button"
						title="View features"
					>
						?
					</button>
				{/if}
			</div>
		</div>
		
		{#if uploadError}
			<div class="alert alert-error">{uploadError}</div>
		{/if}
	</div>
{/if}

<style>
	.file-upload-container {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-width: 100%;
	}
	
	.file-upload-container.has-files {
		gap: 0.75rem;
	}
	
	.upload-controls-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 1rem;
	}
	
	.parser-selector {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 0.75rem;
		background: transparent;
		border: none;
		border-radius: 0.5rem;
		flex-shrink: 0;
	}
	
	.parser-selector label {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 500;
		color: var(--color-text);
		font-size: 0.9rem;
	}
	
	.features-btn {
		width: 1.75rem;
		height: 1.75rem;
		border-radius: 50%;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
		flex-shrink: 0;
		padding: 0;
	}
	
	.features-btn:hover {
		background: var(--color-primary);
		color: white;
		border-color: var(--color-primary);
	}
	
	.parser-selector select {
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: var(--color-surface);
		color: var(--color-text);
		font-size: 0.875rem;
		cursor: pointer;
	}
	
	.parser-selector select:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	
	.file-upload-wrapper {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex: 1;
		min-width: 0;
	}
	
	.file-upload-label {
		position: relative;
		display: block;
		cursor: pointer;
		flex: 1;
		min-width: 0;
		width: 100%;
	}
	
	.file-upload-label.drag-over {
		border-color: var(--color-primary);
		background: var(--color-bg-tertiary);
	}
	
	.file-upload-label input[type="file"] {
		position: absolute;
		opacity: 0;
		width: 0;
		height: 0;
	}
	
	.upload-prompt {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 2rem;
		border: 2px dashed var(--color-border);
		border-radius: 0.75rem;
		background: var(--color-bg-secondary);
		transition: all 0.2s;
		max-width: 100%;
	}
	
	.file-upload-label.compact .upload-prompt {
		flex-direction: row;
		justify-content: flex-start;
		padding: 0.75rem 1rem;
		gap: 0.75rem;
		border-style: solid;
		border-width: 1px;
	}
	
	.file-upload-label:hover .upload-prompt {
		border-color: var(--color-primary);
		background: var(--color-bg-tertiary);
	}
	
	.upload-icon {
		font-size: 3rem;
		flex-shrink: 0;
	}
	
	.file-upload-label.compact .upload-icon {
		font-size: 1.5rem;
	}
	
	.upload-text {
		font-size: 1.125rem;
		font-weight: 500;
		color: var(--color-text);
		text-align: center;
		word-break: break-word;
	}
	
	.file-upload-label.compact .upload-text {
		font-size: 0.9rem;
		text-align: left;
		flex: 1;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.upload-hint {
		font-size: 0.875rem;
		color: var(--color-text-muted);
		text-align: center;
	}
	
	.file-upload-label.compact .upload-hint {
		font-size: 0.75rem;
		text-align: left;
	}
	
	.alert {
		padding: 1rem;
		border-radius: 0.5rem;
		margin-top: 0.5rem;
	}
	
	.alert-error {
		background: var(--color-error);
		color: white;
		border: 1px solid var(--color-error);
	}
</style>

