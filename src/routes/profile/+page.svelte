<script lang="ts">
  export let data: App.PageData;
  export let form: { success?: boolean; message?: string } | undefined;
</script>

<svelte:head>
  <title>Profile · SDTM.ai</title>
</svelte:head>

<section class="profile">
  <h1>Your profile</h1>
  <form method="post">
    <div class="field">
      <label>Email</label>
      <input type="email" value={data.session?.user.email ?? ''} disabled />
    </div>

    <div class="field">
      <label for="display_name">Display name</label>
      <input
        id="display_name"
        name="display_name"
        type="text"
        value={data.profile?.display_name ?? ''}
        placeholder="Jane Doe"
      />
    </div>

    <div class="field">
      <label for="organization">Organization</label>
      <input
        id="organization"
        name="organization"
        type="text"
        value={data.profile?.organization ?? ''}
        placeholder="Acme Pharma"
      />
    </div>

    <button type="submit">Save profile</button>
  </form>

  {#if form?.success}
    <p class="success">Profile updated successfully.</p>
  {:else if form?.message}
    <p class="error">{form.message}</p>
  {/if}
</section>

<style>
  .profile {
    max-width: 540px;
    margin: 0 auto;
    display: grid;
    gap: 1.5rem;
  }

  form {
    display: grid;
    gap: 1.25rem;
    background: white;
    padding: 1.5rem;
    border-radius: 1rem;
    box-shadow: 0 12px 45px rgba(15, 23, 42, 0.08);
  }

  .field {
    display: grid;
    gap: 0.5rem;
  }

  input {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d1d5db;
    font-size: 1rem;
  }

  button {
    background: #1c2b64;
    color: white;
    border: none;
    border-radius: 0.75rem;
    padding: 0.75rem 1rem;
    font-weight: 600;
  }

  .success {
    color: #0f9d58;
  }

  .error {
    color: #dc2626;
  }
</style>
