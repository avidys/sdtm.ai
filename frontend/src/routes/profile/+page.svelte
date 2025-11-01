<script lang="ts">
  export let data;
  export let form;
  let success = false;
  $: success = form?.success ?? false;
</script>

<div class="profile-container">
  <h1>Profile</h1>
  <form method="post" class="profile-form">
    <label>
      Email
      <input type="email" value={data.profile?.email} disabled />
    </label>
    <label>
      Full name
      <input name="fullName" type="text" value={data.profile?.fullName ?? ''} />
    </label>
    <label>
      Organization
      <input name="organization" type="text" value={data.profile?.organization ?? ''} />
    </label>
    <button type="submit">Save profile</button>
    {#if success}
      <p class="success">Profile updated</p>
    {/if}
  </form>
</div>

<style>
  .profile-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    width: 100%;
  }

  h1 {
    color: var(--color-primary);
    margin-bottom: 2rem;
    font-size: 2rem;
  }

  .profile-form {
    display: grid;
    gap: 1rem;
    max-width: 480px;
    width: 100%;
    padding: 2rem;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: 1rem;
    box-shadow: var(--shadow-md);
  }

  label {
    display: grid;
    gap: 0.5rem;
  }

  label:first-child {
    font-weight: 500;
    color: var(--color-text);
  }

  input {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-size: 1rem;
  }

  input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    background: var(--color-bg-secondary);
  }

  input:focus {
    outline: none;
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px rgba(5, 150, 105, 0.1);
  }

  button {
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    background: var(--color-primary);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  button:hover {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  .success {
    color: var(--color-success);
    font-weight: 500;
    text-align: center;
    margin-top: 0.5rem;
  }

  @media (max-width: 768px) {
    .profile-container {
      min-height: auto;
      padding: 1rem;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .profile-form {
      padding: 1.5rem;
    }
  }
</style>
