import type {
    LoginRequest, LoginResponse, UserWithPassword, UserInDb, UserUpdate,
    InstrumentInDb, InstrumentCreate, InstrumentUpdate,
    ExchangeInDb, ExchangeCreate, ExchangeUpdate,
    ProviderInDb, ProviderCreate,
    PriceHistoryDailyInDb, PriceHistoryIntradayInDb,
    SectorInDb, SectorCreate, SectorUpdate, ProviderUpdate,
    InstrumentTypeCreate, InstrumentTypeUpdate, InstrumentTypeInDb,
    ProviderInstrumentMappingCreate, ProviderInstrumentMappingInDb,
    ExchangeHolidayCreate, ExchangeHolidayInDb, ExchangeHolidayUpdate,
    WatchlistCreate, WatchlistInDb, WatchlistUpdate,
    WatchlistItemCreate, WatchlistItemInDb,
    ExchangeProviderMappingCreate, ExchangeProviderMappingInDb, ExchangeProviderMappingUpdate,
    SuggestionTypeCreate, SuggestionTypeInDb, SuggestionTypeUpdate,
    SuggestionCreate, SuggestionInDb, SuggestionUpdate, SuggestionResponse,
    ChangePasswordRequest, ResetPasswordRequest
} from '../types/apiTypes';

import NProgress from 'nprogress';

