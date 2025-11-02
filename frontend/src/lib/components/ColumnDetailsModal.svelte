<script lang="ts">
	import type { ParsedDataset } from '$lib/standards/types';
	import { getDataViewerSettings } from '$lib/stores/dataViewerSettings.svelte';
	
	let { 
		dataset, 
		columnName, 
		onClose 
	}: { 
		dataset: ParsedDataset;
		columnName: string;
		onClose: () => void;
	} = $props();
	
	const viewerSettings = getDataViewerSettings();
	
	// Helper function to format numbers with precision
	function formatNumber(value: number): string {
		return value.toFixed(viewerSettings.numberPrecision);
	}
	
	// Helper function to parse date/time values
	function parseTemporalValue(value: unknown): Date | null {
		if (value instanceof Date) return value;
		if (value === null || value === undefined || value === '') return null;
		
		const str = String(value);
		// Try parsing various date/time formats
		const date = new Date(str);
		if (!isNaN(date.getTime())) {
			return date;
		}
		
		// Try ISO formats
		if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
			const isoDate = new Date(str);
			if (!isNaN(isoDate.getTime())) return isoDate;
		}
		
		return null;
	}
	
	// Detect temporal column type (date, time, datetime)
	const temporalType = $derived.by(() => {
		const columnType = dataset.columns[columnName]?.toLowerCase() || '';
		const columnNameLower = columnName.toLowerCase();
		const values = dataset.rows.map(row => row[columnName]).filter(v => v != null && v !== '');
		
		if (values.length === 0) return null;
		
		// Check column type annotation
		if (columnType.includes('date') || columnType.includes('time') || columnType.includes('timestamp')) {
			const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
			if (parsedDates.length / values.length > 0.7) {
				// Determine if it's date, time, or datetime
				const hasTime = parsedDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = parsedDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		// Check column name patterns
		if (columnNameLower.includes('date') || columnNameLower.includes('time') || 
			columnNameLower.includes('timestamp') || columnNameLower.includes('dt')) {
			const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
			if (parsedDates.length / values.length > 0.7) {
				const hasTime = parsedDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = parsedDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		// Try to parse values as dates
		const parsedDates = values.map(v => parseTemporalValue(v)).filter(d => d !== null);
		if (parsedDates.length / values.length > 0.7) {
			// Check if parsed dates make sense (not all epoch 0)
			const validDates = parsedDates.filter(d => {
				const year = d!.getFullYear();
				return year >= 1900 && year <= 2100;
			});
			
			if (validDates.length / parsedDates.length > 0.8) {
				const hasTime = validDates.some(d => d!.getHours() !== 0 || d!.getMinutes() !== 0 || d!.getSeconds() !== 0);
				const hasDate = validDates.some(d => d!.getFullYear() !== 1970 || d!.getMonth() !== 0 || d!.getDate() !== 1);
				if (hasDate && hasTime) return 'datetime';
				if (hasTime && !hasDate) return 'time';
				return 'date';
			}
		}
		
		return null;
	});
	
	// Determine if column is continuous or categorical (exclude temporal)
	const isContinuous = $derived.by(() => {
		if (temporalType !== null) return false; // Temporal columns are not numeric continuous
		
		const columnType = dataset.columns[columnName]?.toLowerCase() || '';
		const values = dataset.rows.map(row => row[columnName]).filter(v => v != null && v !== '');
		
		// Check if type indicates numeric
		if (columnType.includes('float') || columnType.includes('int') || columnType.includes('number')) {
			return true;
		}
		
		// Check if values are numeric
		if (values.length === 0) return false;
		const numericCount = values.filter(v => !isNaN(Number(v)) && v !== '').length;
		return numericCount / values.length > 0.7; // If 70%+ are numeric, treat as continuous
	});
	
	// Calculate statistics for continuous variables
	const continuousStats = $derived.by(() => {
		if (!isContinuous) return null;
		
		const values = dataset.rows
			.map(row => row[columnName])
			.filter(v => v != null && v !== '')
			.map(v => Number(v))
			.filter(v => !isNaN(v))
			.sort((a, b) => a - b);
		
		if (values.length === 0) return null;
		
		const n = values.length;
		const sum = values.reduce((a, b) => a + b, 0);
		const mean = sum / n;
		
		// Median
		const median = n % 2 === 0
			? (values[n / 2 - 1] + values[n / 2]) / 2
			: values[Math.floor(n / 2)];
		
		// Quartiles
		const q1Index = Math.floor(n * 0.25);
		const q3Index = Math.floor(n * 0.75);
		const q1 = values[q1Index];
		const q3 = values[q3Index];
		const min = values[0];
		const max = values[n - 1];
		
		// Standard deviation
		const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
		const stdDev = Math.sqrt(variance);
		
		return {
			n,
			mean,
			median,
			q1,
			q3,
			min,
			max,
			stdDev,
			values
		};
	});
	
	// Calculate statistics for categorical variables
	const categoricalStats = $derived.by(() => {
		if (isContinuous) return null;
		
		const values = dataset.rows.map(row => row[columnName]);
		const total = values.length;
		const missing = values.filter(v => v == null || v === '').length;
		const present = total - missing;
		
		// Frequency counts
		const frequencies: Record<string, number> = {};
		values.filter(v => v != null && v !== '').forEach(v => {
			const key = String(v);
			frequencies[key] = (frequencies[key] || 0) + 1;
		});
		
		// Sort by frequency (descending)
		const sortedFrequencies = Object.entries(frequencies)
			.sort((a, b) => b[1] - a[1])
			.map(([value, count]) => ({
				value,
				count,
				percentage: Number(formatNumber((count / present) * 100))
			}));
		
		return {
			n: present,
			total,
			missing,
			missingPercentage: Number(formatNumber((missing / total) * 100)),
			frequencies: sortedFrequencies
		};
	});
	
	// Create histogram data for continuous variables
	const histogramData = $derived.by(() => {
		if (!isContinuous || !continuousStats) return null;
		
		const { values, min, max } = continuousStats;
		const binCount = Math.min(20, Math.ceil(Math.sqrt(values.length)));
		const binWidth = (max - min) / binCount;
		
		const bins: number[] = new Array(binCount).fill(0);
		const binLabels: string[] = [];
		
		for (let i = 0; i < binCount; i++) {
			const binStart = min + i * binWidth;
			const binEnd = binStart + binWidth;
			binLabels.push(`${formatNumber(binStart)}-${formatNumber(binEnd)}`);
			
			values.forEach(val => {
				if (val >= binStart && (i === binCount - 1 ? val <= binEnd : val < binEnd)) {
					bins[i]++;
				}
			});
		}
		
		return { bins, labels: binLabels, maxCount: Math.max(...bins) };
	});
	
	// Calculate x-axis tick values for histogram (evenly spaced with nice round numbers)
	const histogramXTicks = $derived.by(() => {
		if (!isContinuous || !continuousStats || !histogramData) return [];
		
		const { min, max } = continuousStats;
		const range = max - min;
		const tickCount = 5; // Number of ticks to show
		
		// Calculate nice step size
		const rawStep = range / tickCount;
		const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
		const normalized = rawStep / magnitude;
		
		// Round to nice intervals (1, 2, 5, 10, etc.)
		let niceStep: number;
		if (normalized <= 1) niceStep = 1;
		else if (normalized <= 2) niceStep = 2;
		else if (normalized <= 5) niceStep = 5;
		else niceStep = 10;
		
		niceStep *= magnitude;
		
		// Round min down and max up to nice values
		const niceMin = Math.floor(min / niceStep) * niceStep;
		const niceMax = Math.ceil(max / niceStep) * niceStep;
		
		const ticks: { value: number; position: number }[] = [];
		for (let value = niceMin; value <= niceMax; value += niceStep) {
			// Map value to position on histogram
			const normalizedValue = (value - min) / (max - min);
			const position = normalizedValue * 100;
			
			// Only include ticks within the visible range
			if (position >= 0 && position <= 100) {
				ticks.push({ 
					value: Number(formatNumber(value)), 
					position: Math.max(0, Math.min(100, position))
				});
			}
		}
		
		return ticks;
	});
	
	// Calculate y-axis tick values for histogram (nice round numbers)
	const histogramYTicks = $derived.by(() => {
		if (!histogramData) return [];
		const maxValue = histogramData.maxCount;
		const tickCount = 5;
		
		// Calculate nice step size
		const rawStep = maxValue / tickCount;
		const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
		const normalized = rawStep / magnitude;
		
		// Round to nice intervals (1, 2, 5, 10, etc.)
		let niceStep: number;
		if (normalized <= 1) niceStep = 1;
		else if (normalized <= 2) niceStep = 2;
		else if (normalized <= 5) niceStep = 5;
		else niceStep = 10;
		
		niceStep *= magnitude;
		
		// Round max up to nice value
		const niceMax = Math.ceil(maxValue / niceStep) * niceStep;
		
		const ticks: number[] = [];
		for (let value = 0; value <= niceMax; value += niceStep) {
			ticks.push(Math.round(value));
		}
		
		return ticks;
	});
	
	// Calculate boxplot positions
	const boxplotPositions = $derived.by(() => {
		if (!isContinuous || !continuousStats) return null;
		
		const range = continuousStats.max - continuousStats.min;
		return {
			range,
			q1Pos: range > 0 ? ((continuousStats.q1 - continuousStats.min) / range * 100) : 25,
			medianPos: range > 0 ? ((continuousStats.median - continuousStats.min) / range * 100) : 50,
			q3Pos: range > 0 ? ((continuousStats.q3 - continuousStats.min) / range * 100) : 75,
			medianInBoxPos: range > 0 && (continuousStats.q3 - continuousStats.q1) > 0 
				? ((continuousStats.median - continuousStats.q1) / (continuousStats.q3 - continuousStats.q1) * 100) 
				: 50
		};
	});
	
	// Calculate timeline data for temporal columns
	const timelineData = $derived.by(() => {
		if (temporalType === null) return null;
		
		const values = dataset.rows
			.map(row => row[columnName])
			.map(v => parseTemporalValue(v))
			.filter(d => d !== null) as Date[];
		
		if (values.length === 0) return null;
		
		// Sort dates
		const sortedDates = [...values].sort((a, b) => a.getTime() - b.getTime());
		const minDate = sortedDates[0];
		const maxDate = sortedDates[sortedDates.length - 1];
		const rangeMs = maxDate.getTime() - minDate.getTime();
		
		if (rangeMs === 0) return null;
		
		// Create time bins based on temporal type
		let binCount: number;
		let binSizeMs: number;
		let daysRange: number = 0;
		
		if (temporalType === 'time') {
			// For time-only, bin by hours
			const hoursRange = rangeMs / (1000 * 60 * 60);
			binCount = Math.min(24, Math.max(10, Math.ceil(hoursRange)));
			binSizeMs = rangeMs / binCount;
		} else if (temporalType === 'date') {
			// For date-only, bin by days
			daysRange = rangeMs / (1000 * 60 * 60 * 24);
			binCount = Math.min(30, Math.max(10, Math.ceil(daysRange)));
			binSizeMs = rangeMs / binCount;
		} else {
			// For datetime, use smart binning
			daysRange = rangeMs / (1000 * 60 * 60 * 24);
			if (daysRange <= 1) {
				binCount = Math.min(24, Math.max(10, Math.ceil(rangeMs / (1000 * 60 * 60)))); // Hours
				binSizeMs = rangeMs / binCount;
			} else if (daysRange <= 30) {
				binCount = Math.min(30, Math.max(10, Math.ceil(daysRange))); // Days
				binSizeMs = rangeMs / binCount;
			} else {
				binCount = Math.min(12, Math.max(6, Math.ceil(daysRange / 30))); // Months
				binSizeMs = rangeMs / binCount;
			}
		}
		
		// Create bins
		const bins: number[] = new Array(binCount).fill(0);
		const binLabels: string[] = [];
		const binStarts: Date[] = [];
		
		for (let i = 0; i < binCount; i++) {
			const binStartMs = minDate.getTime() + i * binSizeMs;
			const binStart = new Date(binStartMs);
			const binEndMs = i === binCount - 1 ? maxDate.getTime() : binStartMs + binSizeMs;
			const binEnd = new Date(binEndMs);
			binStarts.push(binStart);
			
			// Format label based on temporal type
			if (temporalType === 'time') {
				binLabels.push(binStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
			} else if (temporalType === 'date') {
				binLabels.push(binStart.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }));
			} else {
				if (daysRange <= 1) {
					binLabels.push(binStart.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
				} else {
					binLabels.push(binStart.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }));
				}
			}
			
			// Count values in this bin
			values.forEach(date => {
				const dateMs = date.getTime();
				if (dateMs >= binStartMs && (i === binCount - 1 ? dateMs <= binEndMs : dateMs < binEndMs)) {
					bins[i]++;
				}
			});
		}
		
		return {
			bins,
			labels: binLabels,
			binStarts,
			minDate,
			maxDate,
			maxCount: Math.max(...bins),
			total: values.length
		};
	});
	
	// Format date/time for display
	function formatTemporal(value: Date, type: 'date' | 'time' | 'datetime'): string {
		if (type === 'time') {
			return value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
		} else if (type === 'date') {
			return value.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
		} else {
			return value.toLocaleString([], { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
		}
	}
	
	// Calculate temporal statistics
	const temporalStats = $derived.by(() => {
		if (temporalType === null || !timelineData) return null;
		
		const values = dataset.rows
			.map(row => row[columnName])
			.map(v => parseTemporalValue(v))
			.filter(d => d !== null) as Date[];
		
		if (values.length === 0) return null;
		
		const sortedDates = [...values].sort((a, b) => a.getTime() - b.getTime());
		const min = sortedDates[0];
		const max = sortedDates[sortedDates.length - 1];
		
		// Median
		const median = sortedDates.length % 2 === 0
			? new Date((sortedDates[sortedDates.length / 2 - 1].getTime() + sortedDates[sortedDates.length / 2].getTime()) / 2)
			: sortedDates[Math.floor(sortedDates.length / 2)];
		
		// Quartiles
		const q1Index = Math.floor(sortedDates.length * 0.25);
		const q3Index = Math.floor(sortedDates.length * 0.75);
		const q1 = sortedDates[q1Index];
		const q3 = sortedDates[q3Index];
		
		// Range in appropriate units
		const rangeMs = max.getTime() - min.getTime();
		let rangeDisplay = '';
		if (rangeMs < 1000 * 60) {
			rangeDisplay = `${Math.round(rangeMs / 1000)}s`;
		} else if (rangeMs < 1000 * 60 * 60) {
			rangeDisplay = `${Math.round(rangeMs / (1000 * 60))}min`;
		} else if (rangeMs < 1000 * 60 * 60 * 24) {
			rangeDisplay = `${Math.round(rangeMs / (1000 * 60 * 60))}h`;
		} else {
			rangeDisplay = `${Math.round(rangeMs / (1000 * 60 * 60 * 24))}d`;
		}
		
		return {
			n: values.length,
			min,
			max,
			median,
			q1,
			q3,
			rangeMs,
			rangeDisplay
		};
	});
</script>

<div class="modal-overlay" onclick={onClose}>
	<div class="modal-content" onclick={(e) => e.stopPropagation()}>
		<div class="modal-header">
			<h2>Column Statistics: {columnName}</h2>
			<button class="btn-close" onclick={onClose}>&times;</button>
		</div>
		
		<div class="modal-body">
			{#if temporalType !== null && temporalStats}
				<!-- Temporal Column Statistics -->
				<div class="stats-section">
					<h3>Summary Statistics ({temporalType})</h3>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-label">Count (n):</span>
							<span class="stat-value">{temporalStats.n}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Minimum:</span>
							<span class="stat-value">{formatTemporal(temporalStats.min, temporalType)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Q1 (25th percentile):</span>
							<span class="stat-value">{formatTemporal(temporalStats.q1, temporalType)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Median:</span>
							<span class="stat-value">{formatTemporal(temporalStats.median, temporalType)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Q3 (75th percentile):</span>
							<span class="stat-value">{formatTemporal(temporalStats.q3, temporalType)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Maximum:</span>
							<span class="stat-value">{formatTemporal(temporalStats.max, temporalType)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Range:</span>
							<span class="stat-value">{temporalStats.rangeDisplay}</span>
						</div>
					</div>
				</div>
				
				{#if timelineData}
					<div class="stats-section">
						<h3>Timeline Distribution</h3>
						<div class="timeline-container">
							<div class="timeline-wrapper">
								<div class="timeline-y-axis">
									{#each timelineData.bins.map((_, i) => {
										const maxYValue = timelineData.maxCount;
										const tickValue = Math.round(maxYValue - (maxYValue / 5) * i);
										return tickValue;
									}).filter(v => v >= 0) as tickValue}
										<span class="y-axis-label">{tickValue}</span>
									{/each}
								</div>
								<div class="timeline-content">
									<div class="timeline">
										{#each timelineData.bins as count, i}
											{@const maxYValue = timelineData.maxCount}
											<div class="timeline-bar-wrapper">
												<div 
													class="timeline-bar" 
													style="height: {maxYValue > 0 ? (count / maxYValue * 100) : 0}%"
													title="{timelineData.labels[i]}: {count} occurrences"
												></div>
											</div>
										{/each}
									</div>
									<div class="timeline-x-axis">
										{#each timelineData.binStarts as binStart, i}
											{@const totalBins = timelineData.binStarts.length}
											{@const position = (i / (totalBins - 1)) * 100}
											{#if i % Math.max(1, Math.floor(totalBins / 6)) === 0 || i === totalBins - 1}
												<span class="axis-label" style="left: {position}%">
													{temporalType === 'time' 
														? binStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
														: temporalType === 'date'
															? binStart.toLocaleDateString([], { month: 'short', day: 'numeric' })
															: binStart.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
												</span>
											{/if}
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}
			{:else if isContinuous && continuousStats}
				<div class="stats-section">
					<h3>Summary Statistics</h3>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-label">Count (n):</span>
							<span class="stat-value">{continuousStats.n}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Mean:</span>
							<span class="stat-value">{formatNumber(continuousStats.mean)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Median:</span>
							<span class="stat-value">{formatNumber(continuousStats.median)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Standard Deviation:</span>
							<span class="stat-value">{formatNumber(continuousStats.stdDev)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Minimum:</span>
							<span class="stat-value">{formatNumber(continuousStats.min)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Q1 (25th percentile):</span>
							<span class="stat-value">{formatNumber(continuousStats.q1)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Q3 (75th percentile):</span>
							<span class="stat-value">{formatNumber(continuousStats.q3)}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Maximum:</span>
							<span class="stat-value">{formatNumber(continuousStats.max)}</span>
						</div>
					</div>
				</div>
				
				{#if histogramData}
					<div class="stats-section">
						<h3>Histogram</h3>
						<div class="histogram-container">
							<div class="histogram-wrapper">
								<div class="histogram-y-axis">
									{#each histogramYTicks.slice().reverse() as tickValue}
										<span class="y-axis-label">{tickValue}</span>
									{/each}
								</div>
								<div class="histogram-content">
									<div class="histogram">
										{#each histogramData.bins as count, i}
											{@const maxYValue = histogramYTicks.length > 0 ? histogramYTicks[histogramYTicks.length - 1] : histogramData.maxCount}
											<div class="histogram-bar-wrapper">
												<div 
													class="histogram-bar" 
													style="height: {maxYValue > 0 ? (count / maxYValue * 100) : 0}%"
													title="{histogramData.labels[i]}: {count}"
												></div>
											</div>
										{/each}
									</div>
									<div class="histogram-x-axis">
										{#each histogramXTicks as tick}
											<span class="axis-label" style="left: {tick.position}%">{tick.value}</span>
										{/each}
									</div>
								</div>
							</div>
						</div>
					</div>
					
					{#if boxplotPositions}
						<div class="stats-section">
							<h3>Box Plot</h3>
							<div class="boxplot-container">
								<div class="boxplot-wrapper">
									<div class="boxplot">
										<!-- Left whisker -->
										<div class="boxplot-whisker-line" style="left: 0; width: {boxplotPositions.q1Pos}%"></div>
										<div class="boxplot-whisker-cap" style="left: 0"></div>
										
										<!-- Box -->
										<div class="boxplot-box" style="left: {boxplotPositions.q1Pos}%; width: {boxplotPositions.q3Pos - boxplotPositions.q1Pos}%">
											<div class="boxplot-median" style="left: {boxplotPositions.medianInBoxPos}%"></div>
										</div>
										
										<!-- Right whisker -->
										<div class="boxplot-whisker-line" style="left: {boxplotPositions.q3Pos}%; width: {100 - boxplotPositions.q3Pos}%"></div>
										<div class="boxplot-whisker-cap" style="right: 0"></div>
									</div>
									<div class="boxplot-x-axis">
										<span class="boxplot-tick" style="left: 0">{formatNumber(continuousStats.min)}</span>
										<span class="boxplot-tick" style="left: {boxplotPositions.q1Pos}%">{formatNumber(continuousStats.q1)}</span>
										<span class="boxplot-tick" style="left: {boxplotPositions.medianPos}%">{formatNumber(continuousStats.median)}</span>
										<span class="boxplot-tick" style="left: {boxplotPositions.q3Pos}%">{formatNumber(continuousStats.q3)}</span>
										<span class="boxplot-tick" style="right: 0">{formatNumber(continuousStats.max)}</span>
									</div>
								</div>
							</div>
						</div>
					{/if}
				{/if}
			{:else if !isContinuous && categoricalStats}
				<div class="stats-section">
					<h3>Summary Statistics</h3>
					<div class="stats-grid">
						<div class="stat-item">
							<span class="stat-label">Total Count (n):</span>
							<span class="stat-value">{categoricalStats.total}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Present:</span>
							<span class="stat-value">{categoricalStats.n}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Missing:</span>
							<span class="stat-value">{categoricalStats.missing} ({categoricalStats.missingPercentage}%)</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">Unique Values:</span>
							<span class="stat-value">{categoricalStats.frequencies.length}</span>
						</div>
					</div>
				</div>
				
				<div class="stats-section">
					<h3>Frequency Distribution</h3>
					<div class="frequency-table">
						<table>
							<thead>
								<tr>
									<th>Value</th>
									<th>Count</th>
									<th>Percentage</th>
								</tr>
							</thead>
							<tbody>
								{#each categoricalStats.frequencies as freq}
									<tr>
										<td class="value-cell">{freq.value}</td>
										<td class="count-cell">{freq.count}</td>
										<td class="percentage-cell">
											<div class="percentage-bar">
												<div class="percentage-fill" style="width: {freq.percentage}%"></div>
												<span>{freq.percentage}%</span>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2000;
		backdrop-filter: blur(4px);
		padding: 1rem;
	}

	.modal-content {
		background: var(--color-surface);
		border: 2px solid var(--color-border);
		border-radius: 1rem;
		max-width: 900px;
		max-height: 90vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		box-shadow: var(--shadow-lg);
		overflow: hidden;
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 2px solid var(--color-border);
		background: var(--color-bg-secondary);
	}

	.modal-header h2 {
		margin: 0;
		color: var(--color-primary);
		font-size: 1.5rem;
		font-weight: 600;
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.75rem;
		cursor: pointer;
		color: var(--color-text-muted);
		width: 2.5rem;
		height: 2.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		transition: all 0.2s;
		line-height: 1;
	}

	.btn-close:hover {
		background: var(--color-error);
		color: white;
	}

	.modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
	}

	.stats-section {
		margin-bottom: 2rem;
	}

	.stats-section:last-child {
		margin-bottom: 0;
	}

	.stats-section h3 {
		color: var(--color-text);
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1rem;
		border-bottom: 2px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem;
		background: var(--color-bg-secondary);
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
	}

	.stat-label {
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	.stat-value {
		color: var(--color-text);
		font-weight: 600;
		font-size: 1.1rem;
	}

	.histogram-container {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.histogram-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.histogram-y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-end;
		min-width: 40px;
		height: 200px;
		padding-right: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.y-axis-label {
		flex: 0 0 auto;
		text-align: right;
		line-height: 1;
	}

	.histogram-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.histogram {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		gap: 2px;
		height: 200px;
		margin-bottom: 0.5rem;
		flex: 1;
	}

	.histogram-bar-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
	}

	.histogram-bar {
		width: 100%;
		background: var(--color-primary);
		border-radius: 2px 2px 0 0;
		min-height: 2px;
		transition: all 0.2s;
	}

	.histogram-bar:hover {
		background: var(--color-primary-hover);
		opacity: 0.8;
	}

	.histogram-x-axis {
		position: relative;
		height: 1.5rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.25rem;
	}

	.histogram-x-axis .axis-label {
		position: absolute;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.boxplot-container {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.boxplot-wrapper {
		position: relative;
	}

	.boxplot {
		position: relative;
		height: 80px;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		margin-bottom: 2rem;
		overflow: visible;
	}

	.boxplot-whisker-line {
		position: absolute;
		top: 50%;
		height: 2px;
		background: var(--color-text);
		transform: translateY(-50%);
	}

	.boxplot-whisker-cap {
		position: absolute;
		top: 50%;
		width: 6px;
		height: 6px;
		background: var(--color-text);
		border-radius: 50%;
		transform: translate(-50%, -50%);
	}

	.boxplot-box {
		position: absolute;
		top: 20%;
		bottom: 20%;
		border: 2px solid var(--color-primary);
		border-left: none;
		border-right: none;
		background: rgba(5, 150, 105, 0.1);
	}

	.boxplot-median {
		position: absolute;
		top: 0;
		bottom: 0;
		width: 3px;
		background: var(--color-error);
		transform: translateX(-50%);
	}

	.boxplot-x-axis {
		position: relative;
		height: 1.5rem;
		border-top: 1px solid var(--color-border);
		margin-top: 0.5rem;
	}

	.boxplot-tick {
		position: absolute;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		transform: translateX(-50%);
		white-space: nowrap;
	}

	.boxplot-tick:last-child {
		transform: translateX(0);
		right: 0;
		left: auto !important;
	}

	.frequency-table {
		overflow-x: auto;
	}

	.frequency-table table {
		width: 100%;
		border-collapse: collapse;
		background: var(--color-surface);
	}

	.frequency-table th {
		background: var(--color-bg-secondary);
		padding: 0.75rem;
		text-align: left;
		font-weight: 600;
		color: var(--color-text);
		border-bottom: 2px solid var(--color-border);
	}

	.frequency-table td {
		padding: 0.75rem;
		border-bottom: 1px solid var(--color-border);
		color: var(--color-text);
	}

	.value-cell {
		font-weight: 500;
	}

	.count-cell {
		text-align: right;
	}

	.percentage-cell {
		min-width: 150px;
	}

	.percentage-bar {
		position: relative;
		width: 100%;
		height: 24px;
		background: var(--color-bg-secondary);
		border-radius: 4px;
		overflow: hidden;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.percentage-fill {
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		background: var(--color-primary);
		transition: width 0.3s ease;
	}

	.percentage-bar span {
		position: relative;
		z-index: 1;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--color-text);
	}

	.timeline-container {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 1.5rem;
	}

	.timeline-wrapper {
		display: flex;
		gap: 0.5rem;
	}

	.timeline-y-axis {
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: flex-end;
		min-width: 40px;
		height: 200px;
		padding-right: 0.5rem;
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}

	.timeline-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}

	.timeline {
		display: flex;
		align-items: flex-end;
		justify-content: space-around;
		gap: 2px;
		height: 200px;
		margin-bottom: 0.5rem;
		flex: 1;
	}

	.timeline-bar-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: flex-end;
		height: 100%;
	}

	.timeline-bar {
		width: 100%;
		background: var(--color-primary);
		border-radius: 2px 2px 0 0;
		min-height: 2px;
		transition: all 0.2s;
	}

	.timeline-bar:hover {
		background: var(--color-primary-hover);
		opacity: 0.8;
	}

	.timeline-x-axis {
		position: relative;
		height: 1.5rem;
		border-top: 1px solid var(--color-border);
		padding-top: 0.25rem;
	}

	.timeline-x-axis .axis-label {
		position: absolute;
		font-size: 0.7rem;
		color: var(--color-text-muted);
		transform: translateX(-50%);
		white-space: nowrap;
	}

	@media (max-width: 768px) {
		.modal-content {
			max-width: 100vw;
			max-height: 100vh;
			border-radius: 0;
		}

		.modal-header {
			padding: 1rem;
		}

		.modal-header h2 {
			font-size: 1.25rem;
		}

		.modal-body {
			padding: 1rem;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}
	}
</style>

