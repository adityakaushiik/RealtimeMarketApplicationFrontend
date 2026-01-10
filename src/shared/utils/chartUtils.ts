import type { CandlestickData, HistogramData, Time } from 'lightweight-charts';
import type { PriceHistoryDailyInDb, PriceHistoryIntradayInDb } from '../types/apiTypes';

export interface ChartData {
    candles: CandlestickData[];
    volumes: HistogramData[];
}

/**
 * Converts API data (Daily or Intraday) to Lightweight Charts CandlestickData and HistogramData.
 * Handles timestamp conversion and sorting.
 */
export const parseApiData = (
    data: (PriceHistoryDailyInDb | PriceHistoryIntradayInDb)[]
): ChartData => {
    if (!data || !Array.isArray(data)) return { candles: [], volumes: [] };

    const parsedCandles: CandlestickData[] = [];
    const parsedVolumes: HistogramData[] = [];

    data.forEach(item => {
        // Prefer datetime if available (API returns datetime), otherwise fallback to date
        const dateStr = item.datetime || item.date;

        if (!dateStr) return;
        if (item.open === undefined || item.close === undefined || item.open === null || item.close === null || item.open === 0 || item.close === 0) return;

        let time: Time;

        // Check if it's a full timestamp (Intraday) or just date (Daily)
        // Simple heuristic: if it contains 'T' or ' ', treat as timestamp
        if (dateStr.includes('T') || dateStr.includes(' ')) {
            // Intraday: Convert to unix timestamp (seconds)
            time = (new Date(dateStr).getTime() / 1000) as Time;
        } else {
            // Daily: string format 'YYYY-MM-DD' is supported by lightweight-charts
            time = dateStr as Time;
        }

        const open = item.open ?? 0;
        const close = item.close ?? 0;
        const high = item.high ?? 0;
        const low = item.low ?? 0;
        const volume = item.volume ?? 0;

        parsedCandles.push({
            time: time,
            open: open,
            high: high,
            low: low,
            close: close,
        });

        // Determine color: Green if close >= open, Red if close < open
        // Using semi-transparent colors for volume
        const color = close >= open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
        parsedVolumes.push({
            time: time,
            value: volume,
            color: color,
        });
    });

    // Sort by time ascending
    const sorter = (a: any, b: any) => {
        const tA = typeof a.time === 'string' ? new Date(a.time).getTime() / 1000 : a.time as number;
        const tB = typeof b.time === 'string' ? new Date(b.time).getTime() / 1000 : b.time as number;
        return tA - tB;
    };

    parsedCandles.sort(sorter);
    parsedVolumes.sort(sorter);

    return { candles: parsedCandles, volumes: parsedVolumes };
};

/**
 * Aggregates 1-minute (or base) candles into larger timeframes.
 * @param candles Base candles (must be sorted)
 * @param volumes Base volumes (must be sorted)
 * @param timeframeMinutes Target timeframe in minutes
 */
export const aggregateCandles = (
    candles: CandlestickData[],
    volumes: HistogramData[],
    timeframeMinutes: number
): ChartData => {
    if (timeframeMinutes <= 1) return { candles, volumes }; // Assuming base is 1m

    const timeframeSeconds = timeframeMinutes * 60;
    const aggregatedCandles: CandlestickData[] = [];
    const aggregatedVolumes: HistogramData[] = [];

    let currentBucketTime: number | null = null;
    let currentCandle: CandlestickData | null = null;
    let currentVolume: HistogramData | null = null;

    // Use a single loop over candles, assuming volumes align by index since they come from same source
    for (let i = 0; i < candles.length; i++) {
        const candle = candles[i];
        const volume = volumes[i]; // Assuming alignment

        // Convert candle time to seconds for calculation
        const candleTimeSeconds = typeof candle.time === 'string'
            ? new Date(candle.time).getTime() / 1000
            : candle.time as number;

        const bucketTime = Math.floor(candleTimeSeconds / timeframeSeconds) * timeframeSeconds;

        if (currentBucketTime === null || bucketTime !== currentBucketTime) {
            // Push completed candle
            if (currentCandle) {
                aggregatedCandles.push(currentCandle);
            }
            if (currentVolume) {
                // Update final color based on final candle O/C
                if (currentCandle) {
                    currentVolume.color = currentCandle.close >= currentCandle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
                }
                aggregatedVolumes.push(currentVolume);
            }

            // Start new candle
            currentBucketTime = bucketTime;
            currentCandle = {
                time: bucketTime as Time,
                open: candle.open,
                high: candle.high,
                low: candle.low,
                close: candle.close,
            };
            currentVolume = {
                time: bucketTime as Time,
                value: volume ? volume.value : 0,
                color: 'rgba(38, 166, 154, 0.5)' // placeholder, updated on push
            };
        } else if (currentCandle && currentVolume) {
            // Update existing candle
            currentCandle.high = Math.max(currentCandle.high, candle.high);
            currentCandle.low = Math.min(currentCandle.low, candle.low);
            currentCandle.close = candle.close;
            // Accumulate volume
            if (volume) {
                currentVolume.value += volume.value;
            }
        }
    }

    // Push last candle
    if (currentCandle) {
        aggregatedCandles.push(currentCandle);
    }
    if (currentVolume && currentCandle) {
        currentVolume.color = currentCandle.close >= currentCandle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)';
        aggregatedVolumes.push(currentVolume);
    }

    return { candles: aggregatedCandles, volumes: aggregatedVolumes };
};

/**
 * Updates a candle with a new price tick.
 * If the tick belongs to the same bucket, updates H/L/C.
 * If it's a new bucket, returns a new candle.
 */
export const updateLiveCandle = (
    lastCandle: CandlestickData | null,
    lastVolume: HistogramData | null,
    price: number,
    volume: number,
    timestamp: number, // in seconds
    timeframeMinutes: number
): { candle: CandlestickData, volumeData: HistogramData, isNew: boolean } => {
    const timeframeSeconds = timeframeMinutes * 60;
    const bucketTime = Math.floor(timestamp / timeframeSeconds) * timeframeSeconds;

    // If no last candle, or this is a new bucket
    if (!lastCandle || (lastCandle.time as number) < bucketTime) {
        const newCandle = {
            time: bucketTime as Time,
            open: price,
            high: price,
            low: price,
            close: price
        };
        const newVolume = {
            time: bucketTime as Time,
            value: volume,
            color: 'rgba(38, 166, 154, 0.5)' // Same O/C initially
        };
        return {
            candle: newCandle,
            volumeData: newVolume,
            isNew: true
        };
    }

    // Update existing candle
    const updatedCandle = {
        ...lastCandle,
        high: Math.max(lastCandle.high, price),
        low: Math.min(lastCandle.low, price),
        close: price
    };

    const updatedVolume = {
        ...lastVolume!,
        time: lastVolume!.time, // Ensure time is preserved
        value: (lastVolume ? lastVolume.value : 0) + volume, // Accumulate delta volume from backend
        color: updatedCandle.close >= updatedCandle.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)'
    };

    return {
        candle: updatedCandle,
        volumeData: updatedVolume,
        isNew: false
    };
};
