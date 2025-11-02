/**
 * Utility functions for formatting standard names
 */

/**
 * Shorten standard name for display
 * Examples:
 * - "CDISC SDTM" v"2.0" -> "SDTM 2.0"
 * - "SDTM Implementation Guide" v"3.4" -> "SDTMIG 3.4"
 * - "Define-XML Specification" v"2.0" -> "Define-XML 2.0"
 * - "Controlled Terminology" v"2025-03-28" -> "Terminology 2025-03-28"
 */
export function shortenStandardName(name: string, version: string): string {
	const nameLower = name.toLowerCase();
	
	// Handle common patterns
	if (nameLower.includes('sdtm implementation guide') || nameLower.includes('sdtmig')) {
		return `SDTMIG ${version}`;
	}
	
	if (nameLower.includes('sdtm') && !nameLower.includes('implementation')) {
		return `SDTM ${version}`;
	}
	
	if (nameLower.includes('define-xml') || nameLower.includes('define xml')) {
		return `Define-XML ${version}`;
	}
	
	if (nameLower.includes('controlled terminology') || nameLower.includes('terminology')) {
		return `Terminology ${version}`;
	}
	
	if (nameLower.includes('adam') || nameLower.includes('adám')) {
		return `ADaM ${version}`;
	}
	
	// Default: try to extract key words and add version
	// Remove common prefixes
	let shortName = name
		.replace(/^CDISC\s+/i, '')
		.replace(/\s+Specification$/i, '')
		.replace(/\s+Implementation Guide$/i, '')
		.trim();
	
	// If still long, take first meaningful part
	if (shortName.length > 20) {
		const parts = shortName.split(/\s+/);
		shortName = parts[0];
	}
	
	return `${shortName} ${version}`;
}

