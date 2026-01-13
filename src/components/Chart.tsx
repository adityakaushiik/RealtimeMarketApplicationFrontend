// Chart.tsx
// A lightweight-charts candlestick chart that displays historical data from API
// and streams live updates from WebSocket.
import { useEffect, useRef, useState, useMemo } from 'react';
import { type CandlestickData, CandlestickSeries, HistogramSeries, createChart, ColorType, TickMarkType, type Time, type HistogramData } from 'lightweight-charts';
import { useDataStore, type MarketData } from '../shared/services/dataService';
import { useShallow } from 'zustand/react/shallow';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { WebSocketMessageType } from '../shared/utils/CommonConstants';
import { ApiService } from '../shared/services/apiService';
import { WebSocketService } from '../shared/services/websocketService';
import { parseApiData, aggregateCandles, updateLiveCandle } from '../shared/utils/chartUtils';
import { Loader2 } from "lucide-react";
import { useTheme } from './theme-provider';

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
    let price: number | undefined;
    if (data.type === WebSocketMessageType.UPDATE) {
        price = (data as any).price;
    } else if (data.type === WebSocketMessageType.SNAPSHOT) {
        price = (data as any).close;
    } else {
        // Fallback for legacy or incomplete data
        if ('price' in data) price = (data as any).price;
        else if ('close' in data) price = (data as any).close;
    }

    // Filter out invalid prices (backend sends -1 for unavailable data)
    if (price !== undefined && price !== -1) {
        return price;
    }
    return undefined;
};

/**
 * Helper to extract volume (delta) from MarketData
 * For UPDATE messages, we use the 'size' field which contains delta volume from backend
 */
const getVolume = (data: MarketData): number => {
    if (data.type === WebSocketMessageType.UPDATE) {
        return (data as any).size ?? 0; // Use size field for delta volume
    }
    // For snapshot, volume is usually cumulative for the day. 
    // Adding it to a single candle would create a massive spike.
    // We return 0 for snapshot to be safe for incremental accumulation.
    return 0;
};

interface ChartProps {
    symbol: string;
    currency?: string;
}

