<script lang="ts">
  import { createSupabaseClient } from '$lib/supabaseClient';

  export let data: App.PageData;

  const supabase = createSupabaseClient();

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = '/';
  }
</script>

<nav class="navbar">
  <div class="brand">SDTM.ai Compliance Portal</div>
  <div class="links">
    <a href="/">Home</a>
    <a href="/standards">Standards</a>
    <a href="/check">Compliance Check</a>
    {#if data.session}
      <a href="/profile">Profile</a>
      <button class="signout" on:click={signOut}>Sign out</button>
    {:else}
      <a href="/auth">Sign in</a>
    {/if}
  </div>
</nav>

<main class:wide={data.session}>
  <slot />
</main>

<style>
  .navbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem 2rem;
    background: linear-gradient(90deg, #1c2b64, #0f9d58);
    color: white;
  }

  .brand {
    font-weight: 600;
    font-size: 1.25rem;
  }

  .links {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  a {
    color: white;
    text-decoration: none;
    font-weight: 500;
  }

  a:hover {
    text-decoration: underline;
  }

  .signout {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    color: white;
    padding: 0.4rem 0.8rem;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  main {
    max-width: 1100px;
    margin: 2rem auto;
    padding: 0 1.5rem;
  }

  main.wide {
    max-width: 1280px;
  }
</style>
