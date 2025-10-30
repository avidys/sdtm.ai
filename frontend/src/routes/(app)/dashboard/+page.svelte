<script lang="ts">
  import type { StoredDataset, StoredComplianceRun } from '$lib/server/database';
  export let data: { datasets: StoredDataset[]; runs: StoredComplianceRun[] };
</script>

<h1>Compliance dashboard</h1>
<section class="actions">
  <a class="primary" href="/datasets">Upload datasets</a>
</section>

<section class="datasets">
  <h2>Datasets</h2>
  {#if data.datasets.length === 0}
    <p>No datasets ingested yet.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Domain</th>
          <th>Rows</th>
          <th>Created</th>
        </tr>
      </thead>
      <tbody>
        {#each data.datasets as dataset}
          <tr>
            <td>{dataset.name}</td>
            <td>{dataset.domain}</td>
            <td>{dataset.rowCount}</td>
            <td>{new Date(dataset.createdAt).toLocaleString()}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<section class="runs">
  <h2>Compliance runs</h2>
  {#if data.runs.length === 0}
    <p>No compliance runs yet.</p>
  {:else}
    <table>
      <thead>
        <tr>
          <th>Dataset</th>
          <th>Standard</th>
          <th>Total</th>
          <th>Errors</th>
          <th>Warnings</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.runs as run}
          <tr>
            <td>{run.datasetName}</td>
            <td>{run.standardId}</td>
            <td>{run.summary.total}</td>
            <td>{run.summary.errors}</td>
            <td>{run.summary.warnings}</td>
            <td><a href={`/reviews/${run.id}`}>View findings</a></td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</section>

<style>
  .actions {
    margin-bottom: 2rem;
  }
  .primary {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    background: linear-gradient(135deg, #38bdf8, #22d3ee);
    color: #0f172a;
    font-weight: 600;
    text-decoration: none;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  th,
  td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  }
  section {
    margin-bottom: 3rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 1.5rem;
    border-radius: 1rem;
  }
</style>
