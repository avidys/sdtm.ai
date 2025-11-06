<script lang="ts">
  import type { LuciaUser } from '$lib/server/lucia';

  export let data: {
    user: LuciaUser | null;
  };
</script>

<section class="hero">
  <div class="card">
    <h2>Welcome back{#if data.user}, {data.user.email}{/if}!</h2>
    <p>
      Use the navigation above to manage your SDTM terminology workflows and keep your profile up to
      date.
    </p>
  </div>
</section>

<style>
  .hero {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
  }

  .card {
    max-width: 640px;
    padding: 2rem;
    background: white;
    border-radius: 1.5rem;
    box-shadow: 0 24px 48px -24px rgba(79, 70, 229, 0.45);
    border: 1px solid rgba(79, 70, 229, 0.1);
  }

  h2 {
    margin-top: 0;
  }
</style>
