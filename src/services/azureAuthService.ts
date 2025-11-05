import { ClientSecretCredential, DefaultAzureCredential } from '@azure/identity';
import { ConfidentialClientApplication } from '@azure/msal-node';

export interface TokenResponse {
    accessToken: string;
    expiresOn: Date;
}

export class AzureAuthService {
    private cachedToken?: TokenResponse;
    private readonly scope = 'https://api.businesscentral.dynamics.com/.default';

    /**
     * Get access token using Azure AD authentication
     * Supports both Service Principal and Managed Identity
     */
    async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.cachedToken && this.isTokenValid(this.cachedToken.expiresOn)) {
            console.log('Using cached access token');
            return this.cachedToken.accessToken;
        }

        // Get new token
        const useManagedIdentity = process.env.USE_MANAGED_IDENTITY === 'true';

        if (useManagedIdentity) {
            return await this.getTokenWithManagedIdentity();
        } else {
            return await this.getTokenWithServicePrincipal();
        }
    }

    /**
     * Get token using Managed Identity (recommended for Azure-hosted apps)
     */
    private async getTokenWithManagedIdentity(): Promise<string> {
        try {
            console.log('Acquiring token using Managed Identity...');

            const credential = new DefaultAzureCredential();
            const tokenResponse = await credential.getToken(this.scope);

            if (!tokenResponse) {
                throw new Error('Failed to acquire token with Managed Identity');
            }

            this.cachedToken = {
                accessToken: tokenResponse.token,
                expiresOn: tokenResponse.expiresOnTimestamp
                    ? new Date(tokenResponse.expiresOnTimestamp)
                    : new Date(Date.now() + 3600000) // Default 1 hour
            };

            console.log('Token acquired successfully via Managed Identity');
            return this.cachedToken.accessToken;
        } catch (error: any) {
            console.error('Error acquiring token with Managed Identity:', error.message);
            throw new Error(
                'Failed to acquire token with Managed Identity. ' +
                'Ensure Managed Identity is enabled and has permissions. ' +
                'Error: ' + error.message
            );
        }
    }

    /**
     * Get token using Service Principal (Client ID + Secret)
     */
    private async getTokenWithServicePrincipal(): Promise<string> {
        const tenantId = process.env.BC_TENANT_ID;
        const clientId = process.env.BC_CLIENT_ID;
        const clientSecret = process.env.BC_CLIENT_SECRET;

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error(
                'Missing Azure AD credentials. Required: BC_TENANT_ID, BC_CLIENT_ID, BC_CLIENT_SECRET'
            );
        }

        try {
            console.log('Acquiring token using Service Principal...');

            // Option 1: Using @azure/identity (recommended)
            const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
            const tokenResponse = await credential.getToken(this.scope);

            if (!tokenResponse) {
                throw new Error('Failed to acquire token with Service Principal');
            }

            this.cachedToken = {
                accessToken: tokenResponse.token,
                expiresOn: tokenResponse.expiresOnTimestamp
                    ? new Date(tokenResponse.expiresOnTimestamp)
                    : new Date(Date.now() + 3600000) // Default 1 hour
            };

            console.log('Token acquired successfully via Service Principal');
            return this.cachedToken.accessToken;
        } catch (error: any) {
            console.error('Error acquiring token with Service Principal:', error.message);
            throw new Error(
                'Failed to acquire token with Service Principal. ' +
                'Verify BC_TENANT_ID, BC_CLIENT_ID, and BC_CLIENT_SECRET are correct. ' +
                'Error: ' + error.message
            );
        }
    }

    /**
     * Alternative method using MSAL directly
     */
    private async getTokenWithMSAL(): Promise<string> {
        const tenantId = process.env.BC_TENANT_ID;
        const clientId = process.env.BC_CLIENT_ID;
        const clientSecret = process.env.BC_CLIENT_SECRET;

        if (!tenantId || !clientId || !clientSecret) {
            throw new Error('Missing Azure AD credentials');
        }

        try {
            const msalConfig = {
                auth: {
                    clientId: clientId,
                    authority: `https://login.microsoftonline.com/${tenantId}`,
                    clientSecret: clientSecret
                }
            };

            const cca = new ConfidentialClientApplication(msalConfig);

            const tokenRequest = {
                scopes: [this.scope]
            };

            const response = await cca.acquireTokenByClientCredential(tokenRequest);

            if (!response || !response.accessToken) {
                throw new Error('No access token returned from MSAL');
            }

            this.cachedToken = {
                accessToken: response.accessToken,
                expiresOn: response.expiresOn || new Date(Date.now() + 3600000)
            };

            return this.cachedToken.accessToken;
        } catch (error: any) {
            console.error('Error acquiring token with MSAL:', error.message);
            throw error;
        }
    }

    /**
     * Check if token is still valid (with 5 minute buffer)
     */
    private isTokenValid(expiresOn: Date): boolean {
        const bufferMinutes = 5;
        const bufferMs = bufferMinutes * 60 * 1000;
        const now = new Date();

        return expiresOn.getTime() > (now.getTime() + bufferMs);
    }

    /**
     * Clear cached token (force refresh on next request)
     */
    clearCache(): void {
        this.cachedToken = undefined;
    }

    /**
     * Get token info for debugging
     */
    getTokenInfo(): { isValid: boolean; expiresOn?: Date } {
        if (!this.cachedToken) {
            return { isValid: false };
        }

        return {
            isValid: this.isTokenValid(this.cachedToken.expiresOn),
            expiresOn: this.cachedToken.expiresOn
        };
    }
}
