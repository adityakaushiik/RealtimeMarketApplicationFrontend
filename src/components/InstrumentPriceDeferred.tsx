import { useEffect, useRef, useState, useMemo } from 'react';
import { useDataStore, type MarketData } from '@/shared/services/dataService';
import { WebSocketService, useWebSocketStore, type WebSocketState } from '@/shared/services/websocketService';
import { useShallow } from 'zustand/react/shallow';
import { WebSocketMessageType } from '@/shared/utils/CommonConstants';
import type { SnapshotWebsocketMessage } from '@/shared/utils/utils';
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

    const pctChangeBasis = useAppStore(useShallow((state) => state.pctChangeBasis));

    // Subscribe to the specific symbol's data array using shallow comparison
    const symbolDataArray = useDataStore(
        useShallow((state: any) => state.data[symbol] as MarketData[] | undefined)
    );

    // Find the snapshot to get static data like prevClose
    const snapshot = useMemo(() => {
        if (!symbolDataArray) return undefined;
        return symbolDataArray.find((d) => d.type === WebSocketMessageType.SNAPSHOT) as SnapshotWebsocketMessage | undefined;
    }, [symbolDataArray]);

    // Use prevClose from snapshot, or Open if prevClose is not available/zero/-1 (fallback logic)
    // Adjusted logic to respect pctChangeBasis user preference
    const previousClose = useMemo(() => {
        if (!snapshot) return undefined;

        if (pctChangeBasis === 'open') {
            if (snapshot.open !== undefined && snapshot.open !== 0 && snapshot.open !== -1) {
                return snapshot.open;
            }
            // If open is invalid, maybe fallback to prevClose to show something?
            // For now, let's respect the user's choice strictly for the basis.
            return undefined;
        }

        // Default: prev_close
        const validPrevClose = (snapshot.prevClose !== undefined && snapshot.prevClose !== 0 && snapshot.prevClose !== -1) ? snapshot.prevClose : undefined;
        return validPrevClose || snapshot.open;
    }, [snapshot, pctChangeBasis]);

    // Get the latest price from the array (memoized to prevent unnecessary recalculations)
    const latestData = useMemo(() => {
        if (!symbolDataArray || symbolDataArray.length === 0) return undefined;
        return symbolDataArray[symbolDataArray.length - 1];
    }, [symbolDataArray]);

    // Helper to extract price from MarketData
    const getPrice = (data: MarketData | undefined): number | undefined => {
        if (!data) return undefined; // distinct from previousClose fallback
        const d = data as any;
        let p: number | undefined;
        if (d.price !== undefined && d.price !== null) p = d.price;
        else if (d.close !== undefined && d.close !== null) p = d.close;
        
        // Filter out -1 (unavailable)
        if (p !== undefined && p !== -1) return p;
        return undefined;
    };

    // Format price for display
    const formattedPrice = useMemo(() => {
        let price = getPrice(latestData);

        // Fallback to previousClose only if we have NO data at all? 
        // Or if latestData yielded no price.
        if (price === undefined && previousClose !== undefined && previousClose !== 0) {
            price = previousClose;
        }

        // If price is undefined or 0, showing it as 0 might be misleading if it means "no data"
        if (price === undefined || price === 0) return '--';
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
        // If prevClose was explicitly -1, do not show percentage (only if using prev_close)
        if (pctChangeBasis === 'prev_close' && snapshot?.prevClose === -1) return undefined;

        const currentPrice = getPrice(latestData);

        // Use prevClose from snapshot for calculation
        // If prevClose is 0 or undefined, we cannot calculate change correctly based on it.
        // User requested: "when market is off... use the ltp to calculate the percentage"
        // This likely means if prevClose is bad, assume 0% or handle gracefully.
        // With the fallback to 'open' above, we try to provide a meaningful change.
        if (currentPrice === undefined || currentPrice === 0 || !previousClose || previousClose === 0) return undefined;

        return ((currentPrice - previousClose) / previousClose) * 100;
    }, [latestData, previousClose, snapshot, pctChangeBasis]);

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
