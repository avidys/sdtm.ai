<svelte:head>
  <title>SDTM.ai — SDTM Compliance Portal</title>
</svelte:head>

<section class="hero">
  <div>
    <h1>Validate SDTM and SDTMIG deliverables with ease</h1>
    <p>
      Upload clinical study datasets, select the CDISC implementation guide you need to comply
      with, and receive detailed findings complete with citations and remediation guidance.
    </p>
    <a class="cta" href="/check">Start a compliance run</a>
  </div>
  <div class="card">
    <h2>Key capabilities</h2>
    <ul>
      <li>Supabase-backed authentication with social or email magic links</li>
      <li>Standards catalogue mirroring CDISC release families</li>
      <li>Automated DuckDB staging for CSV, SAS and Parquet assets</li>
      <li>Rule engine seeded with SDTMIG 4.3 and extensible mappings</li>
      <li>Export findings to Excel or explore them in the browser</li>
      <li>Generate Define-XML 2.0 packages and companion HTML views</li>
    </ul>
  </div>
</section>

<section>
  <h2>Deploy anywhere</h2>
  <p>
    The app ships with SvelteKit adapter-auto, so it is ready for Vercel, Cloudflare Pages or any
    platform that supports JavaScript edge runtimes. Configuration values such as Supabase keys are
    handled through environment variables.
  </p>
</section>

<section>
  <h2>How it works</h2>
  <ol>
    <li>Create an account or sign in using your enterprise identity provider.</li>
    <li>Pick one or more CDISC releases to validate against.</li>
    <li>Upload files or connect to a study folder. We support CSV, SAS7BDAT and Parquet.</li>
    <li>Inspect findings, export spreadsheets, and generate Define-XML/HTML artifacts.</li>
  </ol>
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    align-items: stretch;
    margin-bottom: 3rem;
  }

  h1 {
    font-size: clamp(2rem, 4vw, 3rem);
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.05rem;
    line-height: 1.6;
  }

  .card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 20px 55px rgba(17, 24, 39, 0.08);
  }

  .card ul {
    margin-top: 1rem;
    padding-left: 1.25rem;
    line-height: 1.6;
  }

  .cta {
    display: inline-block;
    margin-top: 1.5rem;
    padding: 0.75rem 1.5rem;
    background: #0f9d58;
    color: white;
    border-radius: 999px;
    font-weight: 600;
    text-decoration: none;
  }

  section + section {
    margin-top: 3rem;
  }
</style>
