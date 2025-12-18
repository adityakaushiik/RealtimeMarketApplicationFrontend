// Chart.tsx
// A lightweight-charts candlestick chart that displays historical data from API
// and streams live updates from WebSocket.
import { useEffect, useRef, useState, useMemo } from 'react';
import { type CandlestickData, CandlestickSeries, HistogramSeries, createChart, ColorType, TickMarkType, type Time, type HistogramData } from 'lightweight-charts';
import { useDataStore, type MarketData } from '../shared/services/dataService';
import { useShallow } from 'zustand/react/shallow';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { WebSocketMessageType } from '../shared/utils/CommonConstants';
import { ApiService } from '../shared/services/apiService';
import { WebSocketService } from '../shared/services/websocketService';
import { parseApiData, aggregateCandles, updateLiveCandle } from '../shared/utils/chartUtils';

/**
 * Timeframe constants for chart intervals (in minutes)
 */
const TIMEFRAMES = {
    // ONE_MINUTE: 1,
    FIVE_MINUTES: 5,
    FIFTEEN_MINUTES: 15,
    THIRTY_MINUTES: 30,
    ONE_HOUR: 60,
    FOUR_HOURS: 240,
    ONE_DAY: 1440
} as const;

type Timeframe = typeof TIMEFRAMES[keyof typeof TIMEFRAMES];

/**
 * Helper to extract price from MarketData
 */
const getPrice = (data: MarketData): number | undefined => {
    if (data.type === WebSocketMessageType.UPDATE) {
        return (data as any).price;
    }
    if (data.type === WebSocketMessageType.SNAPSHOT) {
        return (data as any).close;
    }
    // Fallback for legacy or incomplete data
    if ('price' in data) return (data as any).price;
    if ('close' in data) return (data as any).close;
    return undefined;
};

/**
 * Helper to extract volume from MarketData
 */
const getVolume = (data: MarketData): number => {
    if (data.type === WebSocketMessageType.UPDATE) {
        return (data as any).volume ?? 0;
    }
    // For snapshot, volume is usually cumulative for the day. 
    // Adding it to a single candle would create a massive spike.
    // We return 0 for snapshot to be safe for incremental accumulation.
    return 0;
};

interface ChartProps {
    symbol: string;
}

