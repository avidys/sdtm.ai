<script lang="ts">
  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData | undefined;

  let profile = { ...data.profile };

  $: if (form?.profile) {
    profile = { ...form.profile };
  }
</script>

<svelte:head>
  <title>Your profile</title>
</svelte:head>

<section class="profile">
  <div class="card">
    <h2>Profile</h2>
    <p class="description">Keep your personal details and preferences up to date.</p>

    {#if form?.error}
      <div class="error">{form.error}</div>
    {/if}

    {#if form?.success}
      <div class="success">Profile saved!</div>
    {/if}

    <form method="post" action="?/update">
      <label>
        Email address
        <input value={profile.email} readonly disabled />
      </label>
      <label>
        Full name
        <input name="name" bind:value={profile.name} required placeholder="Ada Lovelace" />
      </label>
      <label>
        Preferences
        <textarea
          name="preferences"
          bind:value={profile.preferences}
          rows="6"
          placeholder="Share any preferences you'd like us to remember."
        />
      </label>
      <button type="submit">Save changes</button>
    </form>
  </div>
</section>

<style>
  .profile {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .card {
    width: min(640px, 100%);
    background: white;
    padding: 2.5rem;
    border-radius: 1.5rem;
    box-shadow: 0 24px 48px -30px rgba(79, 70, 229, 0.55);
    border: 1px solid rgba(79, 70, 229, 0.12);
  }

  h2 {
    margin: 0;
    font-size: 1.75rem;
  }

  .description {
    margin-top: 0.5rem;
    margin-bottom: 2rem;
    color: #475569;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    font-weight: 600;
  }

  input,
  textarea {
    border-radius: 1rem;
    border: 1px solid rgba(15, 23, 42, 0.08);
    padding: 0.85rem 1rem;
    font-size: 1rem;
    font-family: inherit;
  }

  textarea {
    resize: vertical;
  }

  input[readonly] {
    background: rgba(241, 245, 249, 0.65);
    cursor: not-allowed;
  }

  button {
    align-self: flex-start;
    border: none;
    border-radius: 9999px;
    padding: 0.85rem 1.75rem;
    font-weight: 600;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 16px 40px -26px rgba(99, 102, 241, 0.75);
  }

  .error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.25);
    border-radius: 1rem;
    padding: 1rem;
    color: #991b1b;
    font-weight: 600;
  }

  .success {
    background: rgba(16, 185, 129, 0.12);
    border: 1px solid rgba(16, 185, 129, 0.25);
    border-radius: 1rem;
    padding: 1rem;
    color: #047857;
    font-weight: 600;
  }
</style>
