import type { CandlestickData, Time } from 'lightweight-charts';
import type { PriceHistoryDailyInDb, PriceHistoryIntradayInDb } from '../types/apiTypes';

/**
 * Converts API data (Daily or Intraday) to Lightweight Charts CandlestickData.
 * Handles timestamp conversion and sorting.
 */
export const parseApiData = (
    data: (PriceHistoryDailyInDb | PriceHistoryIntradayInDb)[]
): CandlestickData[] => {
    if (!data || !Array.isArray(data)) return [];

    const parsed = data.map((item) => {
        // Prefer datetime if available (API returns datetime), otherwise fallback to date
        const dateStr = item.datetime || item.date;

        if (!dateStr) return null;

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

        return {
            time: time,
            open: item.open ?? 0,
            high: item.high ?? 0,
            low: item.low ?? 0,
            close: item.close ?? 0,
        } as CandlestickData;
    }).filter(item => item !== null) as CandlestickData[];

    // Sort by time ascending
    return parsed.sort((a, b) => {
        const tA = typeof a.time === 'string' ? new Date(a.time).getTime() / 1000 : a.time as number;
        const tB = typeof b.time === 'string' ? new Date(b.time).getTime() / 1000 : b.time as number;
        return tA - tB;
    });
};

/**
 * Aggregates 1-minute (or base) candles into larger timeframes.
 * @param data Base candles (must be sorted)
 * @param timeframeMinutes Target timeframe in minutes
 */
export const aggregateCandles = (
    data: CandlestickData[],
    timeframeMinutes: number
): CandlestickData[] => {
    if (timeframeMinutes <= 1) return data; // Assuming base is 1m

    const timeframeSeconds = timeframeMinutes * 60;
    const aggregated: CandlestickData[] = [];

    let currentBucketTime: number | null = null;
    let currentCandle: CandlestickData | null = null;

    for (const candle of data) {
        // Convert candle time to seconds for calculation
        const candleTimeSeconds = typeof candle.time === 'string'
            ? new Date(candle.time).getTime() / 1000
            : candle.time as number;

        const bucketTime = Math.floor(candleTimeSeconds / timeframeSeconds) * timeframeSeconds;

        if (currentBucketTime === null || bucketTime !== currentBucketTime) {
            // Push completed candle
            if (currentCandle) {
                aggregated.push(currentCandle);
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
        } else if (currentCandle) {
            // Update existing candle
            currentCandle.high = Math.max(currentCandle.high, candle.high);
            currentCandle.low = Math.min(currentCandle.low, candle.low);
            currentCandle.close = candle.close;
        }
    }

    // Push last candle
    if (currentCandle) {
        aggregated.push(currentCandle);
    }

    return aggregated;
};

/**
 * Updates a candle with a new price tick.
 * If the tick belongs to the same bucket, updates H/L/C.
 * If it's a new bucket, returns a new candle.
 */
export const updateLiveCandle = (
    lastCandle: CandlestickData | null,
    price: number,
    timestamp: number, // in seconds
    timeframeMinutes: number
): { candle: CandlestickData, isNew: boolean } => {
    const timeframeSeconds = timeframeMinutes * 60;
    const bucketTime = Math.floor(timestamp / timeframeSeconds) * timeframeSeconds;

    // If no last candle, or this is a new bucket
    if (!lastCandle || (lastCandle.time as number) < bucketTime) {
        return {
            candle: {
                time: bucketTime as Time,
                open: price,
                high: price,
                low: price,
                close: price
            },
            isNew: true
        };
    }

    // Update existing candle
    return {
        candle: {
            ...lastCandle,
            high: Math.max(lastCandle.high, price),
            low: Math.min(lastCandle.low, price),
            close: price
        },
        isNew: false
    };
};
