<script lang="ts">
	import { getTheme, toggleTheme } from '$lib/stores/theme.svelte';
	
	const theme = getTheme();
	
	const icons = {
		light: '☀️',
		dark: '🌙',
		auto: '🔄'
	};
</script>

<button 
	class="theme-switcher"
	onclick={toggleTheme}
	title={`Theme: ${theme.current} (${theme.resolvedTheme})`}
>
	<span class="icon">{icons[theme.current]}</span>
	<span class="label">{theme.current}</span>
</button>

<style>
	.theme-switcher {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 9999px;
		color: var(--color-text);
		cursor: pointer;
		font-size: 0.875rem;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.theme-switcher:hover {
		background: var(--color-surface-hover);
		border-color: var(--color-primary);
		transform: translateY(-1px);
	}
	
	.icon {
		font-size: 1.25rem;
		line-height: 1;
	}
	
	.label {
		text-transform: capitalize;
	}
	
	@media (max-width: 640px) {
		.label {
			display: none;
		}
	}
</style>

