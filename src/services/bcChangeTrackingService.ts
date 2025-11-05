import axios, { AxiosInstance } from 'axios';
import { AzureAuthService } from './azureAuthService';

export interface BCCustomerData {
    id: string;
    number: string;
    displayName: string;
    type?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    phoneNumber?: string;
    email?: string;
    website?: string;
    taxLiable?: boolean;
    taxAreaId?: string;
    taxAreaDisplayName?: string;
    taxRegistrationNumber?: string;
    currencyId?: string;
    currencyCode?: string;
    paymentTermsId?: string;
    shipmentMethodId?: string;
    paymentMethodId?: string;
    blocked?: string;
    lastModifiedDateTime?: string;
}

export interface BCChangeTrackingResponse {
    '@odata.context': string;
    value: BCCustomerData[];
}

export class BCChangeTrackingService {
    private baseUrl: string;
    private authService: AzureAuthService;
    private apiClient: AxiosInstance;
    private lastCheckTime: Date | null = null;
    private readonly LAST_CHECK_TIME_KEY = 'bc_customers_last_check_time';

    constructor() {
        const tenantId = process.env.BC_TENANT_ID!;
        const environment = process.env.BC_ENVIRONMENT || 'Production';
        const companyId = process.env.BC_COMPANY_ID!;

        this.baseUrl = `https://api.businesscentral.dynamics.com/v2.0/${tenantId}/${environment}/api/v2.0/companies(${companyId})`;
        this.authService = new AzureAuthService();

        this.apiClient = axios.create({ baseURL: this.baseUrl });
        this.apiClient.interceptors.request.use(async (config) => {
            const token = await this.authService.getAccessToken();
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });

        this.loadLastCheckTime();
    }

    private loadLastCheckTime(): void {
        const storedTime = process.env[this.LAST_CHECK_TIME_KEY];
        this.lastCheckTime = storedTime ? new Date(storedTime) : null;
    }

    private saveLastCheckTime(time: Date): void {
        this.lastCheckTime = time;
        process.env[this.LAST_CHECK_TIME_KEY] = time.toISOString();
    }

    async getChangedCustomers(): Promise<BCCustomerData[]> {
        try {
            const checkTime = new Date();
            let url = `${this.baseUrl}/customers`;

            if (this.lastCheckTime) {
                const filterTime = new Date(this.lastCheckTime.getTime() - 60000);
                const filterTimeStr = filterTime.toISOString();
                url += `?$filter=lastModifiedDateTime gt ${filterTimeStr}`;
            }

            const response = await this.apiClient.get<BCChangeTrackingResponse>(url);
            this.saveLastCheckTime(checkTime);

            return response.data.value || [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`BC Change Tracking failed: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    resetLastCheckTime(): void {
        this.lastCheckTime = null;
        delete process.env[this.LAST_CHECK_TIME_KEY];
    }

    async getAllCustomers(): Promise<BCCustomerData[]> {
        try {
            const response = await this.apiClient.get<BCChangeTrackingResponse>(`${this.baseUrl}/customers`);
            return response.data.value || [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                throw new Error(`BC Get All Customers failed: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`);
            }
            throw error;
        }
    }

    hasValidEmail(customer: BCCustomerData): boolean {
        return !!customer.email && customer.email.length > 0 && customer.email.includes('@');
    }
}
