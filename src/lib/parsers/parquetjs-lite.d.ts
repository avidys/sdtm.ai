declare module 'parquetjs-lite' {
  export class ParquetReader {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCursor(): any;
    close(): Promise<void>;
    metadata: {
      schema: Array<{
        path_in_schema: string[];
        converted_type?: string;
        logicalType?: string;
      }>;
    };
  }
  
  export function openBuffer(buffer: Buffer): Promise<ParquetReader>;
}
