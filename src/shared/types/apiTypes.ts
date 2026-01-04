// API Type Definitions
export interface ExchangeCreate {
    name: string;
    code: string;
    timezone?: string | null;
    country?: string | null;
    currency?: string | null;
    pre_market_open_time?: string | null;
    market_open_time?: string | null;
    market_close_time?: string | null;
    post_market_close_time?: string | null;
}

export interface ExchangeUpdate {
    name?: string | null;
    code?: string | null;
    timezone?: string | null;
    country?: string | null;
    currency?: string | null;
    pre_market_open_time?: string | null;
    market_open_time?: string | null;
    market_close_time?: string | null;
    post_market_close_time?: string | null;
}

export interface ExchangeInDb extends ExchangeCreate {
    id: number;
}

export interface InstrumentCreate {
    symbol: string;
    name: string;
    exchange_id: number;
    instrument_type_id: number;
    sector_id?: number | null;
    blacklisted?: boolean;
    delisted?: boolean;
    should_record_data?: boolean;
}

export interface InstrumentInDb extends InstrumentCreate {
    id: number;
    should_record_data?: boolean;
    is_active?: boolean;
}

export interface InstrumentUpdate {
    symbol?: string | null;
    name?: string | null;
    exchange_id?: number | null;
    instrument_type_id?: number | null;
    sector_id?: number | null;
    blacklisted?: boolean | null;
    delisted?: boolean | null;
}

export interface InstrumentTypeCreate {
    code: string;
    name: string;
    description?: string | null;
    category?: string | null;
    display_order?: number | null;
}

export interface InstrumentTypeUpdate {
    code?: string | null;
    name?: string | null;
    description?: string | null;
    category?: string | null;
    display_order?: number | null;
}

export interface InstrumentTypeInDb extends InstrumentTypeCreate {
    id: number;
}



export interface LoginRequest {
    username_or_email: string;
    password?: string;
}

export interface UserInDb {
    email: string;
    fname?: string | null;
    lname?: string | null;
    username?: string | null;
    profile_picture_url?: string | null;
    id: number;
    blacklisted: boolean;
    role_id?: number | null;
    is_active: boolean; // Deprecated in favor of status
    status: number; // 0: Pending, 1: Approved, 2: Rejected
}

export interface UserUpdate {
    email?: string | null;
    fname?: string | null;
    lname?: string | null;
    username?: string | null;
    profile_picture_url?: string | null;
    blacklisted?: boolean | null;
    role_id?: number | null;
    status?: number | null;
}

export interface LoginResponse {
    user: UserInDb;
    access_token: string;
    token_type: string;
}

export interface PriceHistoryDailyInDb {
    instrument_id: number;
    date: string;
    datetime?: string | null;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    previous_close?: number | null;
    adj_close?: number | null;
    volume?: number | null;
    deliver_percentage?: number | null;
    price_not_found?: boolean;
    id: number;
}

export interface PriceHistoryIntradayInDb {
    instrument_id: number;
    date: string;
    datetime?: string | null;
    open?: number | null;
    high?: number | null;
    low?: number | null;
    close?: number | null;
    previous_close?: number | null;
    adj_close?: number | null;
    volume?: number | null;
    deliver_percentage?: number | null;
    price_not_found?: boolean;
    interval?: string | null;
    id: number;
}

export interface ProviderCreate {
    name: string;
    code: string;
    credentials?: Record<string, any> | null;
    rate_limit?: number | null;
}

export interface ProviderInDb extends ProviderCreate {
    id: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface ProviderUpdate {
    name?: string | null;
    code?: string | null;
    credentials?: Record<string, any> | null;
    rate_limit?: number | null;
    is_active?: boolean | null;
}

export interface UserWithPassword {
    email: string;
    fname?: string | null;
    lname?: string | null;
    username?: string | null;
    profile_picture_url?: string | null;
    password: string;
}

export interface ValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
}

export interface HTTPValidationError {
    detail: ValidationError[];
}

export interface SectorInDb {
    id: number;
    name: string;
    description?: string | null;
}

export interface SectorCreate {
    name: string;
    description?: string | null;
}

export interface SectorUpdate {
    name?: string | null;
    description?: string | null;
}

export interface ProviderInstrumentMappingCreate {
    provider_id: number;
    instrument_id: number;
    provider_instrument_search_code: string;
}

export interface ProviderInstrumentMappingInDb extends ProviderInstrumentMappingCreate { }

// Exchange Holiday Types
export interface ExchangeHolidayCreate {
    date: string;
    description?: string | null;
    is_closed?: boolean;
    open_time?: string | null;
    close_time?: string | null;
    exchange_id: number;
}

export interface ExchangeHolidayInDb extends ExchangeHolidayCreate {
    id: number;
}

export interface ExchangeHolidayUpdate {
    date?: string | null;
    description?: string | null;
    is_closed?: boolean | null;
    open_time?: string | null;
    close_time?: string | null;
}

// Watchlist Types
export interface WatchlistCreate {
    name: string;
}

export interface WatchlistUpdate {
    name?: string | null;
}

export interface WatchlistItemCreate {
    instrument_id: number;
}

export interface WatchlistItemInDb {
    id: number;
    instrument_id: number;
    watchlist_id: number;
    instrument?: InstrumentInDb; // Optional, populated if joined
}

export interface WatchlistInDb {
    id: number;
    user_id: number;
    name: string;
    items?: WatchlistItemInDb[];
}

// Exchange Provider Mapping Types
export interface ExchangeProviderMappingCreate {
    provider_id: number;
    exchange_id: number;
    is_active?: boolean;
    is_primary?: boolean;
}

export interface ExchangeProviderMappingInDb {
    provider_id: number;
    exchange_id: number;
    is_active: boolean;
    is_primary: boolean;
}


export interface ExchangeProviderMappingUpdate {
    is_active?: boolean | null;
    is_primary?: boolean | null;
}

// Suggestion Types
export interface SuggestionTypeCreate {
    name: string;
    description?: string | null;
}

export interface SuggestionTypeInDb extends SuggestionTypeCreate {
    id: number;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface SuggestionTypeUpdate {
    name?: string | null;
    description?: string | null;
}

// Suggestions
export interface SuggestionCreate {
    suggestion_type_id: number;
    title: string;
    description: string;
}

export interface SuggestionInDb extends SuggestionCreate {
    id: number;
    user_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface SuggestionUpdate {
    suggestion_type_id?: number | null;
    title?: string | null;
    description?: string | null;
    status?: string | null;
}


