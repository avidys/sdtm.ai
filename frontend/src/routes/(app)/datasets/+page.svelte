<script lang="ts">
  import type { StoredDataset, StoredComplianceRun } from '$lib/server/database';
  import type { StandardSummary } from '$lib/standards/types';
  export let data: {
    datasets: StoredDataset[];
    runs: StoredComplianceRun[];
    standards: StandardSummary[];
    pythonData?: unknown;
  };
  export let form: { success?: boolean; message?: string; ingested?: { datasetId: string; runId: string }[] } | undefined;
</script>

<h1>Ingest datasets</h1>
<form method="post" enctype="multipart/form-data" class="upload-form">
  <label>
    Choose standard
    <select name="standard" required>
      <option value="" disabled selected>Select a standard</option>
      {#each data.standards as standard}
        <option value={standard.id}>{standard.name} v{standard.version}</option>
      {/each}
    </select>
  </label>
  <label>
    Upload files or folders *
    <input type="file" name="files" multiple accept=".csv,.txt,.parquet,.pq,.sas7bdat,.xpt" required />
    <small>Supports CSV, XPT, SAS (.sas7bdat), and Parquet files. You may select an entire folder.</small>
  </label>
  <button type="submit">Process</button>
  {#if form?.message}
    <p class:success={form?.success} class:error={!form?.success}>{form.message}</p>
  {/if}
</form>

{#if form?.ingested?.length}
  <section class="results">
    <h2>Latest ingestion</h2>
    <ul>
      {#each form.ingested as item}
        <li>
          Dataset {item.datasetId} → <a href={`/reviews/${item.runId}`}>View findings</a>
        </li>
      {/each}
    </ul>
  </section>
{/if}

{#if data.pythonData}
  <section class="python-data">
    <h2>Python Data</h2>
    <pre>{JSON.stringify(data.pythonData, null, 2)}</pre>
  </section>
{/if}

<!-- <section class="history">
  <h2>Previous runs</h2>
  {#if data.runs.length === 0}
    <p>No runs yet.</p>
  {:else}
    <ul>
      {#each data.runs as run}
        <li>
          {run.datasetName} – {run.standardId}: {run.summary.errors} errors, {run.summary.warnings} warnings
          (<a href={`/reviews/${run.id}`}>details</a>)
        </li>
      {/each}
    </ul>
  {/if}
</section> -->

<style>
  .upload-form {
    display: grid;
    gap: 1.25rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid rgba(148, 163, 184, 0.25);
  }
  label {
    display: grid;
    gap: 0.5rem;
    font-weight: 500;
  }
  select,
  input[type='file'] {
    padding: 0.75rem;
    border-radius: 0.5rem;
    border: 1px solid rgba(148, 163, 184, 0.3);
    background: rgba(15, 23, 42, 0.6);
    color: #f8fafc;
  }
  button {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #38bdf8, #22d3ee);
    color: #0f172a;
    font-weight: 600;
  }
  small {
    font-size: 0.85rem;
    color: rgba(226, 232, 240, 0.7);
  }
  .results,
  .history {
    margin-top: 2rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 1.5rem;
    border-radius: 1rem;
  }
  .success {
    color: #bbf7d0;
  }
  .error {
    color: #fda4af;
  }
</style>
