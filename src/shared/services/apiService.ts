import type {
    LoginRequest, LoginResponse, UserWithPassword, UserInDb,
    InstrumentInDb, InstrumentCreate, InstrumentUpdate,
    ExchangeInDb, ExchangeCreate,
    ProviderInDb, ProviderCreate,
    PriceHistoryDailyInDb, PriceHistoryIntradayInDb
} from '../types/apiTypes';

const BASE_URL = 'http://localhost:8000'; // Adjust as needed
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

    // Exchanges
    static async getExchanges(): Promise<ExchangeInDb[]> {
        return this.getCached<ExchangeInDb[]>('/exchange/');
    }

    static async createExchange(data: ExchangeCreate): Promise<ExchangeInDb> {
        return this.request<ExchangeInDb>('/exchange/', {
            method: 'POST',
            body: JSON.stringify(data),
        });
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
}
