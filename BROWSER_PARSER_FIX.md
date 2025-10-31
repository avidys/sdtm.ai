# Browser Parser Fix

## Issue

The original error occurred because the parser was trying to use Node.js-specific modules in the browser:

```
TypeError: util.inherits is not a function
```

### Root Cause

The `/lib/parsers/index.ts` file imports:
- `parquetjs-lite` - requires Node.js `util` module
- `node:path`, `node:fs/promises`, `node:os` - Node.js built-in modules
- `xport-js` - requires filesystem access

These modules don't work in the browser environment where the component runs.

## Solution

Created a **browser-compatible parser** at `/lib/parsers/browser.ts`:

### What It Does

✅ **CSV Files**: Full support using PapaParse (browser-compatible)
✅ **TXT Files**: Treated as CSV files
✅ **Type Inference**: Automatically detects column types
✅ **Error Handling**: Clear messages for unsupported formats

❌ **XPT Files**: Shows helpful error directing users to server-side upload
❌ **Parquet Files**: Shows helpful error directing users to server-side upload

### Changes Made

1. **Created**: `/frontend/src/lib/parsers/browser.ts`
   - Browser-only parser using PapaParse
   - No Node.js dependencies
   - Clear error messages for unsupported formats

2. **Updated**: `DataFileViewer.svelte`
   - Changed import from `$lib/parsers` to `$lib/parsers/browser`
   - Updated file input to accept only `.csv,.txt`
   - Updated button text to "Choose CSV File"

3. **Updated**: Example page at `/routes/(app)/datasets/visualize/+page.svelte`
   - Added note about XPT/Parquet requiring server-side processing
   - Updated feature list to reflect CSV-only support

## How It Works Now

```typescript
import { parseDatasetFile } from '$lib/parsers/browser';

// For CSV files - works in browser
const dataset = await parseDatasetFile(csvFile);

// For XPT/Parquet - shows clear error
// "SAS XPT files require server-side processing..."
```

## File Format Support

| Format | Browser Support | Notes |
|--------|----------------|-------|
| CSV | ✅ Yes | Full support with PapaParse |
| TXT | ✅ Yes | Treated as CSV |
| XPT | ❌ No | Requires Node.js (use server-side upload) |
| Parquet | ❌ No | Requires Node.js (use server-side upload) |
| SAS7BDAT | ❌ No | Already disabled in original parser |

## Testing

Now the component should work without errors:

1. Navigate to `/test` or `/datasets/visualize`
2. Upload a CSV file
3. View, sort, filter, and select data
4. No more `util.inherits` errors!

## Alternative: Server-Side Parsing

For XPT and Parquet support, you would need to:

1. Create a server endpoint to handle file uploads
2. Use the original `/lib/parsers/index.ts` on the server
3. Return parsed data to the client
4. Update the component to use the API

Example approach:
```typescript
// Server endpoint: /api/parse-file
export async function POST({ request }) {
  const formData = await request.formData();
  const file = formData.get('file');
  
  // Use original parser server-side
  const dataset = await parseDatasetFile(file);
  return json(dataset);
}
```

## Benefits of Current Approach

- ✅ No server required for CSV files
- ✅ Fast parsing (client-side)
- ✅ Works offline
- ✅ No file upload size limits
- ✅ Private data stays in browser
- ✅ No additional API endpoints needed

## When to Use Server-Side

Consider server-side parsing for:
- Large files (>100MB)
- XPT/Parquet formats
- Data validation before storage
- Processing multiple files
- Security/compliance requirements