const Chart = ({ symbol }: ChartProps) => {
    // --- State ---
    const { theme } = useTheme();
    const [timeframe, setTimeframe] = useState<Timeframe>(TIMEFRAMES.ONE_DAY);
    const [isLoading, setIsLoading] = useState(false);
    const [candleCount, setCandleCount] = useState(0);
    const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
    const [currentPrice, setCurrentPrice] = useState<number | null>(null);

    // --- Data Store Subscription ---
    // Subscribe to the specific symbol's data for live updates
    const symbolDataArray = useDataStore(
        useShallow((state: any) => state.data[symbol] as MarketData[] | undefined)
    );

    const prevClose = useMemo(() => {
        if (!symbolDataArray) return undefined;
        // Find latest snapshot with valid prevClose
        for (let i = symbolDataArray.length - 1; i >= 0; i--) {
            const msg = symbolDataArray[i];
            if (msg.type === WebSocketMessageType.SNAPSHOT && 'prevClose' in msg) {
                const val = (msg as any).prevClose;
                if (val !== undefined && val !== -1) {
                    return val;
                }
            }
        }
        return undefined;
    }, [symbolDataArray]);

    const percentChange = useMemo(() => {
        if (currentPrice !== null && prevClose) {
            const change = currentPrice - prevClose;
            return (change / prevClose) * 100;
        }
        return null;
    }, [currentPrice, prevClose]);

    const isDark = useMemo(() => {
        if (theme === 'dark') return true;
        if (theme === 'light') return false;
        if (typeof window !== 'undefined') {
            return window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    }, [theme]);

    const isDarkRef = useRef(isDark);
    useEffect(() => {
        isDarkRef.current = isDark;
    }, [isDark]);

    // --- Refs ---
    const intradayCacheRef = useRef<{ symbol: string; data: any[] } | null>(null);
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
    const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);
    const volumeSeriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);

    // Track the last candle and volume to properly merge live updates
    const lastCandleRef = useRef<CandlestickData | null>(null);
    const lastVolumeRef = useRef<HistogramData | null>(null);


    // --- Legend & Hover State ---
    const isHovering = useRef(false);
    const legendRef = useRef<HTMLDivElement>(null);

    const formatVolume = (vol: number) => {
        if (!vol) return '0';
        if (vol >= 1000000000) return (vol / 1000000000).toFixed(2) + 'B';
        if (vol >= 1000000) return (vol / 1000000).toFixed(2) + 'M';
        if (vol >= 1000) return (vol / 1000).toFixed(2) + 'K';
        return vol.toString();
    };

    const updateLegendDOM = (candle: CandlestickData | undefined, volume: number | undefined) => {
        if (!legendRef.current) return;

        if (!candle) {
            legendRef.current.innerHTML = '';
            return;
        }

        const open = candle.open;
        const high = candle.high;
        const low = candle.low;
        const close = candle.close;
        const val = volume;

        const isUp = close >= open;
        const currentIsDark = isDarkRef.current; // Use Ref for fresh value

        const labelColor = currentIsDark ? '#9ca3af' : '#6b7280';
        const valueColor = currentIsDark ? '#e5e7eb' : '#111827';
        const valueColorDynamic = isUp ? '#26a69a' : '#ef5350';

        legendRef.current.innerHTML = `
            <div class="flex flex-wrap gap-3 text-xs sm:text-sm font-medium z-50 pointer-events-none select-none">
               <div class="flex items-center gap-1">
                    <span style="color: ${labelColor}">O</span>
                    <span style="color: ${valueColorDynamic}">${open.toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <span style="color: ${labelColor}">H</span>
                    <span style="color: ${valueColorDynamic}">${high.toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <span style="color: ${labelColor}">L</span>
                    <span style="color: ${valueColorDynamic}">${low.toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-1">
                    <span style="color: ${labelColor}">C</span>
                    <span style="color: ${valueColorDynamic}">${close.toFixed(2)}</span>
                </div>
                ${val !== undefined ? `
                <div class="flex items-center gap-1">
                    <span style="color: ${labelColor}">Vol</span>
                    <span style="color: ${valueColor}">${formatVolume(val)}</span>
                </div>` : ''}
            </div>
        `;
    };

    // --- Data Store Subscription ---
    // Subscribe to the specific symbol's data for live updates
    // (Moved to top of component)

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
            crosshair: {
                mode: 1 // CrosshairMode.Magnet
            }
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

        // Subscribe to crosshair move
        chart.subscribeCrosshairMove(param => {
            if (
                param.point === undefined ||
                !param.time ||
                param.point.x < 0 ||
                param.point.x > chartContainerRef.current!.clientWidth ||
                param.point.y < 0 ||
                param.point.y > chartContainerRef.current!.clientHeight
            ) {
                // Mouse leave or invalid point
                isHovering.current = false;
                if (lastCandleRef.current) {
                    const lastVol = lastVolumeRef.current ? lastVolumeRef.current.value : undefined;
                    updateLegendDOM(lastCandleRef.current, lastVol);
                } else {
                    updateLegendDOM(undefined, undefined);
                }
            } else {
                // Mouse hover
                isHovering.current = true;
                const candleData = param.seriesData.get(candleSeries) as CandlestickData | undefined;
                const volumeData = param.seriesData.get(volumeSeries) as HistogramData | undefined;
                const vol = volumeData ? volumeData.value : undefined;

                if (candleData) {
                    updateLegendDOM(candleData, vol);
                }
            }
        });

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

    // --- Theme Updates ---
    useEffect(() => {
        if (!chartRef.current) return;

        const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : '#f0f3fa';
        const textColor = isDark ? '#9ca3af' : '#333';

        chartRef.current.applyOptions({
            layout: {
                textColor,
            },
            grid: {
                vertLines: { color: gridColor },
                horzLines: { color: gridColor },
            },
        });
    }, [isDark]);

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
                if (candles.length > 0) {
                    setCurrentPrice(candles[candles.length - 1].close);
                }

                // Initial Legend Update (Historical)
                if (lastCandleRef.current && !isHovering.current) {
                    const lastVol = lastVolumeRef.current ? lastVolumeRef.current.value : undefined;
                    updateLegendDOM(lastCandleRef.current, lastVol);
                }


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

        // getVolume now returns delta volume directly from backend's 'size' field
        const deltaVolume = getVolume(latestTick);

        let timestamp = latestTick.timestamp ? Number(latestTick.timestamp) : Date.now() / 1000;

        // Ensure timestamp is in seconds for chartUtils
        if (timestamp > 32503680000) { // If > year 3000 in seconds, it's ms
            timestamp = timestamp / 1000;
        }

        // No manual timezone offset needed. We assume backend sends standard Unix timestamps (UTC).
        // The chart library handles local time conversion for display.

        const { candle, volumeData, isNew } = updateLiveCandle(
            lastCandleRef.current,
            lastVolumeRef.current,
            price,
            deltaVolume,
            timestamp,
            timeframe
        );

        seriesRef.current.update(candle);
        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.update(volumeData);
        }

        lastCandleRef.current = candle;
        lastVolumeRef.current = volumeData;
        setCurrentPrice(candle.close);

        // Update Legend if not hovering
        if (!isHovering.current) {
            updateLegendDOM(candle, volumeData ? volumeData.value : undefined);
        }

        if (isNew) {

            setCandleCount(prev => prev + 1);
        }

        setLastUpdateTime(new Date(timestamp * 1000));

    }, [latestTick, timeframe]);

    // --- Handlers ---
    const handleTimeframeChange = (value: string) => {
        setTimeframe(Number(value) as Timeframe);
    };

    const [isMarketOpen, setIsMarketOpen] = useState(false);

    // --- Market Status Check ---
    useEffect(() => {
        let intervalId: ReturnType<typeof setInterval>;

        const checkMarketStatus = async () => {
            try {
                const instrument = await ApiService.getInstrumentBySymbol(symbol);
                if (!instrument) return;

                const exchange = await ApiService.getExchangeById(instrument.exchange_id);
                if (!exchange || !exchange.timezone || !exchange.market_open_time || !exchange.market_close_time) {
                    setIsMarketOpen(false);
                    return;
                }

                const checkTime = () => {
                    try {
                        const now = new Date();

                        // Parse Exchange Times
                        // Assuming format "HH:MM:SS"
                        const [openH, openM] = exchange.market_open_time!.split(':').map(Number);
                        const [closeH, closeM] = exchange.market_close_time!.split(':').map(Number);

                        // Get current time in Exchange Timezone
                        const nowInExchangeStr = now.toLocaleTimeString('en-US', {
                            timeZone: exchange.timezone!,
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        });
                        const [nowH, nowM] = nowInExchangeStr.split(':').map(Number);

                        // Create comparable numbers (minutes from midnight)
                        const currentMinutes = nowH * 60 + nowM;
                        const openMinutes = openH * 60 + openM;
                        const closeMinutes = closeH * 60 + closeM;

                        // Check if weekday (0=Sun, 6=Sat) - simplistic check, holidays not covered here yet
                        const dayOfWeek = new Date(now.toLocaleString('en-US', { timeZone: exchange.timezone! })).getDay();
                        const isWeekday = dayOfWeek !== 0 && dayOfWeek !== 6;

                        if (isWeekday && currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
                            setIsMarketOpen(true);
                        } else {
                            setIsMarketOpen(false);
                        }
                    } catch (e) {
                        console.error("Error checking market time:", e);
                        setIsMarketOpen(false);
                    }
                };

                checkTime();
                // Re-check every minute
                intervalId = setInterval(checkTime, 60000);

            } catch (error) {
                console.error("Failed to fetch market info:", error);
                setIsMarketOpen(false);
            }
        };

        checkMarketStatus();

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [symbol]);

    return (
        <div className="w-full space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        {isMarketOpen && (
                            <Badge variant="outline" className="gap-1 font-normal text-[10px] sm:text-xs px-2 h-6 border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                Live
                            </Badge>
                        )}
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold tracking-tight text-foreground">
                                {currentPrice ? currentPrice.toFixed(2) : '--'}
                            </span>
                            {percentChange !== null && (
                                <span className={`text-sm font-medium ${percentChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                    {percentChange >= 0 ? '+' : ''}{percentChange.toFixed(2)}%
                                </span>
                            )}
                            {isLoading && <span className="text-[10px] sm:text-xs text-muted-foreground animate-pulse ml-2">Loading...</span>}
                        </div>
                    </div>
                </div>

                <Tabs
                    value={String(timeframe)}
                    onValueChange={handleTimeframeChange}
                    className="w-full sm:w-auto"
                >
                    <TabsList className="grid w-full sm:w-auto grid-cols-6 h-7 sm:h-8">
                        {Object.entries(TIMEFRAMES).map(([key, value]) => (
                            <TabsTrigger
                                key={key}
                                value={String(value)}
                                className="text-[10px] sm:text-xs px-1 sm:px-2 h-5 sm:h-6"
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

            <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full border rounded-md overflow-hidden bg-background shadow-sm">
                <div ref={legendRef} className="absolute top-2 left-2 z-20 pointer-events-none" />
                <div ref={chartContainerRef} className="absolute inset-0" />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10 backdrop-blur-[1px]">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                <div>
                    Candles: <span className="font-medium text-foreground">{candleCount}</span>
                </div>
                <div className="hidden sm:block">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div className="cursor-help flex items-center gap-1">
                                    Last Updated:
                                    <span className="font-medium text-foreground">
                                        {lastUpdateTime ? lastUpdateTime.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'} IST
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    {lastUpdateTime ? lastUpdateTime.toLocaleString('en-IN', {
                                        timeZone: 'Asia/Kolkata',
                                        day: '2-digit', month: 'short', year: 'numeric',
                                        hour: '2-digit', minute: '2-digit', second: '2-digit',
                                        hour12: false
                                    }) : ''} IST
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
        </div>
    );
};

export default Chart;