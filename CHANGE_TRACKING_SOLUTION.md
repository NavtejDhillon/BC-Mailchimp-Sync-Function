# Business Central Change Tracking Solution

## Overview

Timer-based polling solution that syncs Business Central customers to Mailchimp every 5 minutes using change tracking.

## Why Not Webhooks

Business Central webhooks require Job Queue permissions which are not available to:
- Super User accounts
- Delegated Admin accounts
- Service Principal authentication

Change tracking eliminates these limitations.

## How It Works

Every 5 minutes:
1. Query BC API for customers modified since last check
2. Filter customers with valid emails
3. Sync to Mailchimp
4. Update last check timestamp

## Configuration

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

## Deployment

```bash
npm run build
func azure functionapp publish <function-app-name>
```

## Testing

```bash
npm run start
```

Or use test script:

```powershell
.\test-change-tracking.ps1
```

## Monitoring

Key metrics:
- Execution frequency: 12 times per hour
- Changes detected per execution
- Sync success rate
- Execution duration

View logs in Azure Portal > Function App > BCCustomerSync > Monitor

## Performance

- First run: Syncs all customers
- Subsequent runs: Only changed customers
- Typical sync: 0-5 customers per run
- API calls: 1 BC call + N Mailchimp calls

## Tuning Frequency

Default: Every 5 minutes

To adjust, edit `BCCustomerSync.ts`:

```typescript
// Every 10 minutes
schedule: '0 */10 * * * *'

// Every 2 minutes
schedule: '0 */2 * * * *'
```

## Comparison to Webhooks

| Aspect | Webhooks | Change Tracking |
|--------|----------|-----------------|
| Trigger | BC notification | Timer polling |
| Latency | Seconds | Up to 5 minutes |
| User requirements | Licensed user with Job Queue | Any auth method |
| Subscription management | Required, expires every 3 days | None |
| Reliability | Depends on Job Queue | Consistent |

## Troubleshooting

**No customers syncing**
- Check BC API credentials
- Verify customers have emails
- Confirm function executing

**Authentication failures**
- Verify credentials correct
- Check Azure AD permissions
- Confirm app registered in BC

**Mailchimp errors**
- Verify API key valid
- Check List ID correct
- Confirm merge fields exist
