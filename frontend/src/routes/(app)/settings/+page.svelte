<script lang="ts">
	import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
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

