import type {
    LoginRequest, LoginResponse, UserWithPassword, UserInDb,
    InstrumentInDb, InstrumentCreate, InstrumentUpdate,
    ExchangeInDb, ExchangeCreate, ExchangeUpdate,
    ProviderInDb, ProviderCreate,
    PriceHistoryDailyInDb, PriceHistoryIntradayInDb,
    SectorInDb, SectorCreate, SectorUpdate, ProviderUpdate,
    InstrumentTypeCreate, InstrumentTypeUpdate, InstrumentTypeInDb,
    ProviderInstrumentMappingCreate, ProviderInstrumentMappingInDb,
    ExchangeHolidayCreate, ExchangeHolidayInDb, ExchangeHolidayUpdate,
    WatchlistCreate, WatchlistInDb, WatchlistUpdate,
    WatchlistItemCreate, WatchlistItemInDb
} from '../types/apiTypes';

const BASE_URL = 'http://localhost:8000'; // Adjust as needed
// const BASE_URL = 'https://realtimestockmarket.onrender.com'; // Adjust as needed
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export class ApiService {
    private static getHeaders() {
        const token = localStorage.getItem(TOKEN_KEY);
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }

    private static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
        const response = await fetch(`${BASE_URL}${url}`, {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail ? JSON.stringify(errorData.detail) : 'API request failed');
        }

        return response.json();
    }

    // Caching wrapper for GET requests
    private static async getCached<T>(url: string, forceRefresh = false): Promise<T> {
        const cacheKey = `api_cache_${url}`;
        if (!forceRefresh) {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    console.error('Failed to parse cached data', e);
                    localStorage.removeItem(cacheKey);
                }
            }
        }

        const data = await this.request<T>(url, { method: 'GET' });
        localStorage.setItem(cacheKey, JSON.stringify(data));
        return data;
    }

    // Auth
    static async login(data: LoginRequest): Promise<LoginResponse> {
        const response = await this.request<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        localStorage.setItem(TOKEN_KEY, response.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(response.user));
        return response;
    }

    static async register(data: UserWithPassword): Promise<UserInDb> {
        return this.request<UserInDb>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static logout() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        // Clear API cache on logout
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('api_cache_')) {
                localStorage.removeItem(key);
            }
        });
    }

    static getCurrentUser(): UserInDb | null {
        const userStr = localStorage.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }

    static isAuthenticated(): boolean {
        return !!localStorage.getItem(TOKEN_KEY);
    }

    // Instruments
    static async getInstruments(exchange: string): Promise<any> {
        return this.getCached(`/instrument/list/${exchange}`);
    }

    static async getInstrumentDetails(exchangeSymbol: string): Promise<any> {
        return this.getCached(`/instrument/details/${exchangeSymbol}`);
    }

    static async getAllInstruments(): Promise<InstrumentInDb[]> {
        return this.getCached<InstrumentInDb[]>('/instrument/');
    }

    static async createInstrument(data: InstrumentCreate): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>('/instrument/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async getInstrumentById(id: number): Promise<InstrumentInDb> {
        return this.getCached<InstrumentInDb>(`/instrument/${id}`);
    }

    static async updateInstrument(id: number, data: InstrumentUpdate): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>(`/instrument/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async getInstrumentTypes(): Promise<InstrumentTypeInDb[]> {
        return this.getCached<InstrumentTypeInDb[]>('/instrument_type/');
    }

    static async createInstrumentType(data: InstrumentTypeCreate): Promise<InstrumentTypeInDb> {
        return this.request<InstrumentTypeInDb>('/instrument_type/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async getInstrumentTypeById(id: number): Promise<InstrumentTypeInDb> {
        return this.getCached<InstrumentTypeInDb>(`/instrument_type/${id}`);
    }

    static async updateInstrumentType(id: number, data: InstrumentTypeUpdate): Promise<InstrumentTypeInDb> {
        return this.request<InstrumentTypeInDb>(`/instrument_type/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async deleteInstrumentType(id: number): Promise<void> {
        return this.request<void>(`/instrument_type/${id}`, {
            method: 'DELETE',
        });
    }

    static async deleteInstrument(id: number): Promise<void> {
        return this.request<void>(`/instrument/${id}`, {
            method: 'DELETE',
        });
    }

    static async toggleInstrumentRecording(id: number, shouldRecord: boolean): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>(`/instrument/${id}/recording?should_record=${shouldRecord}`, {
            method: 'PATCH',
        });
    }

    static async searchInstruments(query: string): Promise<InstrumentInDb[]> {
        return this.request<InstrumentInDb[]>(`/instrument/search?query=${encodeURIComponent(query)}`, {
            method: 'GET',
        });
    }

    // Exchanges
    static async getExchanges(): Promise<ExchangeInDb[]> {
        return this.getCached<ExchangeInDb[]>('/exchange/');
    }

    static async createExchange(data: ExchangeCreate): Promise<ExchangeInDb> {
        const response = await this.request<ExchangeInDb>('/exchange/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/exchange/');
        return response;
    }

    static async getExchangeById(id: number): Promise<ExchangeInDb> {
        return this.getCached<ExchangeInDb>(`/exchange/${id}`);
    }

    static async updateExchange(id: number, data: ExchangeUpdate): Promise<ExchangeInDb> {
        const response = await this.request<ExchangeInDb>(`/exchange/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/exchange/');
        this.invalidateCache(`/exchange/${id}`);
        return response;
    }

    static async deleteExchange(id: number): Promise<void> {
        await this.request<void>(`/exchange/${id}`, {
            method: 'DELETE',
        });
        this.invalidateCache('/exchange/');
    }

    // Providers
    static async getProviders(): Promise<ProviderInDb[]> {
        return this.getCached<ProviderInDb[]>('/provider/');
    }

    static async createProvider(data: ProviderCreate): Promise<ProviderInDb> {
        return this.request<ProviderInDb>('/provider/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async getProviderById(id: number): Promise<ProviderInDb> {
        return this.getCached<ProviderInDb>(`/provider/${id}`);
    }

    static async updateProvider(id: number, data: ProviderUpdate): Promise<ProviderInDb> {
        return this.request<ProviderInDb>(`/provider/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async deleteProvider(id: number): Promise<void> {
        return this.request<void>(`/provider/${id}`, {
            method: 'DELETE',
        });
    }

    static async getIntradayPrices(symbol: string): Promise<PriceHistoryIntradayInDb[]> {
        return this.getCached<PriceHistoryIntradayInDb[]>(`/marketdata/intraday/${symbol}`, true);
    }

    static async getDailyPrices(symbol: string): Promise<PriceHistoryDailyInDb[]> {
        return this.getCached<PriceHistoryDailyInDb[]>(`/marketdata/daily/${symbol}`, true);
    }


    static async getPreviousCloseForExchange(exchange: string): Promise<any> {
        console.log(`Fetching previous close for exchange: ${exchange}`);
        return this.getCached(`/marketdata/prev_close/${exchange}`, true);
    }


    static async getSectorList(): Promise<SectorInDb[]> {
        return this.getCached<SectorInDb[]>('/sector');
    }

    static async createSector(data: SectorCreate): Promise<SectorInDb> {
        return this.request<SectorInDb>('/sector/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updateSector(id: number, data: SectorUpdate): Promise<SectorInDb> {
        return this.request<SectorInDb>(`/sector/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async getSectorById(id: number): Promise<SectorInDb> {
        return this.getCached<SectorInDb>(`/sector/${id}`);
    }

    static async deleteSector(id: number): Promise<void> {
        return this.request<void>(`/sector/${id}`, {
            method: 'DELETE',
        });
    }

    // Provider Instrument Mappings
    static async getInstrumentProviderMappings(instrumentId: number): Promise<ProviderInstrumentMappingInDb[]> {
        return this.getCached<ProviderInstrumentMappingInDb[]>(`/provider/mapping/instrument/${instrumentId}`);
    }

    static async createProviderInstrumentMapping(data: ProviderInstrumentMappingCreate): Promise<ProviderInstrumentMappingInDb> {
        return this.request<ProviderInstrumentMappingInDb>('/provider/mapping/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async updateProviderInstrumentMapping(data: ProviderInstrumentMappingCreate): Promise<ProviderInstrumentMappingInDb> {
        return this.request<ProviderInstrumentMappingInDb>('/provider/mapping/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static invalidateCache(url: string) {
        const cacheKey = `api_cache_${url}`;
        localStorage.removeItem(cacheKey);
    }

    // Exchange Holidays
    static async getExchangeHolidays(exchangeId: number): Promise<ExchangeHolidayInDb[]> {
        return this.getCached<ExchangeHolidayInDb[]>(`/exchange/${exchangeId}/holidays`);
    }

    static async createExchangeHoliday(data: ExchangeHolidayCreate): Promise<ExchangeHolidayInDb> {
        const response = await this.request<ExchangeHolidayInDb>('/exchange/holidays', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache(`/exchange/${data.exchange_id}/holidays`);
        return response;
    }

    static async updateExchangeHoliday(id: number, data: ExchangeHolidayUpdate): Promise<ExchangeHolidayInDb> {
        // Warning: We don't have the exchange_id here easily to invalidate the specific list without fetching.
        // For now, we might need to rely on the user refreshing or more aggressive invalidation if we had a way to know the exchange_id.
        // Or we can return the updated object which usually contains the exchange_id.
        const response = await this.request<ExchangeHolidayInDb>(`/exchange/holidays/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache(`/exchange/${response.exchange_id}/holidays`);
        return response;
    }

    static async deleteExchangeHoliday(id: number): Promise<void> {
        // We can't easily invalidate the specific list here without knowing the exchange_id.
        // We might need to fetch it first or just clear all holiday caches if we could pattern match.
        // For now, let's assume the caller handles refresh or we just leave it.
        // Actually, let's try to fetch it first? No that's expensive.
        // Let's iterate and clear all exchange holiday caches?
        Object.keys(localStorage).forEach(key => {
            if (key.includes('/holidays')) {
                localStorage.removeItem(key);
            }
        });

        return this.request<void>(`/exchange/holidays/${id}`, {
            method: 'DELETE',
        });
    }

    // Watchlists
    static async getWatchlists(): Promise<WatchlistInDb[]> {
        return this.getCached<WatchlistInDb[]>('/watchlist/');
    }

    static async createWatchlist(data: WatchlistCreate): Promise<WatchlistInDb> {
        const response = await this.request<WatchlistInDb>('/watchlist/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/watchlist/');
        return response;
    }

    static async getWatchlistById(id: number): Promise<WatchlistInDb> {
        return this.request<WatchlistInDb>(`/watchlist/${id}`);
    }

    static async updateWatchlist(id: number, data: WatchlistUpdate): Promise<WatchlistInDb> {
        const response = await this.request<WatchlistInDb>(`/watchlist/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/watchlist/');
        return response;
    }

    static async deleteWatchlist(id: number): Promise<void> {
        const response = await this.request<void>(`/watchlist/${id}`, {
            method: 'DELETE',
        });
        this.invalidateCache('/watchlist/');
        return response;
    }

    static async addItemToWatchlist(watchlistId: number, data: WatchlistItemCreate): Promise<WatchlistItemInDb> {
        const response = await this.request<WatchlistItemInDb>(`/watchlist/${watchlistId}/items`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/watchlist/'); // In case the list view includes items count or items
        return response;
    }

    static async removeItemFromWatchlist(watchlistId: number, instrumentId: number): Promise<void> {
        const response = await this.request<void>(`/watchlist/${watchlistId}/items/${instrumentId}`, {
            method: 'DELETE',
        });
        this.invalidateCache('/watchlist/');
        return response;
    }
}
