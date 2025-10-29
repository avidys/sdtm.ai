<script lang="ts">
  import type { PageData } from './$types';
  const favicon = '/favicon.svg';

  export let data: PageData;
//  let { data, children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
  <title>SDTM.ai Compliance Portal</title>
</svelte:head>

<p>This staging environment was deployed from {data.deploymentGitBranch}.</p>
<!-- {@render children?.()} -->


<div class="app-shell">
  <header>
    <div class="brand">SDTM.ai</div>
    <nav>
      <a href="/">Home</a>
      {#if data.session}
        <a href="/profile">Profile</a>
        <a href="/dashboard">Dashboard</a>
      {/if}
      <a href="/standards">Standards</a>
    </nav>
    <div class="session">
      {#if data.session}
        <span>{data.profile?.email}</span>
        <form method="post" action="/logout">
          <button type="submit">Sign out</button>
        </form>
      {:else}
        <a class="cta" href="/login">Sign in</a>
      {/if}
    </div>
  </header>
  <main>
    <slot />
  </main>
  <footer>
    <p>Built for validating SDTM SDTMIG compliance.</p>
  </footer>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    background: linear-gradient(180deg, #0f172a 0%, #1e293b 35%, #111827 100%);
    color: #f8fafc;
  }
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background-color: rgba(15, 23, 42, 0.9);
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
  .brand {
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: 0.08em;
  }
  nav {
    display: flex;
    gap: 1rem;
  }
  nav a {
    color: #e2e8f0;
    text-decoration: none;
    font-weight: 500;
  }
  nav a:hover {
    color: #38bdf8;
  }
  .session {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  .session form button,
  .cta {
    background: #38bdf8;
    color: #0f172a;
    border: none;
    border-radius: 9999px;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: 600;
  }
  main {
    padding: 2rem;
    width: min(1200px, 100%);
    margin: 0 auto;
  }
  footer {
    padding: 1rem 2rem;
    font-size: 0.875rem;
    color: rgba(226, 232, 240, 0.7);
  }
</style>
