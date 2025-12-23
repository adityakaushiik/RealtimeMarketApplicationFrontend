import { useEffect, useRef, useState, useMemo } from 'react';
import { useDataStore, type MarketData } from '@/shared/services/dataService';
import { WebSocketService, useWebSocketStore, type WebSocketState } from '@/shared/services/websocketService';
import { useShallow } from 'zustand/react/shallow';
import { WebSocketMessageType } from '@/shared/utils/CommonConstants';
import { useAppStore } from '@/shared/store/appStore';

interface InstrumentPriceDeferredProps {
    /**
     * The symbol/instrument to subscribe to and display price for
     */
    symbol: string;

    /**
     * Optional className for styling the component
     */
    className?: string;

    /**
     * Optional callback when visibility changes
     */
    onVisibilityChange?: (isVisible: boolean) => void;

    /**
     * Threshold for intersection observer (0-1)
     * Default: 0.1 (10% of element must be visible)
     */
    threshold?: number;
}

/**
 * InstrumentPriceDeferred Component
 * 
 * A price display component that intelligently manages WebSocket subscriptions
 * based on viewport visibility using the Intersection Observer API.
 * 
 * Features:
 * - Automatically subscribes to WebSocket when component enters viewport
 * - Automatically unsubscribes when component leaves viewport
 * - Displays real-time price updates from DataService
 * - Optimized for performance in long lists (e.g., watchlists)
 * 
 * @example
 * ```tsx
 * <InstrumentPriceDeferred 
 *   symbol="AAPL" 
 *   className="text-lg font-bold"
 *   onVisibilityChange={(visible) => console.log('Visible:', visible)}
 * />
 * ```
 */
const InstrumentPriceDeferred = ({
    symbol,
    className = '',
    onVisibilityChange,
    threshold = 0.1,
}: InstrumentPriceDeferredProps) => {
    // Reference to the container element for intersection observer
    const containerRef = useRef<HTMLDivElement>(null);

    // Track visibility state
    const [isVisible, setIsVisible] = useState(false);

    // Track subscription state
    const isSubscribedRef = useRef(false);

    // Subscribe to the specific symbol's data array using shallow comparison
    const symbolDataArray = useDataStore(
        useShallow((state: any) => state.data[symbol] as MarketData[] | undefined)
    );

    const { previousCloseMap } = useAppStore();
    const previousClose = previousCloseMap[symbol];

    // Get the latest price from the array (memoized to prevent unnecessary recalculations)
    const latestData = useMemo(() => {
        if (!symbolDataArray || symbolDataArray.length === 0) return undefined;
        return symbolDataArray[symbolDataArray.length - 1];
    }, [symbolDataArray]);

    // Helper to extract price from MarketData
    const getPrice = (data: MarketData | undefined): number | undefined => {
        if (!data) return previousClose;
        if ('price' in data) return data.price;
        if ('close' in data) return data.close;
        return previousClose;
    };

    // Format price for display
    const formattedPrice = useMemo(() => {
        const price = getPrice(latestData);
        if (price === undefined) return '--';
        return price.toFixed(2);
    }, [latestData, previousClose]);

    // Calculate price change color (if we have previous data)
    const priceChangeColor = useMemo(() => {
        if (!symbolDataArray || symbolDataArray.length < 2) return 'text-muted-foreground';

        const currentPrice = getPrice(symbolDataArray[symbolDataArray.length - 1]);
        const previousPrice = getPrice(symbolDataArray[symbolDataArray.length - 2]);

        if (currentPrice === undefined || previousPrice === undefined) return 'text-muted-foreground';

        if (currentPrice > previousPrice) return 'text-green-600';
        if (currentPrice < previousPrice) return 'text-red-600';
        return 'text-muted-foreground';
    }, [symbolDataArray]);

    const changePercentage = useMemo(() => {
        const currentPrice = getPrice(latestData);
        if (currentPrice === undefined || !previousClose) return undefined;
        return ((currentPrice - previousClose) / previousClose) * 100;
    }, [latestData, previousClose]);

    const formattedChange = useMemo(() => {
        if (changePercentage === undefined) return '';
        const sign = changePercentage >= 0 ? '+' : '';
        return `${sign}${changePercentage.toFixed(2)}%`;
    }, [changePercentage]);

    const changeColor = useMemo(() => {
        if (changePercentage === undefined) return 'text-muted-foreground';
        return changePercentage >= 0 ? 'text-green-600' : 'text-red-600';
    }, [changePercentage]);

    // Set up Intersection Observer to detect viewport visibility
    useEffect(() => {
        const element = containerRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const visible = entry.isIntersecting;
                    setIsVisible(visible);

                    // Notify parent component of visibility change
                    onVisibilityChange?.(visible);

                    console.log(`📊 [${symbol}] Visibility changed:`, visible);
                });
            },
            {
                threshold,
                // Optional: Add root margin to preload slightly before visible
                rootMargin: '50px',
            }
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [symbol, threshold, onVisibilityChange]);

    const isConnected = useWebSocketStore(useShallow((state: WebSocketState) => state.isConnected));

    // Handle WebSocket subscription based on visibility and connection status
    useEffect(() => {
        if (isVisible && isConnected && !isSubscribedRef.current) {
            // Subscribe to WebSocket for this symbol
            console.log(`🔌 [${symbol}] Subscribing to WebSocket`);

            // Send subscription message to WebSocket
            WebSocketService.sendMessage({
                message_type: WebSocketMessageType.SUBSCRIBE,
                channel: symbol,
                type: 'ltp', // or 'ohlcv' depending on your needs
            });

            isSubscribedRef.current = true;
        } else if ((!isVisible || !isConnected) && isSubscribedRef.current) {
            // Unsubscribe from WebSocket for this symbol
            // Only attempt to send message if connected
            if (isConnected) {
                console.log(`🔌 [${symbol}] Unsubscribing from WebSocket`);
                WebSocketService.sendMessage({
                    message_type: WebSocketMessageType.UNSUBSCRIBE,
                    channel: symbol,
                });
            } else {
                console.log(`🔌 [${symbol}] Connection lost, resetting subscription state`);
            }

            isSubscribedRef.current = false;
        }
    }, [isVisible, symbol, isConnected]);

    // Cleanup: Unsubscribe on unmount
    useEffect(() => {
        return () => {
            if (isSubscribedRef.current) {
                console.log(`🔌 [${symbol}] Unsubscribing on unmount`);
                WebSocketService.sendMessage({
                    message_type: WebSocketMessageType.UNSUBSCRIBE,
                    channel: symbol,
                });
                isSubscribedRef.current = false;
            }
        };
    }, [symbol]);

    return (
        <div
            ref={containerRef}
            className={`inline-flex items-center gap-2 ${className}`}
        >
            <div className="flex flex-col items-end gap-0.5 leading-[16px]">
                {/* Price Display */}
                <span className={`font-mono font-semibold transition-colors duration-200 ${priceChangeColor}`}>
                    {formattedPrice}
                </span>
                {formattedChange && (
                    <span className={`text-xs ${changeColor}`}>
                        {formattedChange}
                    </span>
                )}
            </div>

            {/* Optional: Visibility indicator (for debugging) */}
            {import.meta.env.MODE === 'development' && (
                <span
                    className={`w-2 h-2 rounded-full ${isVisible ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                    title={isVisible ? 'Subscribed' : 'Not subscribed'}
                />
            )}
        </div>
    );
};

export default InstrumentPriceDeferred;
