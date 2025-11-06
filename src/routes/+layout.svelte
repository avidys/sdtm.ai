<script lang="ts">
  import type { LuciaUser } from '$lib/server/lucia';

  export let data: {
    user: LuciaUser | null;
  };
</script>

<svelte:head>
  <title>SDTM App</title>
</svelte:head>

<div class="app-shell">
  <header class="app-header">
    <h1>SDTM App</h1>
    {#if data.user}
      <nav>
        <a href="/">Home</a>
        <a href="/profile">Profile</a>
        <form method="post" action="/logout" class="logout-form">
          <button type="submit">Sign out</button>
        </form>
      </nav>
    {:else}
      <nav>
        <a href="/(auth)/login">Log in</a>
      </nav>
    {/if}
  </header>
  <main>
    <slot />
  </main>
</div>

<style>
  .app-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: radial-gradient(circle at top, rgba(79, 70, 229, 0.1), transparent),
      #f9fafb;
    color: #0f172a;
  }

  .app-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(15, 23, 42, 0.08);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .app-header h1 {
    font-size: 1.25rem;
    margin: 0;
  }

  nav {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  nav a {
    text-decoration: none;
    color: #4338ca;
    font-weight: 600;
  }

  nav a:hover {
    text-decoration: underline;
  }

  .logout-form {
    margin: 0;
  }

  .logout-form button {
    border: none;
    border-radius: 9999px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    padding: 0.5rem 1rem;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .logout-form button:hover {
    transform: translateY(-1px);
    box-shadow: 0 10px 20px -10px rgba(99, 102, 241, 0.6);
  }

  main {
    flex: 1;
    padding: 2rem;
    display: flex;
    justify-content: center;
  }
</style>
