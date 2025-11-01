<script lang="ts">
  import type { PageData } from './$types';
  import ThemeSwitcher from '$lib/components/ThemeSwitcher.svelte';
  import { getTheme } from '$lib/stores/theme.svelte';
  import '../app.css';
  
  const favicon = '/favicon.svg';
  const theme = getTheme();
  
  // Reactive logo based on theme
  let logo = $derived(
    theme.resolvedTheme === 'dark' ? '/AV-green.png' : '/AV-light.png'
  );

  let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
  <title>Avidys SDTM Compliance Portal</title>
</svelte:head>

<div class="app-shell">
  <header>
    <div class="brand">
      <img src={logo} alt="Avidys" class="logo" />
      <span class="brand-text">SDTM Compliance</span>
    </div>
    <nav>
      <a href="/">Home</a>
      {#if data.session}
        <a href="/dashboard">Dashboard</a>
        <a href="/profile">Profile</a>
      {/if}
      <a href="/viewer">Viewer</a>
      <a href="/standards">Standards</a>
    </nav>
    <div class="actions">
      <ThemeSwitcher />
      {#if data.session}
        <span class="user-email">{data.profile?.email}</span>
        <form method="post" action="/logout">
          <button type="submit" class="btn-signout">Sign out</button>
        </form>
      {:else}
        <a class="btn-primary" href="/login">Sign in</a>
      {/if}
    </div>
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <p>Deployed from {data.deploymentGitBranch} - Avidys AI</p>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: var(--color-bg);
    color: var(--color-text);
  }
  
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: var(--color-surface);
    border-bottom: 2px solid var(--color-border);
    box-shadow: var(--shadow-sm);
    position: sticky;
    top: 0;
    z-index: 100;
  }
  
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
  
  .logo {
    height: 32px;
    width: auto;
  }
  
  .brand-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--color-primary);
    letter-spacing: -0.02em;
  }
  
  nav {
    display: flex;
    gap: 1.5rem;
    flex: 1;
    justify-content: center;
  }
  
  nav a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-weight: 500;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    transition: all 0.2s;
  }
  
  nav a:hover {
    color: var(--color-primary);
    background: var(--color-surface-hover);
  }
  
  .actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .user-email {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }
  
  .btn-signout,
  .btn-primary {
    background: var(--color-primary);
    color: white;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.875rem;
    transition: all 0.2s;
    text-decoration: none;
    display: inline-block;
  }
  
  .btn-signout:hover,
  .btn-primary:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  main {
    padding: 2rem;
    width: min(1400px, 100%);
    margin: 0 auto;
  }
  
  footer {
    padding: 0.75rem 2rem;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
    text-align: center;
  }
  
  @media (max-width: 768px) {
    header {
      flex-wrap: wrap;
      gap: 1rem;
    }
    
    nav {
      order: 3;
      width: 100%;
      justify-content: flex-start;
      gap: 0.5rem;
    }
    
    .user-email {
      display: none;
    }
  }
</style>
