import { XMLBuilder } from 'fast-xml-parser';
import type { StoredComplianceRun, StoredDataset } from '$lib/server/database';
import type { StandardDefinition } from '$lib/standards/types';

export function generateDefineXml(
  dataset: StoredDataset,
  standard: StandardDefinition,
  run: StoredComplianceRun
) {
  const builder = new XMLBuilder({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    format: true
  });

  const document = {
    'odm:ODM': {
      '@xmlns:odm': 'http://www.cdisc.org/ns/odm/v1.3',
      '@xmlns:def': 'http://www.cdisc.org/ns/def/v2.0',
      '@FileOID': `DEF.${dataset.id}`,
      '@CreationDateTime': new Date().toISOString(),
      '@ODMVersion': '1.3.2',
      '@FileType': 'Snapshot',
      'Study': {
        '@OID': `STUDY.${dataset.id}`,
        'GlobalVariables': {
          'StudyName': dataset.name,
          'StudyDescription': `Dataset ${dataset.name} checked against ${standard.name} ${standard.version}`,
          'ProtocolName': dataset.domain ?? dataset.name
        }
      },
      'def:Standards': {
        'def:Standard': {
          '@OID': standard.id,
          '@Name': standard.name,
          '@Type': standard.group,
          '@Version': standard.version
        }
      },
      'def:Datasets': {
        'def:ItemGroupDef': {
          '@OID': dataset.tableName,
          '@Name': dataset.name,
          '@Domain': dataset.domain ?? '',
          '@Repeating': 'No',
          '@IsReferenceData': 'No',
          '@Purpose': 'Tabulation',
          '@def:Class': standard.domains.find((domain) => domain.domain === dataset.domain)?.class ?? '',
          'def:ItemRef': Object.entries(dataset.columns).map(([name, type]) => ({
            '@ItemOID': `${dataset.tableName}.${name}`,
            '@OrderNumber': '1',
            '@Mandatory': 'No',
            '@MethodOID': '',
            '@Role': type
          }))
        }
      },
      'def:AnalysisResultDisplays': {
        'def:AnalysisResultDisplay': {
          '@OID': `ARD.${run.id}`,
          '@Name': 'SDTM Compliance Findings',
          'def:AnalysisResult': run.findings.map((finding) => ({
            '@OID': finding.id,
            'def:Description': finding.message,
            'def:Reason': finding.ruleReference ?? '',
            'def:Severity': finding.severity,
            'def:StandardRef': {
              '@def:StandardOID': standard.id
            }
          }))
        }
      }
    }
  };

  return builder.build(document);
}
