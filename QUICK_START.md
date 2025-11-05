# Quick Start Guide

## Prerequisites

- Azure subscription
- Business Central with API access
- Mailchimp account
- Node.js 18.x or later

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Get Mailchimp Credentials

- API Key: Account > Extras > API Keys
- Server Prefix: From API URL (e.g., us1)
- List ID: Audience > Settings > Audience ID

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
MAILCHIMP_API_KEY=your_api_key
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_LIST_ID=your_list_id

BC_TENANT_ID=your_tenant_id
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your_company_id

USE_MANAGED_IDENTITY=false
BC_CLIENT_ID=your_client_id
BC_CLIENT_SECRET=your_client_secret
```

### 4. Azure AD Setup

1. Register application in Azure AD
2. Create client secret
3. Grant API permissions for Business Central
4. Grant admin consent

See [REGISTER_APP_IN_BC.md](REGISTER_APP_IN_BC.md) for details.

### 5. Deploy

```bash
npm run build
az login
func azure functionapp publish <your-function-app-name>
```

Add environment variables to Function App Configuration in Azure Portal.

### 6. Test

1. Create customer in Business Central with email
2. Wait 5 minutes
3. Check Azure Function logs
4. Verify customer in Mailchimp

## Common Issues

**Authentication failure**
- Verify credentials correct
- Confirm Azure AD permissions granted
- Check app registered in BC

**No customers syncing**
- Customers must have email addresses
- Check BC API permissions
- Review function logs

**Mailchimp errors**
- Verify API key valid
- Confirm List ID correct
- Check merge fields exist

## Next Steps

- Configure Azure Key Vault for secrets
- Set up Application Insights
- Configure alerts for failures
- Adjust sync frequency if needed
