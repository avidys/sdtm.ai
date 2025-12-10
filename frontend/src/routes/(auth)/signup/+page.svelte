<script lang="ts">
  export let form;
</script>

<div class="auth-container">
  <h1>Create your profile</h1>
  <form method="post" class="auth-form">
    <div class="oauth-buttons">
      <button type="submit" formaction="?/google" class="oauth-button oauth-google">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M17.64 9.2045C17.64 8.56636 17.5827 7.95272 17.4764 7.36363H9V10.8445H13.8436C13.635 11.97 13.0009 12.9231 12.0477 13.5613V15.8195H14.9564C16.6582 14.2527 17.64 11.9454 17.64 9.2045Z" fill="#4285F4"/>
          <path d="M9 18C11.43 18 13.467 17.1941 14.9564 15.8195L12.0477 13.5613C11.2418 14.1013 10.2109 14.4204 9 14.4204C6.65455 14.4204 4.67182 12.8372 3.96409 10.71H0.957275V13.0418C2.43818 15.9831 5.48182 18 9 18Z" fill="#34A853"/>
          <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40681 3.78409 7.83 3.96409 7.29V4.95818H0.957273C0.347727 6.17318 0 7.54772 0 9C0 10.4523 0.347727 11.8268 0.957273 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
          <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65455 3.57955 9 3.57955Z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>
      <button type="submit" formaction="?/microsoft" class="oauth-button oauth-microsoft">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path d="M0 0H8.4V8.4H0V0Z" fill="#F25022"/>
          <path d="M9.6 0H18V8.4H9.6V0Z" fill="#7FBA00"/>
          <path d="M0 9.6H8.4V18H0V9.6Z" fill="#00A4EF"/>
          <path d="M9.6 9.6H18V18H9.6V9.6Z" fill="#FFB900"/>
        </svg>
        Continue with Microsoft
      </button>
    </div>
    <div class="divider">
      <span>or</span>
    </div>
    <label>
      Email
      <input type="email" name="email" required />
    </label>
    <label>
      Password
      <input type="password" name="password" required minlength="8" />
    </label>
    <label>
      Full name
      <input type="text" name="fullName" />
    </label>
    <label>
      Organization
      <input type="text" name="organization" />
    </label>
    {#if form?.message}
      <p class="error">{form.message}</p>
    {/if}
    <button type="submit" formaction="?/email">Create account</button>
    <p class="helper">
      Already registered? <a href="/login">Sign in</a>
    </p>
  </form>
</div>

<style>
  .auth-container {
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

  .auth-form {
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

  .oauth-buttons {
    display: grid;
    gap: 0.75rem;
  }

  .oauth-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    margin: 0;
    font-size: 0.95rem;
  }

  .oauth-button:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
  }

  .oauth-button svg {
    flex-shrink: 0;
  }

  .divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 0.5rem 0;
    color: rgba(148, 163, 184, 0.8);
    font-size: 0.875rem;
  }

  .divider::before,
  .divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid var(--color-border);
  }

  .divider span {
    padding: 0 1rem;
  }

  label {
    display: grid;
    gap: 0.25rem;
    font-weight: 500;
  }

  input {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text);
  }

  button {
    margin-top: 1rem;
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

  @media (max-width: 768px) {
    .auth-container {
      min-height: auto;
      padding: 1rem;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .auth-form {
      padding: 1.5rem;
    }
  }
</style>
