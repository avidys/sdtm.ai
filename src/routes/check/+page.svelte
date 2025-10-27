<script lang="ts">
  import { orderedFamilies, standardsCatalogue } from '$lib/standards';
  import type { ComplianceRunSummary } from '$lib/compliance/types';

  let standardId = 'sdtmig-v4-3';
  let files: FileList | null = null;
  let loading = false;
  let error: string | null = null;
  let summary: ComplianceRunSummary | null = null;

  function handleFiles(event: Event) {
    const input = event.target as HTMLInputElement;
    files = input.files;
  }

  async function runCheck() {
    if (!files || files.length === 0) {
      error = 'Select one or more dataset files to continue.';
      return;
    }
    error = null;
    loading = true;
    summary = null;

    const formData = new FormData();
    formData.set('standardId', standardId);
    Array.from(files).forEach((file) => formData.append('datasets', file));

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      error = payload?.error ?? 'Validation failed to run. Please try again or inspect the server logs.';
      loading = false;
      return;
    }

    summary = await response.json();
    loading = false;
  }

  async function exportExcel() {
    if (!summary) return;
    const response = await fetch('/api/export', {
      method: 'POST',
      body: JSON.stringify(summary),
      headers: { 'Content-Type': 'application/json' }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'sdtm-compliance.xlsx';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function exportDefine(format: 'xml' | 'html') {
    if (!summary) return;
    const response = await fetch(`/api/define?format=${format}`, {
      method: 'POST',
      body: JSON.stringify(summary),
      headers: { 'Content-Type': 'application/json' }
    });
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = format === 'xml' ? 'define.xml' : 'define.html';
    anchor.click();
    URL.revokeObjectURL(url);
  }
</script>

<svelte:head>
  <title>Compliance Check · SDTM.ai</title>
</svelte:head>

<section class="intro">
  <h1>Run a compliance check</h1>
  <p>
    Choose the CDISC release to validate against and upload study datasets. You can select multiple
    files or an entire folder. We ingest the data into DuckDB for fast rule execution and keep the
    findings attached to your profile.
  </p>
</section>

<section class="form">
  <label for="standard">Standard</label>
  <select id="standard" bind:value={standardId}>
    {#each orderedFamilies as family}
      <optgroup label={family.title}>
        {#each standardsCatalogue[family.id] as standard}
          <option value={standard.id}>{standard.title} v{standard.version}</option>
        {/each}
      </optgroup>
    {/each}
  </select>

  <label for="datasets">Datasets</label>
  <input
    id="datasets"
    type="file"
    multiple
    on:change={handleFiles}
    webkitdirectory
    directory
    accept=".csv,.sas7bdat,.parquet"
  />

  <button class="primary" on:click|preventDefault={runCheck} disabled={loading}>
    {#if loading}
      Running checks…
    {:else}
      Validate datasets
    {/if}
  </button>
  {#if error}
    <p class="error">{error}</p>
  {/if}
</section>

{#if summary}
  <section class="results">
    <header>
      <h2>Summary</h2>
      <div class="actions">
        <button on:click={exportExcel}>Export Excel</button>
        <button on:click={() => exportDefine('xml')}>Define.xml</button>
        <button on:click={() => exportDefine('html')}>Define HTML</button>
      </div>
    </header>

    <div class="grid">
      <article>
        <h3>Datasets ({summary.datasets.length})</h3>
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Rows</th>
              <th>Columns</th>
            </tr>
          </thead>
          <tbody>
            {#each summary.datasets as dataset}
              <tr>
                <td>{dataset.domain}</td>
                <td>{dataset.rowCount}</td>
                <td>{dataset.columnCount}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </article>

      <article>
        <h3>Findings ({summary.findings.length})</h3>
        {#if summary.findings.length === 0}
          <p>No issues detected for the selected ruleset.</p>
        {:else}
          <table class="findings">
            <thead>
              <tr>
                <th>ID</th>
                <th>Severity</th>
                <th>Dataset</th>
                <th>Variable</th>
                <th>Message</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {#each summary.findings as finding}
                <tr class={finding.severity}>
                  <td>{finding.id}</td>
                  <td class="severity">{finding.severity}</td>
                  <td>{finding.dataset}</td>
                  <td>{finding.variable}</td>
                  <td>{finding.message}</td>
                  <td>{finding.reference}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </article>
    </div>
  </section>
{/if}

<style>
  .form {
    display: grid;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  select,
  input[type='file'] {
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    border: 1px solid #d1d5db;
  }

  .primary {
    justify-self: flex-start;
    background: #0f9d58;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }

  .error {
    color: #dc2626;
  }

  .results header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .actions {
    display: flex;
    gap: 0.75rem;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    border: 1px solid #e5e7eb;
    padding: 0.5rem 0.75rem;
  }

  th {
    background: #f3f4f6;
    text-align: left;
    font-size: 0.85rem;
    text-transform: uppercase;
  }

  .findings tr.error td.severity {
    color: #b91c1c;
    font-weight: 700;
  }

  .findings tr.warning td.severity {
    color: #c2410c;
    font-weight: 700;
  }

  .findings tr.info td.severity {
    color: #1d4ed8;
    font-weight: 700;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 2rem;
  }
</style>