const Chart = ({ symbol }: ChartProps) => {
    // --- State ---
    const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES.ONE_DAY);
    const [isLoading, setIsLoading] = useState(false);
    const [candleCount, setCandleCount] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--:--');

    // --- Refs ---
    const intradayCacheRef = useRef<{ symbol: string; data: any[] } | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);
    const volumeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);

    // Track the last candle and volume to properly merge live updates
    const lastCandleRef = useRef<CandlestickData | null>(null);
    const lastVolumeRef = useRef<HistogramData | null>(null);

    // --- Data Store Subscription ---
    // Subscribe to the specific symbol's data for live updates
    const symbolDataArray = useDataStore(
        useShallow((state: any) => state.data[symbol] as MarketData[] | undefined)
    );

    // Get the latest tick (memoized)
    const latestTick = useMemo(() => {
        if (!symbolDataArray || symbolDataArray.length === 0) return undefined;
        return symbolDataArray[symbolDataArray.length - 1];
    }, [symbolDataArray]);

    // --- Chart Initialization ---
    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: 'transparent' },
                textColor: '#333',
            },
            grid: {
                vertLines: { color: '#f0f3fa' },
                horzLines: { color: '#f0f3fa' },
            },
            autoSize: false,
            localization: {
                locale: navigator.language,
                timeFormatter: (time: number) => {
                    if (typeof time !== 'number') return String(time);
                    return new Date(time * 1000).toLocaleString();
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: Time, tickMarkType: TickMarkType, locale: string) => {
                    const date = (typeof time === 'number') ? new Date(time * 1000) : null;

                    if (!date) {
                        if (typeof time === 'string') return time;
                        // Handle BusinessDay object { year, month, day }
                        const businessDay = time as { year: number; month: number; day: number };
                        return `${businessDay.year}-${String(businessDay.month).padStart(2, '0')}-${String(businessDay.day).padStart(2, '0')}`;
                    }

                    switch (tickMarkType) {
                        case TickMarkType.Year:
                            return date.toLocaleDateString(locale, { year: 'numeric' });
                        case TickMarkType.Month:
                            return date.toLocaleDateString(locale, { month: 'short' });
                        case TickMarkType.DayOfMonth:
                            return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
                        case TickMarkType.Time:
                            return date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' });
                        case TickMarkType.TimeWithSeconds:
                            return date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric', second: 'numeric' });
                        default:
                            return date.toLocaleString(locale);
                    }
                }
            },
        });

        const candleSeries = chart.addSeries(CandlestickSeries, {
            upColor: '#26a69a',
            downColor: '#ef5350',
            borderVisible: false,
            wickUpColor: '#26a69a',
            wickDownColor: '#ef5350',
        });

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // Overlay
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8, // Reserve top 80% for price, so volume uses bottom 20%
                bottom: 0,
            },
        });

        chartRef.current = chart;
        seriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Resize observer
        const resizeObserver = new ResizeObserver(entries => {
            if (entries.length === 0 || entries[0].target !== chartContainerRef.current) return;
            const newRect = entries[0].contentRect;
            chart.applyOptions({ width: newRect.width, height: newRect.height });
        });
        resizeObserver.observe(chartContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            chart.remove();
        };
    }, []);

    // --- Historical Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            if (!seriesRef.current) return;

            setIsLoading(true);
            try {
                let rawData;
                // Fetch appropriate data based on timeframe
                if (timeframe === TIMEFRAMES.ONE_DAY) {
                    rawData = await ApiService.getDailyPrices(symbol);
                } else {
                    // Check cache for intraday data
                    if (intradayCacheRef.current && intradayCacheRef.current.symbol === symbol) {
                        rawData = intradayCacheRef.current.data;
                    } else {
                        rawData = await ApiService.getIntradayPrices(symbol);
                        intradayCacheRef.current = { symbol, data: rawData };
                    }
                }

                // Parse and process data
                let { candles, volumes } = parseApiData(rawData);

                // Aggregate if needed (for intraday timeframes > 1m)
                if (timeframe !== TIMEFRAMES.ONE_DAY) {
                    const aggregated = aggregateCandles(candles, volumes, timeframe);
                    candles = aggregated.candles;
                    volumes = aggregated.volumes;
                }

                seriesRef.current.setData(candles);
                if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.setData(volumes);
                }

                // Update state refs
                lastCandleRef.current = candles.length > 0 ? candles[candles.length - 1] : null;
                lastVolumeRef.current = volumes.length > 0 ? volumes[volumes.length - 1] : null;
                setCandleCount(candles.length);

                // Fit content
                if (chartRef.current) {
                    chartRef.current.timeScale().fitContent();
                }
            } catch (error) {
                console.error("Failed to fetch chart data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [symbol, timeframe]);

    // --- WebSocket Subscription ---
    useEffect(() => {
        // Ensure we are subscribed to the symbol
        WebSocketService.sendMessage({
            message_type: WebSocketMessageType.SUBSCRIBE,
            channel: symbol,
            type: 'ltp' // We need ticks for the chart
        });

        return () => {
            // Optional: Unsubscribe on unmount or symbol change
            // Note: If other components use this symbol, we might not want to unsubscribe immediately.
            // But for correctness of this component:
            WebSocketService.sendMessage({
                message_type: WebSocketMessageType.UNSUBSCRIBE,
                channel: symbol,
            });
        };
    }, [symbol]);

    // --- Live Updates ---
    useEffect(() => {
        if (!latestTick || !seriesRef.current) return;

        const price = getPrice(latestTick);
        if (price === undefined || price === 0 || price === null) return;
        const volume = getVolume(latestTick);



        let timestamp = latestTick.timestamp ? Number(latestTick.timestamp) : Date.now() / 1000;

        // Ensure timestamp is in seconds for chartUtils
        if (timestamp > 32503680000) { // If > year 3000 in seconds, it's ms
            timestamp = timestamp / 1000;
        }

        // FIX: Although the user confirmed the backend sends UTC (via API historical data),
        // the live tick timestamps result in a double-timezone offset when displayed (e.g., 20:15 instead of 14:45).
        // This implies the live timestamp value effectively acts like "Local Time interpreted as UTC".
        // To align live ticks with historical data and correct local time display, we subtract the timezone offset.
        // ex: IST is UTC+5:30. getTimezoneOffset() is -330 minutes.
        // Timestamp (Local-as-UTC) + Offset (negative) = True UTC.
        // Display: True UTC + Local Offset = Real Local Time.
        const offsetSeconds = new Date().getTimezoneOffset() * 60;
        timestamp = timestamp + offsetSeconds;

        const { candle, volumeData, isNew } = updateLiveCandle(
            lastCandleRef.current,
            lastVolumeRef.current,
            price,
            volume,
            timestamp,
            timeframe
        );

        seriesRef.current.update(candle);
        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update(volumeData);
        }

        lastCandleRef.current = candle;
        lastVolumeRef.current = volumeData;

        if (isNew) {
            setCandleCount(prev => prev + 1);
        }

        setLastUpdateTime(new Date().toLocaleTimeString());

    }, [latestTick, timeframe]);

    // --- Handlers ---
    const handleTimeframeChange = (value: string) => {
        setTimeframe(Number(value) as Timeframe);
    };

    return (
        <div className="w-full space-y-2">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-foreground">{symbol} Chart</span>
                    {isLoading && <span className="text-xs text-muted-foreground animate-pulse">Loading...</span>}
                </div>

                <Tabs
                    value={String(timeframe)}
                    onValueChange={handleTimeframeChange}
                    className="w-auto"
                >
                    <TabsList className="grid w-full grid-cols-6 h-8">
                        {Object.entries(TIMEFRAMES).map(([key, value]) => (
                            <TabsTrigger
                                key={key}
                                value={String(value)}
                                className="text-xs px-2 h-6"
                            >
                                {key === 'FIVE_MINUTES' ? '5m' :
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
                <div ref={chartContainerRef} className="absolute inset-0" />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <Badge variant="outline" className="gap-1 font-normal">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live
                </Badge>
                <div>
                    Candles: <span className="font-medium text-foreground">{candleCount}</span>
                </div>
                <div>
                    Last Update: <span className="font-medium text-foreground">{lastUpdateTime}</span>
                </div>
            </div>
        </div>
    );
};

export default Chart;