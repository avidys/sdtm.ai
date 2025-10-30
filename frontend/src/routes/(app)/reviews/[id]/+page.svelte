<script lang="ts">
  import type { StoredComplianceRun, StoredDataset } from '$lib/server/database';
  import type { StandardDefinition } from '$lib/standards/types';
  export let data: { run: StoredComplianceRun; dataset?: StoredDataset; standard: StandardDefinition };
</script>

<h1>Compliance findings for {data.run.datasetName}</h1>
<p>
  Validated against <strong>{data.standard.name}</strong> v{data.standard.version}.<br />
  {data.run.summary.errors} errors, {data.run.summary.warnings} warnings.
</p>

<div class="actions">
  <a href={`/api/export/${data.run.id}/excel`} rel="nofollow">Download Excel</a>
  <a href={`/api/export/${data.run.id}/define-xml`} rel="nofollow">Download Define-XML</a>
</div>

<section class="findings">
  <table>
    <thead>
      <tr>
        <th>Severity</th>
        <th>Domain</th>
        <th>Variable</th>
        <th>Message</th>
        <th>Reference</th>
      </tr>
    </thead>
    <tbody>
      {#if data.run.findings.length === 0}
        <tr><td colspan="5">No findings 🎉</td></tr>
      {:else}
        {#each data.run.findings as finding}
          <tr class={finding.severity}>
            <td>{finding.severity}</td>
            <td>{finding.domain}</td>
            <td>{finding.variable}</td>
            <td>{finding.message}</td>
            <td>{finding.ruleReference}</td>
          </tr>
        {/each}
      {/if}
    </tbody>
  </table>
</section>

{#if data.dataset}
  <section class="dataset">
    <h2>Dataset metadata</h2>
    <p><strong>Name:</strong> {data.dataset.name}</p>
    <p><strong>Domain:</strong> {data.dataset.domain}</p>
    <p><strong>Rows:</strong> {data.dataset.rowCount}</p>
    <h3>Variables</h3>
    <ul>
      {#each Object.entries(data.dataset.columns) as [column, type]}
        <li>{column} – {type}</li>
      {/each}
    </ul>
  </section>
{/if}

<style>
  .actions {
    display: flex;
    gap: 1rem;
    margin: 1.5rem 0;
  }
  .actions a {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: rgba(56, 189, 248, 0.2);
    color: #38bdf8;
    text-decoration: none;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th,
  td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.2);
    text-align: left;
  }
  tr.error {
    background-color: rgba(248, 113, 113, 0.15);
  }
  tr.warning {
    background-color: rgba(253, 224, 71, 0.15);
  }
  .dataset {
    margin-top: 2rem;
    background: rgba(15, 23, 42, 0.6);
    padding: 1.5rem;
    border-radius: 1rem;
  }
</style>
