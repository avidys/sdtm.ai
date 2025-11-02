<script lang="ts">
  export let data;
</script>

<section class="hero">
  <div class="content">
    <h1>CDISC Dataset Checker</h1>
    <p>
      Upload SAS, CSV, or Excel datasets, browse them, check them against CDISC standards, and
      generate traceable findings with exportable reports and Define-XML outputs (soon).
    </p>
    {#if data.session}
      <a class="primary" href="/dashboard">Open dashboard</a>
    {:else}
      <a class="primary" href="/signup">Create an account</a>
    {/if}
  </div>
</section>

<section class="features">
  <article>
    <h2>Dataset Explorer</h2>
    <p>Developed using native web technology, allows you to explore your datasets with a focus on performance and usability.</p>
  </article>
  <article>
    <h2>Implementation</h2>
    <p>Can be used in the cloud or integrated into your existing infrastructure inside your premises.</p>
  </article>
<article>
    <h2>Standards Aware</h2>
    <p>Choose from SDTM, SDTMIG, ADaM, Define-XML, and Controlled Terminology packages organised by version.</p>
  </article>
  <article>
    <h2>Database Powered</h2>
    <p>Ingest large collections of files into an optimised database with support for Postgres or DuckDB.</p>
  </article>

  </section>

<style>
  .hero {
    padding: 5rem 0;
    text-align: center;
  }
  .content {
    max-width: 720px;
    margin: 0 auto;
  }
  h1 {
    font-size: clamp(2.5rem, 5vw, 3.5rem);
    margin-bottom: 1rem;
    color: var(--color-text);
  }
  p {
    font-size: 1.125rem;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }
  .primary {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    background: var(--color-primary);
    color: #ffffff;
    font-weight: 600;
    text-decoration: none;
    transition: background-color 0.2s ease;
  }
  .primary:hover {
    background: var(--color-primary-hover);
    color: #ffffff;
  }
  .features {
    margin-top: 4rem;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  article {
    background: var(--color-surface);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
  }
  article h2 {
    margin-bottom: 0.5rem;
    color: var(--color-text);
  }
  article p {
    color: var(--color-text-secondary);
  }
</style>
