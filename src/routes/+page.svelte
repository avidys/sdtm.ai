<script lang="ts">
  export let data;
</script>

<section class="hero">
  <div class="content">
    <h1>End-to-end SDTM compliance checking</h1>
    <p>
      Upload SAS, CSV, or Parquet datasets, map them to CDISC standards, and
      generate traceable findings with exportable reports and Define-XML outputs.
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
    <h2>Standards aware</h2>
    <p>Choose from SDTM, SDTMIG, Define-XML, and Controlled Terminology packages organised by version.</p>
  </article>
  <article>
    <h2>DuckDB powered</h2>
    <p>Ingest large collections of files into an optimised DuckDB store, with optional support for Supabase/Postgres.</p>
  </article>
  <article>
    <h2>Actionable findings</h2>
    <p>Each issue links back to the originating standard text or codelist for faster resolution and traceability.</p>
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
  }
  p {
    font-size: 1.125rem;
    line-height: 1.6;
    color: rgba(226, 232, 240, 0.8);
  }
  .primary {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.75rem 1.5rem;
    border-radius: 9999px;
    background: linear-gradient(135deg, #38bdf8, #22d3ee);
    color: #0f172a;
    font-weight: 600;
    text-decoration: none;
  }
  .features {
    margin-top: 4rem;
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  }
  article {
    background: rgba(15, 23, 42, 0.6);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }
  article h2 {
    margin-bottom: 0.5rem;
  }
</style>
