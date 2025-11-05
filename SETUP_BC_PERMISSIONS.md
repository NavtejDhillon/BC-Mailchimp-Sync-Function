# Business Central API Permissions Setup

## Prerequisites

- Azure AD Global Administrator role
- Business Central SUPER permissions
- Azure AD application with client ID and secret

## Part 1: Azure AD Permissions

### Add API Permissions

1. Open [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations > Your App
3. Select API permissions > Add a permission
4. Choose APIs my organization uses > Dynamics 365 Business Central
5. Select Application permissions
6. Choose API.ReadWrite.All or Automation.ReadWrite.All
7. Click Add permissions
8. Click Grant admin consent for [organization]

## Part 2: Register in Business Central

### Create Application Record

1. Open Business Central
2. Search for "Azure Active Directory Applications"
3. Click New
4. Enter:
   - Client ID: Your Azure AD application client ID
   - Description: BC to Mailchimp Integration
   - State: Enabled
   - Contact Email: Your email
5. Save

### Assign Permissions

Add permission sets to the application:

- D365 AUTOMATION (required)
- D365 BUS FULL ACCESS (required)

## Verification

Test with PowerShell:

```powershell
.\test-change-tracking.ps1
```

Expected: Authentication succeeds, customer data retrieved.

## Troubleshooting

**401 Unauthorized**
- Check Azure AD permissions granted
- Verify admin consent completed
- Confirm app registered in Business Central

**403 Forbidden**
- Check permission sets assigned
- Verify State is Enabled
- Wait 5-10 minutes for propagation

## Security

- Use minimum required permissions in production
- Remove SUPER after testing
- Rotate client secrets regularly
- Monitor audit logs
