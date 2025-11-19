// Chart.tsx
// A lightweight-charts candlestick chart that streams OHLC updates from a local DataService
// and renders them in near real-time using series.update(). The chart auto-sizes to its
// container, colors bullish/bearish candles, and keeps the viewport scrolled to the right.
import { useEffect, useRef, useState, useMemo } from 'react';
import { type CandlestickData, CandlestickSeries, createChart, type Time, ColorType } from 'lightweight-charts';
import { useDataStore } from '../services/dataService';
import { useShallow } from 'zustand/react/shallow';
import type { UnpackedData } from "../utils/utils.ts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
const Chart = ({ symbol }: ChartProps) => {
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
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            autoSize: true,
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
                horzTouchDrag: true,
                vertTouchDrag: false,
            },
            handleScale: {
                axisPressedMouseMove: {
                    time: true,
                    price: false,
                },
                mouseWheel: true,
                pinch: false,
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
        chart.timeScale().scrollToPosition(5, true);

        chartRef.current = chart;
        seriesRef.current = candleSeries;

        // Resize observer to handle container resizing
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) { return; }
            const newRect = entries[0].contentRect;
            chart.applyOptions({ width: newRect.width, height: newRect.height });
        });

        resizeObserver.observe(chartContainerRef.current);

        // Cleanup the chart on unmount to free resources and detach observers
        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // Stream real-time updates into the series whenever symbolData changes in Zustand
    useEffect(() => {
        if (!symbolData || !seriesRef.current) return;

        if (!symbolData.price) {
            return;
        }

        if (lastTsRef.current === symbolData.timestamp) {
            return;
        }
        lastTsRef.current = symbolData.timestamp;

        let timestampMs = symbolData.timestamp;
        if (symbolData.timestamp < 32503680000) {
            timestampMs = symbolData.timestamp * 1000;
        }

        const timeframeMs = timeframeToMs(timeframe);
        const timeBucket = Math.floor(timestampMs / timeframeMs) * timeframeMs;
        const chartTime = Math.floor(timeBucket / 1000) as Time;
        const isNewBucket = currentTimeBucketRef.current !== timeBucket;

        if (isNewBucket) {
            currentTimeBucketRef.current = timeBucket;
            setCurrentBucketTime(timeBucket);

            const newCandle: CandlestickData = {
                time: chartTime,
                open: symbolData.price,
                high: symbolData.price,
                low: symbolData.price,
                close: symbolData.price
            };

            candlesRef.current.set(timeBucket, newCandle);
            setCandleCount(candlesRef.current.size);
            seriesRef.current.update(newCandle);
        } else {
            const existingCandle = candlesRef.current.get(timeBucket);

            if (existingCandle) {
                const updatedCandle: CandlestickData = {
                    time: chartTime,
                    open: existingCandle.open,
                    high: Math.max(existingCandle.high as number, symbolData.price),
                    low: Math.min(existingCandle.low as number, symbolData.price),
                    close: symbolData.price
                };

                candlesRef.current.set(timeBucket, updatedCandle);
                seriesRef.current.update(updatedCandle);
            }
        }

        if (chartRef.current && isNewBucket) {
            chartRef.current.timeScale().scrollToRealTime();
        }

    }, [symbolData, timeframe, symbol]);

    // Rebuild candles when timeframe changes using ALL historical data
    useEffect(() => {
        if (!seriesRef.current) return;

        candlesRef.current.clear();
        lastTsRef.current = null;
        currentTimeBucketRef.current = null;

        const allHistoricalData = useDataStore.getState().data[symbol] || [];

        if (!Array.isArray(allHistoricalData) || allHistoricalData.length === 0) {
            seriesRef.current.setData([]);
            setCandleCount(0);
            setCurrentBucketTime(null);
            return;
        }

        const timeframeMs = timeframeToMs(timeframe);

        allHistoricalData.forEach((tick) => {
            if (!tick.price) return;

            let timestampMs = tick.timestamp;
            if (tick.timestamp < 32503680000) {
                timestampMs = tick.timestamp * 1000;
            }

            const timeBucket = Math.floor(timestampMs / timeframeMs) * timeframeMs;
            const chartTime = Math.floor(timeBucket / 1000) as Time;

            const existingCandle = candlesRef.current.get(timeBucket);

            if (existingCandle) {
                const updatedCandle: CandlestickData = {
                    time: chartTime,
                    open: existingCandle.open,
                    high: Math.max(existingCandle.high as number, tick.price),
                    low: Math.min(existingCandle.low as number, tick.price),
                    close: tick.price
                };
                candlesRef.current.set(timeBucket, updatedCandle);
            } else {
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

        const allCandles = Array.from(candlesRef.current.values()).sort((a, b) => {
            const timeA = typeof a.time === 'number' ? a.time : 0;
            const timeB = typeof b.time === 'number' ? b.time : 0;
            return timeA - timeB;
        });

        seriesRef.current.setData(allCandles);
        setCandleCount(allCandles.length);

        if (allCandles.length > 0) {
            const lastCandle = allCandles[allCandles.length - 1];
            const lastTime = (lastCandle.time as number) * 1000;
            currentTimeBucketRef.current = lastTime;
            setCurrentBucketTime(lastTime);
        }

        if (chartRef.current) {
            chartRef.current.timeScale().fitContent();
            chartRef.current.timeScale().scrollToRealTime();
        }

    }, [timeframe, symbol]);

    const handleTimeframeChange = (value: string) => {
        setTimeframe(Number(value) as Timeframe);
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-lg font-medium text-foreground">
                    {symbol} Chart
                </div>
                <Tabs
                    value={String(timeframe)}
                    onValueChange={handleTimeframeChange}
                    className="w-auto"
                >
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-8">
                        {Object.entries(TIMEFRAMES).map(([key, value]) => (
                            <TabsTrigger
                                key={key}
                                value={String(value)}
                                className="text-xs px-2 h-6"
                            >
                                {key === 'ONE_MINUTE' ? '1m' :
                                    key === 'FIVE_MINUTES' ? '5m' :
                                        key === 'FIFTEEN_MINUTES' ? '15m' :
                                            key === 'THIRTY_MINUTES' ? '30m' :
                                                key === 'ONE_HOUR' ? '1h' :
                                                    key === 'FOUR_HOURS' ? '4h' : '1d'}
                            </TabsTrigger>
                        ))}
                    </TabsList>
                </Tabs>
            </div>

            <div className="relative h-[500px] w-full border rounded-md overflow-hidden bg-background shadow-sm">
                <div
                    ref={chartContainerRef}
                    className="absolute inset-0"
                />
            </div>

            {/* Subtle status bar */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1 font-normal">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                </Badge>
                <div>
                    Candles: <span className="font-medium text-foreground">{candleCount}</span>
                </div>
                <div>
                    Last Update: <span className="font-medium text-foreground">
                        {symbolData?.timestamp ? new Date(symbolData.timestamp < 32503680000 ? symbolData.timestamp * 1000 : symbolData.timestamp).toLocaleTimeString() : '--:--:--'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Chart;