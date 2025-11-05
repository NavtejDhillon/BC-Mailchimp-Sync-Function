import axios, { AxiosInstance } from 'axios';
import { AzureAuthService } from './azureAuthService';

export class BCApiService {
    private client: AxiosInstance;
    private baseUrl: string;
    private companyId: string;
    private authService: AzureAuthService;

    constructor() {
        const tenantId = process.env.BC_TENANT_ID || '';
        const environment = process.env.BC_ENVIRONMENT || 'production';
        this.companyId = process.env.BC_COMPANY_ID || '';

        // Initialize Azure AD authentication service
        this.authService = new AzureAuthService();

        // BC API v2.0 base URL
        this.baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/v2.0`;

        // Create axios instance (auth header will be added per request)
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add request interceptor to inject fresh token on each request
        this.client.interceptors.request.use(
            async (config) => {
                const token = await this.authService.getAccessToken();
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        if (!this.companyId) {
            throw new Error('BC_COMPANY_ID environment variable is required');
        }
    }

    /**
     * Get the base URL for the API
     */
    getBaseUrl(): string {
        return this.baseUrl;
    }

    /**
     * Get the company ID
     */
    getCompanyId(): string {
        return this.companyId;
    }

    /**
     * Get the configured axios client with authentication
     */
    getClient(): AxiosInstance {
        return this.client;
    }
}
