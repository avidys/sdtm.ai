import type { StandardSummary } from './types';

export const STANDARD_CATALOG: StandardSummary[] = [
  {
    id: 'sdtm-2-0',
    name: 'CDISC SDTM',
    version: '2.0',
    group: 'SDTM',
    description:
      'Study Data Tabulation Model core model defining standard domains, variables, and structures for clinical study data.',
    source: '/SDTM_v2.0.pdf'
  },
  {
    id: 'sdtmig-3-4',
    name: 'SDTM Implementation Guide',
    version: '3.4',
    group: 'SDTMIG',
    description:
      'Implementation guidance for SDTM with detailed domain structures and rules. Extracted from the Excel companion in this repository.',
    source: '/SDTMIG_v3.4.xlsx'
  },
  {
    id: 'define-2-0',
    name: 'Define-XML Specification',
    version: '2.0',
    group: 'DefineXML',
    description:
      'Specification for describing tabulation datasets metadata for regulatory review.',
    source: 'https://www.cdisc.org/standards/foundational/define-xml'
  },
  {
    id: 'terminology-2025-03-28',
    name: 'Controlled Terminology',
    version: '2025-03-28',
    group: 'Terminology',
    description:
      'Controlled terminology package for SDTM domains.',
    source: '/SDTM_CT_2025-03-28.xlsx'
  }
];

export function getStandardSummary(id: string) {
  return STANDARD_CATALOG.find((standard) => standard.id === id);
}
