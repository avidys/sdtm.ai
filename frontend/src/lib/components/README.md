# DataFileViewer Component

A high-performance Svelte 5 component for visualizing CSV and SAS XPT files with interactive data exploration features.

## Features

- **Reactive State Management**: Built with Svelte 5's `$state` and `$derived` runes
- **Multiple File Formats**: Supports CSV, SAS XPT, and Parquet files
- **Virtual Scrolling**: Efficiently renders large datasets (10,000+ rows)
- **Interactive Sorting**: Click column headers to sort ascending/descending
- **Real-time Filtering**: Search across all columns instantly
- **Row Selection**: Select multiple rows and export as JSON
- **Column Statistics**: Automatic calculation of data types, missing values, and unique counts
- **Modern UI**: Beautiful dark theme with smooth animations

## Usage

```svelte
<script>
  import DataFileViewer from '$lib/components/DataFileViewer.svelte';
</script>

<DataFileViewer />
```

## Component Architecture

### State Management

The component uses Svelte 5's reactive primitives:

- `$state`: For mutable reactive state (dataset, loading, error, selections)
- `$derived`: For computed values (filtered/sorted rows, statistics)
- `$derived.by`: For complex derivations with multiple dependencies
- `SvelteSet`: For reactive row selection

### Key Features Implementation

#### Virtualization
Only renders visible rows using a virtual scrolling technique:
```typescript
let startIndex = $derived(Math.max(0, Math.floor(scrollTop / rowHeight) - 10));
let visibleRows = $derived(rows.slice(startIndex, endIndex));
```

#### Filtering & Sorting
Reactive pipeline that updates automatically:
```typescript
let rows = $derived.by(() => {
  if (!dataset) return [];
  let filtered = dataset.rows;
  
  // Apply filter
  if (filterText.trim()) {
    filtered = filtered.filter(row => /* ... */);
  }
  
  // Apply sorting
  if (sortColumn) {
    filtered = [...filtered].sort((a, b) => /* ... */);
  }
  
  return filtered;
});
```

#### Column Statistics
Automatically computed from the dataset:
```typescript
let columnStats = $derived.by(() => {
  const stats = {};
  for (const col of columns) {
    // Calculate type, missing, unique counts
  }
  return stats;
});
```

## Integration with Existing Parsers

The component uses the existing parser infrastructure:

```typescript
import { parseDatasetFile } from '$lib/parsers';

// Handles CSV, XPT, Parquet automatically
dataset = await parseDatasetFile(file);
```

## Styling

The component uses a consistent dark theme that matches the project:
- Background: `rgba(15, 23, 42, 0.4)`
- Accent: `#38bdf8` (cyan)
- Text: `#e2e8f0` (light gray)
- Borders: `rgba(148, 163, 184, 0.25)`

## Performance

- **Virtual Scrolling**: Only renders ~30 rows at a time regardless of dataset size
- **Keyed Each Blocks**: Efficient updates when data changes
- **Debounced Filtering**: Smooth performance during text input
- **Reactive Set**: Fast row selection operations

## File Format Support

### CSV Files
- Parsed with PapaParse
- Auto-detects headers
- Dynamic type inference

### SAS XPT Files  
- Parsed with xport-js
- Maintains SAS metadata
- Full variable support

### Parquet Files
- Parsed with parquetjs-lite
- Columnar format benefits
- Schema preservation

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires ES2020+ support

## License

Part of the s-sdtm-ai project.

