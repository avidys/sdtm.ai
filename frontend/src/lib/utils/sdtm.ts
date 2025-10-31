/**
 * SDTM domain detection and validation utilities
 */

// Common SDTM domains
const SDTM_DOMAINS = [
	// Special Purpose
	'DM', 'CO', 'SE', 'SV', 'SM',
	// Events
	'AE', 'CE', 'DS', 'MH', 'DV',
	// Interventions
	'CM', 'EX', 'SU', 'PR',
	// Findings
	'LB', 'VS', 'EG', 'PE', 'QS', 'SC', 'MS', 'PC', 'PP', 'FA', 'IS', 'DD',
	// Findings About
	'DD',
	// Trial Design
	'TA', 'TE', 'TI', 'TS', 'TV',
	// Relationship
	'RELREC', 'RELSPEC', 'RELSUB', 'SUPPQUAL'
];

/**
 * Determines if a filename is SDTM compliant
 * Returns domain code and type (domain or supplemental)
 */
export function detectSDTMCompliance(filename: string): {
	isCompliant: boolean;
	domain: string | null;
	type: 'domain' | 'supplemental' | null;
	icon: string;
} {
	// Remove extension and convert to uppercase
	const name = filename.replace(/\.(csv|xpt|txt|parquet|pq)$/i, '').toUpperCase();
	
	// Check for SUPP pattern (e.g., SUPPAE, SUPPDM)
	const suppMatch = name.match(/^SUPP([A-Z]{2})$/);
	if (suppMatch) {
		const domain = suppMatch[1];
		if (SDTM_DOMAINS.includes(domain)) {
			return {
				isCompliant: true,
				domain,
				type: 'supplemental',
				icon: '📎' // Paperclip for supplemental
			};
		}
	}
	
	// Check for standard domain (2 letters)
	const domainMatch = name.match(/^([A-Z]{2})$/);
	if (domainMatch) {
		const domain = domainMatch[1];
		if (SDTM_DOMAINS.includes(domain)) {
			return {
				isCompliant: true,
				domain,
				type: 'domain',
				icon: '✓' // Checkmark for compliant
			};
		}
	}
	
	// Not compliant
	return {
		isCompliant: false,
		domain: null,
		type: null,
		icon: '⚠️' // Warning for non-compliant
	};
}

/**
 * Get all standard SDTM domains
 */
export function getStandardDomains(): string[] {
	return [...SDTM_DOMAINS];
}

