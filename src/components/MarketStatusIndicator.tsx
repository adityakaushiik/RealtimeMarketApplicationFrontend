import { useMemo, useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar } from 'lucide-react';
import type { ExchangeInDb, ExchangeHolidayInDb } from '@/shared/types/apiTypes';

interface MarketStatusIndicatorProps {
    exchange: ExchangeInDb | null;
    className?: string;
    showDetails?: boolean;
}

/**
 * Helper to parse a time string (HH:mm or HH:mm:ss) to minutes since midnight
 */
const parseTimeToMinutes = (timeStr: string | null | undefined): number | null => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    if (isNaN(hours) || isNaN(minutes)) return null;
    return hours * 60 + minutes;
};

/**
 * Format time string (HH:mm:ss or HH:mm) to display format (HH:mm)
 */
const formatTime = (timeStr: string | null | undefined): string => {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    return `${parts[0]}:${parts[1]}`;
};

/**
 * Get the current time in the exchange's timezone
 * Returns { hours, minutes, dayOfWeek } in the exchange's local time
 */
const getExchangeLocalTime = (exchangeTimezone: string | null | undefined): { hours: number; minutes: number; dayOfWeek: number } => {
    const now = new Date();

    if (!exchangeTimezone) {
        // Fallback to user's local time if no timezone specified
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            dayOfWeek: now.getDay()
        };
    }

    try {
        // Use Intl.DateTimeFormat to get time parts in exchange timezone
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: exchangeTimezone,
            hour: 'numeric',
            minute: 'numeric',
            weekday: 'short',
            hour12: false
        });

        const parts = formatter.formatToParts(now);

        let hours = 0;
        let minutes = 0;
        let weekday = '';

        for (const part of parts) {
            if (part.type === 'hour') {
                hours = parseInt(part.value, 10);
            } else if (part.type === 'minute') {
                minutes = parseInt(part.value, 10);
            } else if (part.type === 'weekday') {
                weekday = part.value;
            }
        }

        // Convert weekday string to number (0 = Sunday, 6 = Saturday)
        const weekdayMap: Record<string, number> = {
            'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
        };
        const dayOfWeek = weekdayMap[weekday] ?? now.getDay();

        return { hours, minutes, dayOfWeek };
    } catch (error) {
        console.warn(`Invalid timezone: ${exchangeTimezone}, falling back to local time`);
        return {
            hours: now.getHours(),
            minutes: now.getMinutes(),
            dayOfWeek: now.getDay()
        };
    }
};

/**
 * Determines the market status based on current time in exchange timezone
 */
export type MarketStatus = 'pre-market' | 'open' | 'post-market' | 'closed' | 'holiday' | 'special-session' | 'unknown';

interface MarketStatusResult {
    status: MarketStatus;
    nextEvent: string | null;
    holiday?: ExchangeHolidayInDb;
}

