/**
 * InstrumentPriceDeferred - Usage Examples
 * 
 * This file demonstrates various ways to use the InstrumentPriceDeferred component
 */

import InstrumentPriceDeferred from '@/components/InstrumentPriceDeferred';

// ============================================================================
// Example 1: Basic Usage
// ============================================================================
export const BasicExample = () => {
    return (
        <div>
            <h2>Apple Stock Price:</h2>
            <InstrumentPriceDeferred symbol="AAPL" />
        </div>
    );
};

// ============================================================================
// Example 2: Custom Styling
// ============================================================================
export const StyledExample = () => {
    return (
        <div className="p-4 bg-card rounded-lg shadow">
            <div className="text-sm text-muted-foreground mb-1">Current Price</div>
            <InstrumentPriceDeferred
                symbol="GOOGL"
                className="text-3xl font-bold"
            />
        </div>
    );
};

// ============================================================================
// Example 3: With Visibility Callback
// ============================================================================
export const CallbackExample = () => {
    const handleVisibilityChange = (isVisible: boolean) => {
        console.log('Price field is now:', isVisible ? 'visible' : 'hidden');
        // You could trigger analytics, logging, or other side effects here
    };

    return (
        <InstrumentPriceDeferred
            symbol="TSLA"
            onVisibilityChange={handleVisibilityChange}
        />
    );
};

// ============================================================================
// Example 4: In a Watchlist/Table
// ============================================================================
export const WatchlistExample = () => {
    const watchlist = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];

    return (
        <table className="w-full">
            <thead>
                <tr>
                    <th className="text-left p-2">Symbol</th>
                    <th className="text-right p-2">Price</th>
                </tr>
            </thead>
            <tbody>
                {watchlist.map((symbol) => (
                    <tr key={symbol} className="border-t">
                        <td className="p-2 font-semibold">{symbol}</td>
                        <td className="p-2 text-right">
                            <InstrumentPriceDeferred symbol={symbol} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

// ============================================================================
// Example 5: In a Grid Layout
// ============================================================================
export const GridExample = () => {
    const symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN'];

    return (
        <div className="grid grid-cols-2 gap-4">
            {symbols.map((symbol) => (
                <div key={symbol} className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-2">{symbol}</div>
                    <InstrumentPriceDeferred
                        symbol={symbol}
                        className="text-2xl font-bold"
                    />
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// Example 6: Custom Threshold (triggers earlier/later)
// ============================================================================
export const CustomThresholdExample = () => {
    return (
        <div>
            {/* Subscribe when 50% of element is visible */}
            <InstrumentPriceDeferred
                symbol="NVDA"
                threshold={0.5}
            />

            {/* Subscribe as soon as any part is visible */}
            <InstrumentPriceDeferred
                symbol="AMD"
                threshold={0.01}
            />
        </div>
    );
};

// ============================================================================
// Example 7: Long Scrollable List (Performance Demo)
// ============================================================================
export const PerformanceExample = () => {
    // Generate a large list of symbols
    const symbols = Array.from({ length: 100 }, (_, i) => `SYMBOL_${i + 1}`);

    return (
        <div className="h-[500px] overflow-y-auto border rounded-lg">
            <div className="space-y-2 p-4">
                {symbols.map((symbol) => (
                    <div key={symbol} className="flex justify-between items-center p-3 bg-card rounded">
                        <span className="font-medium">{symbol}</span>
                        <InstrumentPriceDeferred symbol={symbol} />
                    </div>
                ))}
            </div>
        </div>
    );
};
