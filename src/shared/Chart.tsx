// Chart.tsx
// A lightweight-charts candlestick chart that streams OHLC updates from a local DataService
// and renders them in near real-time using series.update(). The chart auto-sizes to its
// container, colors bullish/bearish candles, and keeps the viewport scrolled to the right.
import {useEffect, useRef, useState, useMemo} from 'react';
import {type CandlestickData, CandlestickSeries, createChart, type Time} from 'lightweight-charts';
import {useDataStore} from './dataService';
import {useShallow} from 'zustand/react/shallow';
import type {UnpackedData} from "../utils/utils.ts";

/**
 * Timeframe constants for chart intervals (in minutes)
 */
const TIMEFRAMES = {
    ONE_MINUTE: 1,
    FIVE_MINUTES: 5,
    FIFTEEN_MINUTES: 15,
    THIRTY_MINUTES: 30,
    ONE_HOUR: 60,
    FOUR_HOURS: 240,
    ONE_DAY: 1440
} as const;

type Timeframe = typeof TIMEFRAMES[keyof typeof TIMEFRAMES];

/**
 * Helper to convert timeframe to milliseconds
 */
const timeframeToMs = (timeframe: Timeframe): number => {
    return timeframe * 60 * 1000; // Convert minutes to milliseconds
};

/**
 * Props interface for Chart component
 */
interface ChartProps {
    symbol: string;
}

/**
 * Chart component
 * - Initializes a lightweight-charts candlestick chart
 * - Streams incoming OHLCV updates from DataService into the chart via series.update
 * - Prevents duplicate updates by tracking the last processed timestamp
 */
