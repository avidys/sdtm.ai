<script lang="ts">
  import type { StandardSummary } from '$lib/standards/types';
  export let data: { standards: StandardSummary[] };
  const grouped: Record<string, StandardSummary[]> = data.standards.reduce((acc, standard) => {
    const bucket = acc[standard.group] ?? [];
    bucket.push(standard);
    acc[standard.group] = bucket;
    return acc;
  }, {} as Record<string, StandardSummary[]>);
</script>

<h1>Available standards</h1>
<div class="standards">
  {#each Object.entries(grouped) as [group, items]}
    <section>
      <h2>{group}</h2>
      <ul>
        {#each items ?? [] as standard}
          <li>
            <h3>{standard.name} <small>v{standard.version}</small></h3>
            <p>{standard.description}</p>
            {#if standard.source}
              <a href={standard.source} target="_blank" rel="noreferrer">Source</a>
            {/if}
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>

<style>
  .standards {
    display: grid;
    gap: 2rem;
  }
  section {
    background: var(--color-bg-secondary); /* light green for light mode */
    padding: 1.5rem;
    border-radius: 1rem;
    border: 1px solid var(--color-border);
  }
  
  [data-theme="dark"] section {
    background: var(--color-surface);
  }
  section h2 {
    color: var(--color-text);
    margin-bottom: 1rem;
  }
  ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    gap: 1.25rem;
  }
  h3 {
    margin: 0;
    color: var(--color-text);
  }
  p {
    color: var(--color-text-secondary);
  }
  small {
    color: var(--color-text-muted);
  }
  a {
    color: var(--color-primary);
  }
  a:hover {
    color: var(--color-primary-hover);
  }
</style>
