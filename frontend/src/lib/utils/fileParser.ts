import { parseDatasetFile } from '$lib/parsers/browser';
import type { ParsedDataset } from '$lib/standards/types';

/**
 * Parse a file using the specified parser (pandas or R)
 */
export async function parseFileWithParser(
	file: File,
	parser: 'pandas' | 'r'
): Promise<ParsedDataset> {
	const extension = file.name.split('.').pop()?.toLowerCase() || '';
	
	// Browser-compatible formats (CSV, TXT) can be parsed client-side
	if ((extension === 'csv' || extension === 'txt') && parser === 'pandas') {
		// Use browser parser for CSV/TXT with pandas
		return await parseDatasetFile(file);
	}
	
	// All other formats or R parser require server-side processing
	return await parseServerSideFile(file, parser);
}

/**
 * Parse file using server-side API (pandas or R)
 */
async function parseServerSideFile(
	file: File,
	parser: 'pandas' | 'r'
): Promise<ParsedDataset> {
	// Use environment variables if available, otherwise default to localhost
	const apiPort = import.meta.env.VITE_API_PORT || import.meta.env.PUBLIC_API_PORT || '8000';
	const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost';
	
	// Select API endpoint based on parser
	const endpoint = parser === 'pandas' ? '/api/parse_pd' : '/api/parse';
	const parseUrl = `${backendUrl}:${apiPort}${endpoint}`;
	
	const formData = new FormData();
	formData.append('file', file);
	
	const response = await fetch(parseUrl, {
		method: 'POST',
		body: formData
	});
	
	if (!response.ok) {
		const errorText = await response.text();
		let errorMessage = '';
		
		// Try to parse JSON error response
		try {
			const errorJson = JSON.parse(errorText);
			errorMessage = errorJson.detail || errorJson.message || errorText;
		} catch {
			// If not JSON, use the text as-is
			errorMessage = errorText;
		}
		
		// Remove duplicate "Failed to parse {filename}:" prefix if present
		const filePrefix = `Failed to parse ${file.name}:`;
		if (errorMessage.startsWith(filePrefix)) {
			errorMessage = errorMessage.substring(filePrefix.length).trim();
		}
		
		// Format the final error message
		throw new Error(`Failed to parse ${file.name}; parser replied: ${errorMessage}`);
	}
	
	const result = await response.json();
	
	// Convert API response to ParsedDataset format
	// API returns: { file: filename, status: "parsed", data: array_of_records }
	let rows: Record<string, unknown>[];
	
	if (Array.isArray(result.data)) {
		// Data is already an array of records
		rows = result.data;
	} else if (typeof result.data === 'string') {
		// If data is a JSON string (legacy format), parse it
		rows = JSON.parse(result.data);
	} else {
		throw new Error(`Unexpected data format from API for ${file.name}`);
	}
	
	if (!rows || rows.length === 0) {
		throw new Error(`No data rows found in ${file.name}`);
	}
	
	const columns = guessColumnTypes(rows);
	
	return {
		name: normalizeName(file.name),
		domain: normalizeName(file.name).slice(0, 2),
		rowCount: rows.length,
		columns,
		rows
	};
}

/**
 * Helper function to normalize dataset name
 */
function normalizeName(name: string): string {
	return name
		.replace(/\.[^/.]+$/, '') // Remove extension
		.replace(/\s+/g, '_')
		.replace(/[^A-Za-z0-9_]/g, '')
		.toUpperCase();
}

/**
 * Helper function to guess column types
 */
function guessColumnTypes(rows: Record<string, unknown>[]): Record<string, string> {
	const result: Record<string, string> = {};
	
	if (rows.length === 0) return result;
	
	const columns = Object.keys(rows[0]);
	
	for (const col of columns) {
		let type = 'string';
		
		for (let i = 0; i < Math.min(10, rows.length); i++) {
			const value = rows[i][col];
			
			if (value === null || value === undefined || value === '') {
				continue;
			}
			
			if (typeof value === 'number') {
				type = Number.isInteger(value) ? 'integer' : 'double';
				break;
			} else if (value instanceof Date) {
				type = 'date';
				break;
			} else if (typeof value === 'boolean') {
				type = 'boolean';
				break;
			}
		}
		
		result[col] = type;
	}
	
	return result;
}

