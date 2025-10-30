<script lang="ts">
  export let data;
  export let form;
  let success = false;
  $: success = form?.success ?? false;
</script>

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

<style>
  .profile-form {
    display: grid;
    gap: 1rem;
    max-width: 480px;
  }
  label {
    display: grid;
    gap: 0.25rem;
  }
  input {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(148, 163, 184, 0.4);
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
  }
  button {
    padding: 0.75rem;
    border: none;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #38bdf8, #22d3ee);
    color: #0f172a;
    font-weight: 600;
  }
  .success {
    color: #bbf7d0;
  }
</style>
