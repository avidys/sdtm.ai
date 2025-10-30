import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { parseDatasetFile } from '$lib/parsers';
import { loadStandardDefinition } from '$lib/standards/loader';
import { runComplianceCheck } from '$lib/standards/compliance';
import { STANDARD_CATALOG } from '$lib/standards/catalog';

// export const load: PageServerLoad = async ({ locals }) => {
//   if (!locals.session) {
//     throw redirect(303, '/login');
//   }
//   return {
//     datasets: locals.database.listDatasets(),
//     runs: locals.database.listRuns(),
//     standards: STANDARD_CATALOG
//   };
// };

export const load: PageServerLoad = async ({ fetch, url }) => {
  // 1. Construct the absolute URL to your API endpoint.
  // Use the same host but different port from environment variable
  const hostname = url.hostname;
  const protocol = url.protocol;
  const apiPort = process.env.API_PORT || 8000; // Default to 8000 if not set
  const apiUrl = `${protocol}//${hostname}:${apiPort}/api/data`;
  console.log(`SvelteKit server is fetching: ${apiUrl}`);
  
  // 2. Make an HTTP request from the SvelteKit server to the API.
  // Vercel's router sees "/api/data" and rewrites it to your Python function.
  const response = await fetch(apiUrl);
  console.log(`Response: ${response}`);
  if (!response.ok) {
      // Handle error
      console.log(`Error: ${response.statusText}`);
      return { error: "Failed to load data from Python API" };
  }

  const data = await response.json();
  console.log(`Data: ${data}`);

  return {
    datasets: [],
    runs: [],
    standards: STANDARD_CATALOG,
    pythonData: data
  };
  // 3. Return the data to your +page.svelte file
  // return {
  //     pythonData: data
  // };
}

export const actions: Actions = {
  default: async ({ request, locals }) => {
    return {
      success: true,
      ingested: [],
      message: `This is a test.`
    };
    if (!locals.session) {
      throw redirect(303, '/login');
    }

    const formData = await request.formData();
    const standardId = String(formData.get('standard'));
    if (!standardId) {
      return fail(400, { message: 'Please select a standard to validate against.' });
    }

    const files = formData.getAll('files') as File[];
    if (files.length === 0) {
      return fail(400, { message: 'Please upload at least one dataset file.' });
    }

    try {
      const standard = await loadStandardDefinition(standardId);
      const ingested = [] as { datasetId: string; runId: string }[];

      for (const file of files) {
        const dataset = await parseDatasetFile(file);
        const stored = await locals.database.upsertDataset(dataset);
        const run = runComplianceCheck({ standard, dataset });
        const storedRun = {
          ...run,
          datasetId: stored.id,
          datasetName: stored.name
        };
        locals.database.saveRun(storedRun);
        ingested.push({ datasetId: stored.id, runId: storedRun.id });
      }

      return {
        success: true,
        ingested,
        message: `Processed ${ingested.length} dataset(s).`
      };
    } catch (cause) {
      console.error('Ingestion failed', cause);
      const errorMessage = cause instanceof Error ? cause.message : String(cause);
      return fail(500, { message: `Unable to process the uploaded files: ${errorMessage}` });
    }
  }
};


// src/routes/(app)/datasets/+page.server.ts
// export const load: PageServerLoad = async ({ fetch, url }) => {
//   // Use relative URL - Vercel will route it to Python function
//   const apiUrl = '/api/data';  // Changed from absolute URL
  
//   const response = await fetch(apiUrl, {
//     headers: {
//       'Accept': 'application/json',
//     }
//   });
  
//   if (!response.ok) {
//     console.error(`Error: ${response.statusText}`);
//     return { 
//       datasets: [],
//       runs: [],
//       standards: STANDARD_CATALOG,
//       error: "Failed to load data from Python API" 
//     };
//   }

//   const data = await response.json();
  
//   return {
//     datasets: [],
//     runs: [],
//     standards: STANDARD_CATALOG,
//     pythonData: data
//   };
// };