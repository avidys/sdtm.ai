<script lang="ts">
  import { orderedFamilies, standardsCatalogue } from '$lib/standards';
</script>

<svelte:head>
  <title>CDISC Standards · SDTM.ai</title>
</svelte:head>

<section>
  <h1>CDISC Standards Library</h1>
  <p>
    Browse the standards provided with this project. You can activate one or multiple releases when
    running compliance checks. The catalogue mirrors the groupings on the CDISC website so that you
    can align your study configuration.
  </p>
</section>

{#each orderedFamilies as family}
  <section class="family">
    <header>
      <h2>{family.title}</h2>
    </header>

    <div class="cards">
      {#each standardsCatalogue[family.id] as standard}
        <article class="card">
          <h3>{standard.title} <span>v{standard.version}</span></h3>
          <p>{standard.description}</p>
          <dl>
            <div>
              <dt>Release date</dt>
              <dd>{standard.releaseDate}</dd>
            </div>
            <div>
              <dt>References</dt>
              <dd>
                {#if standard.references.length === 0}
                  <em>Metadata curated in app</em>
                {:else}
                  <ul>
                    {#each standard.references as ref}
                      <li>{ref}</li>
                    {/each}
                  </ul>
                {/if}
              </dd>
            </div>
          </dl>
        </article>
      {/each}
    </div>
  </section>
{/each}

<style>
  section {
    margin-bottom: 2.5rem;
  }

  .cards {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  }

  .card {
    background: white;
    border-radius: 1rem;
    padding: 1.5rem;
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.06);
    display: grid;
    gap: 0.75rem;
  }

  h3 {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  h3 span {
    font-size: 0.9rem;
    color: #6b7280;
  }

  dl {
    display: grid;
    gap: 0.5rem;
  }

  dt {
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: #6b7280;
  }

  dd {
    margin: 0;
  }

  ul {
    margin: 0;
    padding-left: 1.2rem;
  }
</style>
