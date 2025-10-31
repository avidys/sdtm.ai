<script lang="ts">
  // Client-side dataset viewer with virtualization, sorting, selection, and column stats
  type Row = Record<string, unknown>;
  type Column = { key: string; label: string };

  let rows: Row[] = [];
  let columns: Column[] = [];
  let selected = new Set<number>();
  let sortKey: string | null = null;
  let sortAsc = true;

  // Virtualization settings
  let rowHeight = 32; // px
  let viewportHeight = 400; // px
  let scrollTop = 0;

  $: totalRows = rows.length;
  $: startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - 10);
  $: visibleCount = Math.ceil(viewportHeight / rowHeight) + 20;
  $: endIndex = Math.min(totalRows, startIndex + visibleCount);
  $: visibleRows = rows.slice(startIndex, endIndex);

  function inferColumns(data: Row[]): Column[] {
    const first = data[0] ?? {};
    return Object.keys(first).map((k) => ({ key: k, label: k }));
  }

  function computeColumnStats(data: Row[]): Record<string, { type: string; missing: number; percentMissing: number }>
  {
    const stats: Record<string, { type: string; missing: number; percentMissing: number }> = {};
    if (data.length === 0) return stats;
    const keys = Object.keys(data[0]);
    for (const key of keys) {
      let missing = 0;
      let sampleType: string = 'unknown';
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] as Row)[key];
        if (v === null || v === undefined || v === '') missing++;
        if (sampleType === 'unknown' && v !== null && v !== undefined) {
          sampleType = Array.isArray(v) ? 'array' : typeof v;
        }
      }
      stats[key] = {
        type: sampleType,
        missing,
        percentMissing: data.length ? Math.round((missing / data.length) * 1000) / 10 : 0
      };
    }
    return stats;
  }

  $: columnStats = computeColumnStats(rows);

  function toggleSelect(idx: number) {
    if (selected.has(idx)) selected.delete(idx);
    else selected.add(idx);
    selected = new Set(selected);
  }

  function sortBy(key: string) {
    if (sortKey === key) {
      sortAsc = !sortAsc;
    } else {
      sortKey = key;
      sortAsc = true;
    }
    const dir = sortAsc ? 1 : -1;
    rows = [...rows].sort((a, b) => {
      const va = a[key];
      const vb = b[key];
      if (va == null && vb == null) return 0;
      if (va == null) return 1;
      if (vb == null) return -1;
      if (va < vb) return -dir;
      if (va > vb) return dir;
      return 0;
    });
  }

  async function loadSample() {
    // Small demo dataset; replace by fetching your backend dataset JSON
    const demo = Array.from({ length: 5000 }, (_, i) => ({
      id: i + 1,
      group: `G${(i % 7) + 1}`,
      value: (Math.random() * 1000) | 0,
      note: i % 13 === 0 ? null : `row-${i}`
    }));
    rows = demo;
    columns = inferColumns(rows);
  }

  function onScroll(e: Event) {
    const el = e.currentTarget as HTMLElement;
    scrollTop = el.scrollTop;
  }

  function handleFileInput(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? '');
        // Try JSON first
        try {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            rows = parsed as Row[];
          } else if (parsed && Array.isArray(parsed.data)) {
            rows = parsed.data as Row[];
          } else {
            rows = [];
          }
        } catch {
          // Fallback: naive CSV parsing (first line as headers)
          const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
          const headers = headerLine.split(',');
          rows = lines.map((line) => {
            const values = line.split(',');
            const obj: Row = {};
            headers.forEach((h, i) => (obj[h] = values[i]));
            return obj;
          });
        }
        columns = inferColumns(rows);
      } catch (err) {
        console.error('Failed to parse file', err);
      }
    };
    reader.readAsText(file);
  }
</script>

<h1>Dataset viewer</h1>

<div class="toolbar">
  <button on:click={loadSample}>Load sample (5k rows)</button>
  <label>
    Load JSON/CSV file
    <input type="file" accept=".json,.csv,text/csv,application/json" on:change={handleFileInput} />
  </label>
</div>

{#if columns.length}
  <section class="stats">
    <h2>Column statistics</h2>
    <table class="stats-table">
      <thead>
        <tr>
          <th>Column</th>
          <th>Type</th>
          <th>Missing</th>
          <th>% Missing</th>
        </tr>
      </thead>
      <tbody>
        {#each columns as col}
          <tr>
            <td>{col.label}</td>
            <td>{columnStats[col.key]?.type ?? 'unknown'}</td>
            <td>{columnStats[col.key]?.missing ?? 0}</td>
            <td>{columnStats[col.key]?.percentMissing ?? 0}%</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </section>

  <section>
    <div class="grid" style={`height:${viewportHeight}px`} on:scroll={onScroll}>
      <div class="spacer" style={`height:${totalRows * rowHeight}px`}>
        <table class="data-table" style={`transform: translateY(${startIndex * rowHeight}px)`}>
          <thead>
            <tr>
              <th>#</th>
              {#each columns as col}
                <th>
                  <button class="col-btn" on:click={() => sortBy(col.key)}>
                    {col.label}{sortKey === col.key ? (sortAsc ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each visibleRows as row, i}
              {#key startIndex + i}
                <tr class={selected.has(startIndex + i) ? 'selected' : ''} on:click={() => toggleSelect(startIndex + i)}>
                  <td>{startIndex + i + 1}</td>
                  {#each columns as col}
                    <td>{String(row[col.key] ?? '')}</td>
                  {/each}
                </tr>
              {/key}
            {/each}
          </tbody>
        </table>
      </div>
    </div>
  </section>
{:else}
  <p>Load a dataset (JSON/CSV) or click “Load sample”.</p>
{/if}

<style>
  .toolbar {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1rem;
  }
  .grid {
    position: relative;
    overflow: auto;
    border: 1px solid rgba(148, 163, 184, 0.25);
    border-radius: 8px;
    background: rgba(15, 23, 42, 0.4);
  }
  .spacer { position: relative; }
  table { width: 100%; border-collapse: collapse; }
  thead th { position: sticky; top: 0; background: rgba(2,6,23,0.9); color: #e2e8f0; }
  td, th { padding: 6px 8px; border-bottom: 1px solid rgba(148, 163, 184, 0.2); white-space: nowrap; }
  tr.selected { background: rgba(56, 189, 248, 0.15); }
  .col-btn { background: none; color: inherit; border: none; cursor: pointer; font: inherit; }
  .stats { margin: 1rem 0; }
  .stats-table td, .stats-table th { padding: 4px 8px; }
</style>

