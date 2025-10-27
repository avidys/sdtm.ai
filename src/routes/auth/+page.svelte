<script lang="ts">
  import { createSupabaseClient } from '$lib/supabaseClient';

  const supabase = createSupabaseClient();

  let email = '';
  let loading = false;
  let message = '';

  async function signInWithEmail() {
    loading = true;
    message = '';
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
      message = error.message;
    } else {
      message = 'Check your inbox for the magic link to sign in!';
    }
    loading = false;
  }

  async function signInWithProvider(provider: 'google' | 'azure' | 'amazon') {
    loading = true;
    message = '';
    const { error } = await supabase.auth.signInWithOAuth({ provider });
    if (error) {
      message = error.message;
    }
    loading = false;
  }
</script>

<svelte:head>
  <title>Sign in · SDTM.ai</title>
</svelte:head>

<section class="auth">
  <h1>Sign in or create an account</h1>
  <p>Use your work email or an identity provider to access compliance tooling.</p>

  <form on:submit|preventDefault={signInWithEmail}>
    <label for="email">Email</label>
    <input id="email" type="email" bind:value={email} required placeholder="you@example.com" />
    <button type="submit" disabled={loading}>Send magic link</button>
  </form>

  <div class="divider">
    <span>or continue with</span>
  </div>

  <div class="providers">
    <button on:click={() => signInWithProvider('google')} disabled={loading}>Google</button>
    <button on:click={() => signInWithProvider('azure')} disabled={loading}>Microsoft</button>
    <button on:click={() => signInWithProvider('amazon')} disabled={loading}>Amazon</button>
  </div>

  {#if message}
    <p class="message">{message}</p>
  {/if}
</section>

<style>
  .auth {
    max-width: 420px;
    margin: 0 auto;
    display: grid;
    gap: 1.5rem;
  }

  form {
    display: grid;
    gap: 0.75rem;
  }

  input {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d1d5db;
    font-size: 1rem;
  }

  button {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: none;
    background: #1c2b64;
    color: white;
    cursor: pointer;
    font-weight: 600;
  }

  button[disabled] {
    opacity: 0.7;
    cursor: progress;
  }

  .providers {
    display: grid;
    gap: 0.5rem;
  }

  .providers button {
    background: #0f9d58;
  }

  .divider {
    text-align: center;
    color: #6b7280;
  }

  .message {
    color: #1c2b64;
  }
</style>