// Configure NProgress to not show the spinner
NProgress.configure({ showSpinner: false });

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export class ApiService {
    private static requestCount = 0;

    private static startLoading() {
        if (this.requestCount === 0) {
            NProgress.start();
        }
        this.requestCount++;
    }

    private static finishLoading() {
        this.requestCount--;
        if (this.requestCount <= 0) {
            this.requestCount = 0;
            NProgress.done();
        }
    }

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
        this.startLoading();
        try {
            const response = await fetch(`${BASE_URL}${url}`, {
                ...options,
                headers: {
                    ...this.getHeaders(),
                    ...options.headers,
                },
            });

            // Handle Unauthorized (401)
            // Skip global logout/redirect for login endpoint to allow form to handle specific error (e.g. "Invalid credentials")
            if (response.status === 401 && !url.includes('/auth/login')) {
                this.logout();
                window.location.href = '/login';
                throw new Error('Unauthorized');
            }

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                let errorMessage = 'API request failed';

                if (errorData.detail) {
                    if (typeof errorData.detail === 'string') {
                        errorMessage = errorData.detail;
                    } else if (Array.isArray(errorData.detail)) {
                        // FastAPI validation error often comes as an array of objects
                        errorMessage = errorData.detail.map((err: any) => err.msg || JSON.stringify(err)).join(', ');
                    } else {
                        errorMessage = JSON.stringify(errorData.detail);
                    }
                }

                throw new Error(errorMessage);
            }

            return response.json();
        } finally {
            this.finishLoading();
        }
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
        try {
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (e) {
            // Handle quota exceeded or other localStorage errors gracefully
            console.warn('Failed to cache data in localStorage:', e);
            // Optionally clear old cache entries to make room
            this.clearOldCacheEntries();
        }
        return data;
    }

    // Clear old cache entries when storage is full
    private static clearOldCacheEntries() {
        const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('api_cache_'));
        // Remove half of the cached entries (oldest first by key order)
        const keysToRemove = cacheKeys.slice(0, Math.ceil(cacheKeys.length / 2));
        keysToRemove.forEach(key => localStorage.removeItem(key));
    }

    private static invalidateInstrumentListCache() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('api_cache_/instrument/list/') || key === 'api_cache_/instrument/') {
                localStorage.removeItem(key);
            }
        });
    }

    public static invalidateInstrumentCache(id: number, symbol?: string) {
        // Invalidate specific instrument cache
        localStorage.removeItem(`api_cache_/instrument/${id}`);
        if (symbol) {
            localStorage.removeItem(`api_cache_/instrument/by-symbol/${symbol}`);
            localStorage.removeItem(`api_cache_/instrument/details/${symbol}`);
        }
        
        // Also invalidate lists since they might contain the updated instrument
        this.invalidateInstrumentListCache();
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
        // Clear ALL cache on logout to free up storage
        this.clearAllCache();
    }

    // Clear all API cache entries
    static clearAllCache() {
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

    // User Management
    static async getUsers(userStatus?: number | null): Promise<UserInDb[]> {
        const query = userStatus !== undefined && userStatus !== null ? `?user_status=${userStatus}` : '';
        return this.request<UserInDb[]>(`/user/${query}`);
    }

    static async getUserById(id: number): Promise<UserInDb> {
        return this.request<UserInDb>(`/user/${id}`);
    }

    static async updateUser(id: number, data: UserUpdate): Promise<UserInDb> {
        return this.request<UserInDb>(`/user/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async getUserByEmail(email: string): Promise<UserInDb> {
        return this.request<UserInDb>(`/user/email/${email}`);
    }

    static async updateUserStatus(id: number, status: number): Promise<UserInDb> {
        return this.request<UserInDb>(`/user/update_status/${id}?user_status=${status}`, {
            method: 'PATCH',
        });
    }

    static async changePassword(data: ChangePasswordRequest): Promise<void> {
        return this.request<void>('/user/change-password', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async resetPassword(userId: number, data: ResetPasswordRequest): Promise<void> {
        return this.request<void>(`/user/${userId}/reset-password`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Instruments
    static async getInstruments(exchange: string, instrumentTypeId?: number, recordingOnly?: boolean): Promise<any> {
        let url = `/instrument/list/${exchange}`;
        const params: string[] = [];
        if (instrumentTypeId) {
            params.push(`instrument_type_id=${instrumentTypeId}`);
        }
        if (recordingOnly) {
            params.push(`recording_only=true`);
        }
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        return this.getCached(url);
    }

    static async getInstrumentDetails(exchangeSymbol: string): Promise<any> {
        return this.request(`/instrument/details/${exchangeSymbol}`, { method: 'GET' });
    }

    static async getInstrumentBySymbol(symbol: string): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>(`/instrument/by-symbol/${symbol}`, { method: 'GET' });
    }

    static async getAllInstruments(): Promise<InstrumentInDb[]> {
        return this.getCached<InstrumentInDb[]>('/instrument/');
    }

    static async createInstrument(data: InstrumentCreate): Promise<InstrumentInDb> {
        const response = await this.request<InstrumentInDb>('/instrument/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateInstrumentListCache();
        return response;
    }

    static async getInstrumentById(id: number): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>(`/instrument/${id}`, { method: 'GET' });
    }

    static async updateInstrument(id: number, data: InstrumentUpdate): Promise<InstrumentInDb> {
        const response = await this.request<InstrumentInDb>(`/instrument/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateInstrumentListCache();
        return response;
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
        await this.request<void>(`/instrument/${id}`, {
            method: 'DELETE',
        });
        this.invalidateInstrumentListCache();
    }

    static async toggleInstrumentRecording(id: number, shouldRecord: boolean): Promise<InstrumentInDb> {
        return this.request<InstrumentInDb>(`/instrument/${id}/recording?should_record=${shouldRecord}`, {
            method: 'PATCH',
        });
    }

    static async searchInstruments(query: string, exchange?: string): Promise<InstrumentInDb[]> {
        let url = `/instrument/search?query=${encodeURIComponent(query)}`;
        if (exchange) {
            url += `&exchange=${encodeURIComponent(exchange)}`;
        }
        return this.request<InstrumentInDb[]>(url, {
            method: 'GET',
        });
    }

    static async getRecordingInstruments(): Promise<InstrumentInDb[]> {
        return this.request<InstrumentInDb[]>('/instrument/recording/all');
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

    // Market data
    static async getIntradayPrices(symbol: string): Promise<PriceHistoryIntradayInDb[]> {
        return this.request<PriceHistoryIntradayInDb[]>(`/marketdata/intraday/${symbol}`, { method: 'GET' });
    }

    static async getDailyPrices(symbol: string): Promise<PriceHistoryDailyInDb[]> {
        return this.request<PriceHistoryDailyInDb[]>(`/marketdata/daily/${symbol}`, { method: 'GET' });
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
    static async getInstrumentProviderMappings(instrumentId: number, forceRefresh = false): Promise<ProviderInstrumentMappingInDb[]> {
        return this.getCached<ProviderInstrumentMappingInDb[]>(`/provider/mapping/instrument/${instrumentId}`, forceRefresh);
    }

    static async createProviderInstrumentMapping(data: ProviderInstrumentMappingCreate): Promise<ProviderInstrumentMappingInDb> {
        const response = await this.request<ProviderInstrumentMappingInDb>('/provider/mapping/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateInstrumentListCache();
        this.invalidateCache(`/provider/mapping/instrument/${data.instrument_id}`);
        return response;
    }

    static async updateProviderInstrumentMapping(data: ProviderInstrumentMappingCreate): Promise<ProviderInstrumentMappingInDb> {
        const response = await this.request<ProviderInstrumentMappingInDb>('/provider/mapping/', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateInstrumentListCache();
        this.invalidateCache(`/provider/mapping/instrument/${data.instrument_id}`);
        return response;
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
        const response = await this.request<ExchangeHolidayInDb>(`/exchange/holidays/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache(`/exchange/${response.exchange_id}/holidays`);
        return response;
    }

    static async deleteExchangeHoliday(id: number): Promise<void> {
        Object.keys(localStorage).forEach(key => {
            if (key.includes('/holidays')) {
                localStorage.removeItem(key);
            }
        });

        return this.request<void>(`/exchange/holidays/${id}`, {
            method: 'DELETE',
        });
    }


    // Exchange Provider Mappings
    static async getProvidersForExchange(exchangeId: number): Promise<ExchangeProviderMappingInDb[]> {
        return this.getCached<ExchangeProviderMappingInDb[]>(`/exchange/${exchangeId}/providers`);
    }

    static async addProviderToExchange(exchangeId: number, providerId: number, data: ExchangeProviderMappingCreate): Promise<ExchangeProviderMappingInDb> {
        const response = await this.request<ExchangeProviderMappingInDb>(`/exchange/${exchangeId}/providers/${providerId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache(`/exchange/${exchangeId}/providers`);
        return response;
    }

    static async updateProviderExchangeMapping(exchangeId: number, providerId: number, data: ExchangeProviderMappingUpdate): Promise<ExchangeProviderMappingInDb> {
        const response = await this.request<ExchangeProviderMappingInDb>(`/exchange/${exchangeId}/providers/${providerId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache(`/exchange/${exchangeId}/providers`);
        return response;
    }

    static async removeProviderFromExchange(exchangeId: number, providerId: number): Promise<void> {
        await this.request<void>(`/exchange/${exchangeId}/providers/${providerId}`, {
            method: 'DELETE',
        });
        this.invalidateCache(`/exchange/${exchangeId}/providers`);
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
        this.invalidateCache('/watchlist/');
        return response;
    }

    static async removeItemFromWatchlist(watchlistId: number, instrumentId: number): Promise<void> {
        const response = await this.request<void>(`/watchlist/${watchlistId}/items/${instrumentId}`, {
            method: 'DELETE',
        });
        this.invalidateCache('/watchlist/');
        return response;
    }

    /* Watchlist dashboard logic commented out
    static async getDashboardWatchlists(): Promise<WatchlistInDb[]> {
        return this.request<WatchlistInDb[]>('/watchlist/dashboard');
    }

    static async setWatchlistShowOnDashboard(watchlistId: number, showOnDashboard: boolean): Promise<WatchlistInDb> {
        const response = await this.request<WatchlistInDb>(`/watchlist/show_on_dashboard/${watchlistId}?show_on_dashboard=${showOnDashboard}`, {
            method: 'PUT',
        });
        this.invalidateCache('/watchlist/');
        this.invalidateCache('/watchlist/dashboard');
        return response;
    }
    */

    // Suggestion Types
    static async getSuggestionTypes(): Promise<SuggestionTypeInDb[]> {
        return this.getCached<SuggestionTypeInDb[]>('/suggestions/types');
    }

    static async createSuggestionType(data: SuggestionTypeCreate): Promise<SuggestionTypeInDb> {
        const response = await this.request<SuggestionTypeInDb>('/suggestions/types', {
            method: 'POST',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/suggestions/types');
        return response;
    }

    static async getSuggestionTypeById(id: number): Promise<SuggestionTypeInDb> {
        return this.request<SuggestionTypeInDb>(`/suggestions/types/${id}`);
    }

    static async updateSuggestionType(id: number, data: SuggestionTypeUpdate): Promise<SuggestionTypeInDb> {
        const response = await this.request<SuggestionTypeInDb>(`/suggestions/types/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
        this.invalidateCache('/suggestions/types');
        return response;
    }

    static async deleteSuggestionType(id: number): Promise<void> {
        await this.request<void>(`/suggestions/types/${id}`, {
            method: 'DELETE',
        });
        this.invalidateCache('/suggestions/types');
    }

    // Suggestions
    static async getSuggestions(): Promise<SuggestionResponse[]> {
        return this.request<SuggestionResponse[]>('/suggestions/');
    }

    static async getMySuggestions(): Promise<SuggestionResponse[]> {
        return this.request<SuggestionResponse[]>('/suggestions/my');
    }

    static async createSuggestion(data: SuggestionCreate): Promise<SuggestionInDb> {
        return this.request<SuggestionInDb>('/suggestions/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    static async getSuggestionById(id: number): Promise<SuggestionInDb> {
        return this.request<SuggestionInDb>(`/suggestions/${id}`);
    }

    static async updateSuggestion(id: number, data: SuggestionUpdate): Promise<SuggestionInDb> {
        return this.request<SuggestionInDb>(`/suggestions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    static async deleteSuggestion(id: number): Promise<void> {
        return this.request<void>(`/suggestions/${id}`, {
            method: 'DELETE',
        });
    }
}