const getMarketStatus = (exchange: ExchangeInDb | null): MarketStatusResult => {
    if (!exchange) return { status: 'unknown', nextEvent: null };

    // Check for current day holidays FIRST - this overrides standard behavior
    const holidays = exchange.current_day_holidays;
    if (holidays && holidays.length > 0) {
        const holiday = holidays[0]; // Use the first holiday entry for today

        if (holiday.is_closed) {
            // Market is fully closed for this holiday
            return {
                status: 'holiday',
                nextEvent: null,
                holiday
            };
        } else {
            // Special session (e.g., Muhurat Trading) - market open with modified hours
            const { hours, minutes } = getExchangeLocalTime(exchange.timezone);
            const currentMinutes = hours * 60 + minutes;

            const specialOpen = parseTimeToMinutes(holiday.open_time);
            const specialClose = parseTimeToMinutes(holiday.close_time);

            if (specialOpen !== null && specialClose !== null) {
                if (currentMinutes >= specialOpen && currentMinutes < specialClose) {
                    const minsToClose = specialClose - currentMinutes;
                    const hrs = Math.floor(minsToClose / 60);
                    const mins = minsToClose % 60;
                    return {
                        status: 'special-session',
                        nextEvent: hrs > 0 ? `Ends in ${hrs}h ${mins}m` : `Ends in ${mins}m`,
                        holiday
                    };
                } else if (currentMinutes < specialOpen) {
                    const minsToOpen = specialOpen - currentMinutes;
                    const hrs = Math.floor(minsToOpen / 60);
                    const mins = minsToOpen % 60;
                    return {
                        status: 'special-session',
                        nextEvent: hrs > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${mins}m`,
                        holiday
                    };
                } else {
                    // Session ended
                    return {
                        status: 'holiday',
                        nextEvent: 'Session ended',
                        holiday
                    };
                }
            }

            // Fallback if no times specified
            return {
                status: 'special-session',
                nextEvent: null,
                holiday
            };
        }
    }

    // Standard market hours logic
    const { hours, minutes, dayOfWeek } = getExchangeLocalTime(exchange.timezone);
    const currentMinutes = hours * 60 + minutes;

    const preMarketOpen = parseTimeToMinutes(exchange.pre_market_open_time);
    const marketOpen = parseTimeToMinutes(exchange.market_open_time);
    const marketClose = parseTimeToMinutes(exchange.market_close_time);
    const postMarketClose = parseTimeToMinutes(exchange.post_market_close_time);

    // If we don't have market hours, we can't determine status
    if (marketOpen === null || marketClose === null) {
        return { status: 'unknown', nextEvent: null };
    }

    // Check if it's a weekend (Saturday = 6, Sunday = 0)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return { status: 'closed', nextEvent: 'Market opens Monday' };
    }

    // Pre-market session
    if (preMarketOpen !== null && currentMinutes >= preMarketOpen && currentMinutes < marketOpen) {
        const minsToOpen = marketOpen - currentMinutes;
        const hrs = Math.floor(minsToOpen / 60);
        const mins = minsToOpen % 60;
        return {
            status: 'pre-market',
            nextEvent: hrs > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${mins}m`
        };
    }

    // Regular market hours
    if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
        const minsToClose = marketClose - currentMinutes;
        const hrs = Math.floor(minsToClose / 60);
        const mins = minsToClose % 60;
        return {
            status: 'open',
            nextEvent: hrs > 0 ? `Closes in ${hrs}h ${mins}m` : `Closes in ${mins}m`
        };
    }

    // Post-market session
    if (postMarketClose !== null && currentMinutes >= marketClose && currentMinutes < postMarketClose) {
        const minsToClose = postMarketClose - currentMinutes;
        const hrs = Math.floor(minsToClose / 60);
        const mins = minsToClose % 60;
        return {
            status: 'post-market',
            nextEvent: hrs > 0 ? `Ends in ${hrs}h ${mins}m` : `Ends in ${mins}m`
        };
    }

    // Market is closed
    // Calculate time until next pre-market or market open
    if (currentMinutes < (preMarketOpen ?? marketOpen)) {
        const minsToOpen = (preMarketOpen ?? marketOpen) - currentMinutes;
        const hrs = Math.floor(minsToOpen / 60);
        const mins = minsToOpen % 60;
        return {
            status: 'closed',
            nextEvent: hrs > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${mins}m`
        };
    }

    return { status: 'closed', nextEvent: 'Opens tomorrow' };
};

const statusConfig: Record<MarketStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; dotColor: string }> = {
    'pre-market': { label: 'Pre-Market', variant: 'secondary', dotColor: 'bg-amber-500' },
    'open': { label: 'Market Open', variant: 'default', dotColor: 'bg-green-500' },
    'post-market': { label: 'Post-Market', variant: 'secondary', dotColor: 'bg-amber-500' },
    'closed': { label: 'Closed', variant: 'outline', dotColor: 'bg-red-500' },
    'holiday': { label: 'Closed', variant: 'destructive', dotColor: 'bg-red-500' },
    'special-session': { label: 'Special Session', variant: 'secondary', dotColor: 'bg-purple-500' },
    'unknown': { label: 'Unknown', variant: 'outline', dotColor: 'bg-gray-400' }
};

export function MarketStatusIndicator({ exchange, className = '', showDetails = true }: MarketStatusIndicatorProps) {
    // Internal timer to force recalculation every minute
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTick(t => t + 1);
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const { status, nextEvent, holiday } = useMemo(() => {
        // tick is used to force recalculation every minute
        void tick;
        return getMarketStatus(exchange);
    }, [exchange, tick]);

    const config = statusConfig[status];

    // Holiday/Special Session display
    if (status === 'holiday' && holiday) {
        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="gap-1.5 font-normal">
                        <AlertTriangle className="w-3 h-3" />
                        Closed - {holiday.description || 'Holiday'}
                    </Badge>
                </div>
                {showDetails && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Market holiday
                    </span>
                )}
            </div>
        );
    }

    if (status === 'special-session' && holiday) {
        const timeRange = holiday.open_time && holiday.close_time
            ? `${formatTime(holiday.open_time)} - ${formatTime(holiday.close_time)}`
            : null;

        return (
            <div className={`flex flex-col gap-1 ${className}`}>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="gap-1.5 font-normal bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                        <span className={`w-2 h-2 rounded-full bg-purple-500 animate-pulse`}></span>
                        {holiday.description || 'Special Session'}
                    </Badge>
                    {showDetails && nextEvent && (
                        <span className="text-xs text-muted-foreground">{nextEvent}</span>
                    )}
                </div>
                {showDetails && timeRange && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Hours: {timeRange}
                    </span>
                )}
            </div>
        );
    }

    // Standard status display
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Badge variant={config.variant} className="gap-1.5 font-normal">
                <span className={`w-2 h-2 rounded-full ${config.dotColor} ${status === 'open' ? 'animate-pulse' : ''}`}></span>
                {config.label}
            </Badge>
            {showDetails && nextEvent && (
                <span className="text-xs text-muted-foreground">{nextEvent}</span>
            )}
        </div>
    );
}

export { getMarketStatus };
export default MarketStatusIndicator;