const Chart = ({symbol}: ChartProps) => {
    /**
     * Current timeframe for the chart (default: 5 minutes)
     */
    const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES.FIVE_MINUTES);

    /**
     * Debug state to track candle count (for UI display)
     */
    const [candleCount, setCandleCount] = useState(0);

    /**
     * Debug state to track current bucket time (for UI display)
     */
    const [currentBucketTime, setCurrentBucketTime] = useState<number | null>(null);

    /**
     * Host div for the chart. Passed to lightweight-charts createChart to mount canvas.
     */
    const chartContainerRef = useRef<HTMLDivElement>(null);

    /**
     * Chart instance ref so we can clean up on unmount.
     */
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);

    /**
     * Series instance ref so we can push real-time updates without re-rendering React.
     * Using the series reference avoids storing large arrays in React state.
     */
    const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);

    /**
     * Tracks the last processed timestamp to avoid applying the same update repeatedly
     * when the store still holds the previous tick/candle.
     */
    const lastTsRef = useRef<number | null>(null);

    /**
     * Store aggregated candles by timeframe bucket.
     * Key: time bucket (normalized timestamp), Value: CandlestickData
     */
    const candlesRef = useRef<Map<number, CandlestickData>>(new Map());

    /**
     * Track the current time bucket to detect when we move to a new candle
     */
    const currentTimeBucketRef = useRef<number | null>(null);

    // Subscribe to the specific symbol's data array using shallow comparison
    // This prevents infinite loops by not creating new array references
    const symbolDataArray = useDataStore(
        useShallow((state: any) => state.data[symbol] as UnpackedData[] | undefined)
    );

    // Get the latest tick from the array (memoized to prevent unnecessary recalculations)
    const symbolData = useMemo(() => {
        if (!symbolDataArray || symbolDataArray.length === 0) return undefined;
        return symbolDataArray[symbolDataArray.length - 1];
    }, [symbolDataArray]);

    // Chart initialization and teardown
    useEffect(() => {
        if (!chartContainerRef.current) return;

        // Create a responsive chart bound to the container
        const chart = createChart(chartContainerRef.current, {
            autoSize: true,
            handleScroll: {
                mouseWheel: true, // Enable horizontal scroll with mouse wheel (using Shift)
                pressedMouseMove: true, // Enable horizontal drag with mouse press
                horzTouchDrag: true, // Enable horizontal touch scrolling on mobile
                vertTouchDrag: false, // Disable vertical touch scrolling
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true, // Enable scaling on the time axis (horizontal)
                    price: false, // Disable scaling on the price axis (vertical)
                },
                mouseWheel: true, // Disable scaling with mouse wheel
                pinch: false, // Disable pinch-to-zoom gestures
            },
        });

        // Configure a candlestick series with custom colors
        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        // Fit current data (if any) and scroll slightly to the right
        chart.timeScale().fitContent();
        // Note: scrollToPosition(distanceFromRight, animated)
        chart.timeScale().scrollToPosition(5, true);

        chartRef.current = chart;
        seriesRef.current = candleSeries;

        // Cleanup the chart on unmount to free resources and detach observers
        return () => {
            chart.remove();
        };
    }, []);

    // Stream real-time updates into the series whenever symbolData changes in Zustand
    useEffect(() => {
        // symbolData is reactively subscribed to this specific symbol
        if (!symbolData || !seriesRef.current) return;

        // Check if we have price data
        if (!symbolData.price) {
            console.warn('⚠️ No price data available');
            return;
        }

        // Check for duplicate timestamp to avoid redundant updates
        if (lastTsRef.current === symbolData.timestamp) {
            console.log('⏭️ Skipping duplicate timestamp:', symbolData.timestamp);
            return;
        }
        lastTsRef.current = symbolData.timestamp;

        // Normalize timestamp to milliseconds (handle both seconds and milliseconds from backend)
        // If timestamp is less than year 3000 in seconds (32503680000), it's likely in seconds
        let timestampMs = symbolData.timestamp;
        if (symbolData.timestamp < 32503680000) {
            // Timestamp is in seconds, convert to milliseconds
            timestampMs = symbolData.timestamp * 1000;
            console.log('⚠️ Converted timestamp from seconds to milliseconds:', symbolData.timestamp, '→', timestampMs);
        }

        // Get the timeframe in milliseconds
        const timeframeMs = timeframeToMs(timeframe);

        // Normalize timestamp to the start of the current timeframe bucket
        // For example, if timeframe is 5 minutes, timestamps get rounded down to 5-minute intervals
        const timeBucket = Math.floor(timestampMs / timeframeMs) * timeframeMs;

        // Convert to lightweight-charts Time format (seconds)
        const chartTime = Math.floor(timeBucket / 1000) as Time;

        // Check if we're in a new time bucket
        const isNewBucket = currentTimeBucketRef.current !== timeBucket;

        console.log('📊 Chart Update:', {
            symbol,
            rawTimestamp: symbolData.timestamp,
            normalizedTimestamp: timestampMs,
            readableTime: new Date(timestampMs).toISOString(),
            timeframe: `${timeframe}m`,
            timeBucket,
            bucketTime: new Date(timeBucket).toISOString(),
            chartTime,
            previousBucket: currentTimeBucketRef.current ? new Date(currentTimeBucketRef.current).toISOString() : null,
            isNewBucket,
            totalCandles: candlesRef.current.size,
            price: symbolData.price
        });

        if (isNewBucket) {
            // Moving to a new candle - use LTP for all OHLC values initially
            currentTimeBucketRef.current = timeBucket;
            setCurrentBucketTime(timeBucket);

            const newCandle: CandlestickData = {
                time: chartTime,
                open: symbolData.price,
                high: symbolData.price,
                low: symbolData.price,
                close: symbolData.price
            };

            // Store it
            candlesRef.current.set(timeBucket, newCandle);
            setCandleCount(candlesRef.current.size);

            // Use update() to add the new candle
            // According to docs: update() will create a new bar if the time is newer
            seriesRef.current.update(newCandle);

            console.log(`🆕 New candle created at ${new Date(timeBucket).toISOString()}`, newCandle);
        } else {
            // Same time bucket - update the existing candle with new LTP
            const existingCandle = candlesRef.current.get(timeBucket);

            if (existingCandle) {
                const updatedCandle: CandlestickData = {
                    time: chartTime,
                    open: existingCandle.open, // Keep original open (first price in bucket)
                    high: Math.max(existingCandle.high as number, symbolData.price),
                    low: Math.min(existingCandle.low as number, symbolData.price),
                    close: symbolData.price // Update to latest price
                };

                // Store updated candle
                candlesRef.current.set(timeBucket, updatedCandle);

                // Use update() to modify the last bar
                seriesRef.current.update(updatedCandle);

                console.log(`📝 Updated existing candle`, {
                    time: new Date(timeBucket).toISOString(),
                    changes: {
                        high: `${existingCandle.high} → ${updatedCandle.high}`,
                        low: `${existingCandle.low} → ${updatedCandle.low}`,
                        close: `${existingCandle.close} → ${updatedCandle.close}`
                    }
                });
            }
        }

        // Auto-scroll to show the latest candle
        if (chartRef.current && isNewBucket) {
            chartRef.current.timeScale().scrollToRealTime();
        }

    }, [symbolData, timeframe, symbol]);

    // Rebuild candles when timeframe changes using ALL historical data
    useEffect(() => {
        if (!seriesRef.current) return;

        console.log(`⚙️ Timeframe changed to ${timeframe} minutes - rebuilding candles from historical data`);

        // Clear the candles map
        candlesRef.current.clear();

        // Reset tracking refs
        lastTsRef.current = null;
        currentTimeBucketRef.current = null;

        // Get ALL historical data for this symbol directly from the store
        const allHistoricalData = useDataStore.getState().data[symbol] || [];

        // Validate that we have an array
        if (!Array.isArray(allHistoricalData) || allHistoricalData.length === 0) {
            // No historical data, just clear the chart
            seriesRef.current.setData([]);
            setCandleCount(0);
            setCurrentBucketTime(null);
            console.log(`No historical data to rebuild (received: ${typeof allHistoricalData}, length: ${Array.isArray(allHistoricalData) ? allHistoricalData.length : 'N/A'})`);
            return;
        }

        console.log(`📦 Processing ${allHistoricalData.length} historical ticks`);

        // Get the timeframe in milliseconds
        const timeframeMs = timeframeToMs(timeframe);

        // Process all historical data and aggregate into candles
        allHistoricalData.forEach((tick) => {
            // Skip ticks without price data
            if (!tick.price) return;

            // Normalize timestamp to milliseconds
            let timestampMs = tick.timestamp;
            if (tick.timestamp < 32503680000) {
                timestampMs = tick.timestamp * 1000;
            }

            // Normalize timestamp to the start of the current timeframe bucket
            const timeBucket = Math.floor(timestampMs / timeframeMs) * timeframeMs;
            const chartTime = Math.floor(timeBucket / 1000) as Time;

            // Get or create the candle for this time bucket
            const existingCandle = candlesRef.current.get(timeBucket);

            if (existingCandle) {
                // Update existing candle: keep open, update high/low/close
                const updatedCandle: CandlestickData = {
                    time: chartTime,
                    open: existingCandle.open, // Keep first price as open
                    high: Math.max(existingCandle.high as number, tick.price),
                    low: Math.min(existingCandle.low as number, tick.price),
                    close: tick.price // Use latest price as close
                };
                candlesRef.current.set(timeBucket, updatedCandle);
            } else {
                // New candle: use LTP for all OHLC values initially
                const newCandle: CandlestickData = {
                    time: chartTime,
                    open: tick.price,
                    high: tick.price,
                    low: tick.price,
                    close: tick.price
                };
                candlesRef.current.set(timeBucket, newCandle);
            }
        });

        // Convert Map to sorted array
        const allCandles = Array.from(candlesRef.current.values()).sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : 0;
            const timeB = typeof b.time === 'number' ? b.time : 0;
            return timeA - timeB;
        });

        // Set all candles to the chart
        seriesRef.current.setData(allCandles);
        setCandleCount(allCandles.length);

        // Update current bucket to the last candle
        if (allCandles.length > 0) {
            const lastCandle = allCandles[allCandles.length - 1];
            const lastTime = (lastCandle.time as number) * 1000; // Convert back to ms
            currentTimeBucketRef.current = lastTime;
            setCurrentBucketTime(lastTime);
        }

        console.log(`✅ Rebuilt ${allCandles.length} candles for ${timeframe}m timeframe`);

        // Fit content and scroll to latest
        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
            chartRef.current.timeScale().scrollToRealTime();
        }

    }, [timeframe, symbol]); // Rebuild when timeframe or symbol changes

    /**
     * Handle timeframe change
     */
    const handleTimeframeChange = (newTimeframe: Timeframe) => {
        setTimeframe(newTimeframe);
    };

    return (
        <div className="space-y-2">
            {/* Timeframe selector */}
            <div className="flex flex-wrap gap-2 p-2 bg-white rounded-lg shadow border border-gray-200">
                <span className="font-semibold text-gray-700 my-auto">Timeframe:</span>
                {Object.entries(TIMEFRAMES).map(([key, value]) => (
                    <button
                        key={key}
                        onClick={() => handleTimeframeChange(value)}
                        className={`px-3 py-1 rounded transition-colors ${
                            timeframe === value
                                ? 'bg-blue-500 text-white font-semibold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {key.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                ))}
            </div>

            {/* Debug panel */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-sm font-mono">
                <div className="font-bold text-blue-900 mb-2">Debug Info ({symbol}):</div>
                <div className="grid grid-cols-2 gap-2 text-blue-800">
                    <div>Candles in memory: <span className="font-bold">{candleCount}</span></div>
                    <div>Last update: <span className="font-bold">{symbolData?.timestamp ? new Date(symbolData.timestamp).toLocaleTimeString() : 'N/A'}</span></div>
                    <div>Current bucket: <span className="font-bold">{currentBucketTime ? new Date(currentBucketTime).toLocaleTimeString() : 'N/A'}</span></div>
                    <div>Timeframe: <span className="font-bold">{timeframe} min</span></div>
                </div>
            </div>

            {/* Chart container */}
            <div
                ref={chartContainerRef}
                style={{height: 600, width: '100%'}}
                className="bg-gray-50 rounded-lg shadow-lg border border-gray-200 p-2"
            />
        </div>
    );
};

export default Chart;