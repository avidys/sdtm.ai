<script lang="ts">
  export let form;
</script>

<h1>Sign in</h1>
<form method="post" class="auth-form">
  <label>
    Email
    <input type="email" name="email" required />
  </label>
  <label>
    Password
    <input type="password" name="password" required minlength="6" />
  </label>
  {#if form?.message}
    <p class="error">{form.message}</p>
  {/if}
  <button type="submit">Sign in</button>
  <p class="helper">
    Need an account? <a href="/signup">Create one</a>
  </p>
</form>

<style>
  .auth-form {
    display: grid;
    gap: 1rem;
    max-width: 420px;
  }
  label {
    display: grid;
    gap: 0.25rem;
    font-weight: 500;
  }
  input {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
  }
  button {
    padding: 0.75rem;
    border-radius: 0.75rem;
    border: none;
    background: linear-gradient(135deg, #38bdf8, #22d3ee);
    color: #0f172a;
    font-weight: 600;
    cursor: pointer;
  }
  .error {
    color: #fda4af;
  }
  .helper {
    font-size: 0.9rem;
    color: rgba(226, 232, 240, 0.8);
  }
</style>
