<script lang="ts">
  import { enhance } from '$app/forms';
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData | undefined;
</script>

<svelte:head>
  <title>Sign in to SDTM App</title>
</svelte:head>

<section class="auth-wrapper">
  <div class="panel">
    <h2>Access your workspace</h2>
    <p class="subtitle">
      Use an email magic link or sign in with your preferred provider.
    </p>

    {#if form?.success}
      <div class="success">
        <p>Magic link sent to <strong>{form.email}</strong>.</p>
        <p class="hint">
          Check your inbox. During development the link is displayed below for convenience.
        </p>
        <code>{form.magicLink}</code>
      </div>
    {/if}

    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}

    <form method="post" use:enhance class="email-form" action="?/magicLink">
      <input type="hidden" name="redirectTo" value={data.redirectTo} />
      <label>
        Name
        <input name="name" placeholder="Ada Lovelace" autocomplete="name" />
      </label>
      <label>
        Work email
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          autocomplete="email"
          required
          value={form?.email ?? ''}
        />
      </label>
      <button type="submit">Email me a magic link</button>
    </form>

    <div class="divider">
      <span>Or continue with</span>
    </div>

    <div class="providers">
      <a class="provider" href="/oauth/google">Google</a>
      <a class="provider" href="/oauth/microsoft">Microsoft</a>
      <a class="provider" href="/oauth/amazon">Amazon</a>
    </div>
  </div>
</section>

<style>
  :global(body) {
    margin: 0;
  }

  .auth-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
  }

  .panel {
    background: white;
    padding: 3rem;
    border-radius: 1.5rem;
    width: min(420px, 100%);
    box-shadow: 0 40px 80px -60px rgba(79, 70, 229, 0.55);
    border: 1px solid rgba(79, 70, 229, 0.08);
  }

  h2 {
    margin: 0;
    font-size: 1.75rem;
  }

  .subtitle {
    margin-bottom: 2rem;
    color: #475569;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-weight: 600;
  }

  input {
    padding: 0.75rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    font-size: 1rem;
  }

  button {
    padding: 0.85rem 1.5rem;
    border-radius: 9999px;
    border: none;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 20px 35px -24px rgba(99, 102, 241, 0.7);
  }

  .divider {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-block: 1.5rem;
    font-size: 0.875rem;
    color: #64748b;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(148, 163, 184, 0.4);
  }

  .providers {
    display: grid;
    gap: 0.75rem;
  }

  .provider {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0.8rem 1rem;
    border-radius: 0.9rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    text-decoration: none;
    font-weight: 600;
    color: #0f172a;
    background: rgba(255, 255, 255, 0.95);
    transition: transform 0.15s ease, border-color 0.15s ease;
  }

  .provider:hover {
    transform: translateY(-1px);
    border-color: rgba(79, 70, 229, 0.4);
  }

  .success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.2);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .success .hint {
    color: #0f172a;
    font-size: 0.875rem;
  }

  code {
    display: block;
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(15, 23, 42, 0.85);
    color: white;
    border-radius: 0.75rem;
    font-size: 0.8rem;
    word-break: break-all;
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 1rem;
    padding: 1rem;
    margin-bottom: 1rem;
    color: #991b1b;
    font-weight: 600;
  }
</style>
