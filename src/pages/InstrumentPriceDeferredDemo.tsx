import InstrumentPriceDeferred from '@/components/InstrumentPriceDeferred';

/**
 * Example page demonstrating the InstrumentPriceDeferred component
 * 
 * This shows how the component efficiently handles WebSocket subscriptions
 * in a long scrollable list - only visible items are subscribed.
 */
const InstrumentPriceDeferredDemo = () => {
    // Example list of symbols - could be from your watchlist, market data, etc.
    const symbols = [
        'AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA',
        'META', 'NVDA', 'AMD', 'INTC', 'NFLX',
        'DIS', 'BA', 'GE', 'JPM', 'BAC',
        'WMT', 'HD', 'NKE', 'MCD', 'SBUX',
    ];

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Instrument Price Deferred Demo</h1>
                <p className="text-muted-foreground">
                    Scroll through the list below. Only visible items will subscribe to WebSocket updates.
                    Check the console to see subscription/unsubscription messages.
                </p>
            </div>

            {/* Scrollable container */}
            <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted px-4 py-3 border-b">
                    <div className="grid grid-cols-3 gap-4 font-semibold text-sm">
                        <div>Symbol</div>
                        <div>Current Price</div>
                        <div>Status</div>
                    </div>
                </div>

                <div className="max-h-[600px] overflow-y-auto">
                    {symbols.map((symbol) => (
                        <div
                            key={symbol}
                            className="px-4 py-4 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                        >
                            <div className="grid grid-cols-3 gap-4 items-center">
                                <div className="font-semibold text-lg">{symbol}</div>
                                <div>
                                    <InstrumentPriceDeferred
                                        symbol={symbol}
                                        className="text-xl"
                                        onVisibilityChange={(visible) => {
                                            console.log(`${symbol} visibility:`, visible);
                                        }}
                                    />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Live updates
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-blue-900">How it works:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Each price field monitors its visibility using Intersection Observer</li>
                    <li>When visible, it sends a WebSocket subscribe message for that symbol</li>
                    <li>When it scrolls out of view, it unsubscribes to save bandwidth</li>
                    <li>Price updates are stored in DataService and displayed in real-time</li>
                    <li>Green dot = subscribed and receiving updates</li>
                </ul>
            </div>
        </div>
    );
};

export default InstrumentPriceDeferredDemo;
