# Business Central to Mailchimp Integration

Azure Functions application that synchronizes customer data from Business Central to Mailchimp using change tracking.

## Features

- Automated customer synchronization every 5 minutes
- Change tracking for efficient delta syncing
- Email validation and filtering
- Service Principal and Managed Identity authentication

## Installation

```bash
npm install
cp .env.example .env
```

## Configuration

Edit `.env` with required variables:

```env
# Mailchimp
MAILCHIMP_API_KEY=your_api_key
MAILCHIMP_SERVER_PREFIX=us1
MAILCHIMP_LIST_ID=your_list_id

# Business Central
BC_TENANT_ID=your_tenant_id
BC_ENVIRONMENT=Production
BC_COMPANY_ID=your_company_id

# Authentication
USE_MANAGED_IDENTITY=false
BC_CLIENT_ID=your_client_id
BC_CLIENT_SECRET=your_client_secret
```

## Deployment

```bash
npm run build
func azure functionapp publish <your-function-app-name>
```

Configure application settings in Azure Portal with values from `.env`.

## Architecture

Timer-triggered function runs every 5 minutes:
1. Query Business Central for customers modified since last check
2. Filter customers with valid email addresses
3. Sync to Mailchimp audience

## Field Mapping

| Business Central | Mailchimp |
|-----------------|-----------|
| email | email_address |
| displayName | FNAME, LNAME, COMPANY |
| phoneNumber | PHONE |
| addressLine1 | ADDRESS |
| city | CITY |
| state | STATE |
| postalCode | ZIP |
| country | COUNTRY |
| id | BCID |
| number | BCNUMBER |

## Monitoring

View logs: Azure Portal > Function App > BCCustomerSync > Monitor

Key metrics:
- Execution frequency: Every 5 minutes
- Changes detected per run
- Sync success rate

## Troubleshooting

**No customers syncing**
- Verify BC API credentials
- Check customers have email addresses
- Review function logs

**Authentication errors**
- Verify BC_TENANT_ID, BC_CLIENT_ID, BC_CLIENT_SECRET
- Confirm Azure AD permissions granted
- Check application registered in BC

**Mailchimp errors**
- Verify API key valid
- Confirm List ID correct
- Check merge fields exist in audience

## License

MIT
