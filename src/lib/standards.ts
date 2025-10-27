export interface StandardDocument {
  id: string;
  title: string;
  version: string;
  releaseDate: string;
  type: 'model' | 'implementation-guide' | 'terminology' | 'define';
  description: string;
  references: string[];
}

export const standardsCatalogue: Record<string, StandardDocument[]> = {
  model: [
    {
      id: 'sdtm-v2-0',
      title: 'Study Data Tabulation Model',
      version: '2.0',
      releaseDate: '2021-11-01',
      type: 'model',
      description: 'Core domain model defining SDTM classes, general assumptions and dataset structure.',
      references: ['SDTM_v2.0.pdf']
    }
  ],
  'implementation-guide': [
    {
      id: 'sdtmig-v3-4',
      title: 'SDTM Implementation Guide',
      version: '3.4',
      releaseDate: '2022-07-21',
      type: 'implementation-guide',
      description: 'Guidance and rules for implementing SDTM domains, variables, codelists and metadata.',
      references: ['SDTMIG v3.4-FINAL_2022-07-21.pdf', 'SDTMIG_v3.4.xlsx']
    },
    {
      id: 'sdtmig-v4-3',
      title: 'SDTMIG for Interventions',
      version: '4.3',
      releaseDate: '2024-02-01',
      type: 'implementation-guide',
      description: 'Latest SDTMIG release provided with this project including compliance rule mappings.',
      references: []
    }
  ],
  terminology: [
    {
      id: 'ct-2025-03',
      title: 'CDISC Controlled Terminology',
      version: '2025-03-28',
      releaseDate: '2025-03-28',
      type: 'terminology',
      description: 'Controlled terminology spreadsheet for code lists used across SDTM domains.',
      references: ['SDTM_CT_2025-03-28.xlsx', 'SDTM Terminology.xlsx']
    }
  ],
  define: [
    {
      id: 'define-xml-v2',
      title: 'Define-XML Specification',
      version: '2.0',
      releaseDate: '2013-06-28',
      type: 'define',
      description: 'Metadata exchange format for SDTM submissions including XML and HTML renditions.',
      references: ['define-xml-2.0']
    }
  ]
};

export const orderedFamilies: { id: keyof typeof standardsCatalogue; title: string }[] = [
  { id: 'model', title: 'Model' },
  { id: 'implementation-guide', title: 'Implementation Guides' },
  { id: 'terminology', title: 'Controlled Terminology' },
  { id: 'define', title: 'Define-XML' }
];
