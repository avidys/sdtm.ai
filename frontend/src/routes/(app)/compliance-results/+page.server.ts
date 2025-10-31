import type { PageServerLoad } from './$types';
import { loadStandardDefinition } from '$lib/standards/loader';

export const load: PageServerLoad = async ({ url }) => {
	const standardId = url.searchParams.get('standard');
	const datasetNames = url.searchParams.get('datasets');

	if (!standardId || !datasetNames) {
		return {
			error: 'Missing required parameters: standard and datasets',
			standard: null
		};
	}

	try {
		const standard = await loadStandardDefinition(standardId);
		return {
			standard,
			standardId,
			datasetNames: datasetNames.split(',').filter(Boolean),
			error: null
		};
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : 'Failed to load standard',
			standard: null,
			standardId,
			datasetNames: datasetNames.split(',').filter(Boolean)
		};
	}
};

