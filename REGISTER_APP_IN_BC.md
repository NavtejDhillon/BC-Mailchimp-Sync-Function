# Register Azure AD Application in Business Central

## Overview

Azure AD permissions alone do not grant Business Central API access. The application must be registered within Business Central.

## Registration Steps

1. Open Business Central with SUPER permissions
2. Search for "Azure Active Directory Applications"
3. Click New
4. Enter application details:
   - Client ID: Your Azure AD client ID
   - Description: BC to Mailchimp Sync
   - State: Enabled
   - Contact Email: admin@company.com
5. Save
6. Assign permission sets:
   - D365 AUTOMATION
   - D365 BUS FULL ACCESS

## Verification

```powershell
.\test-change-tracking.ps1
```

Success indicators:
- HTTP 200 responses
- Customer data retrieved
- No authentication errors

## Troubleshooting

**Cannot find registration page**
- Search: "AAD Applications"
- Location: Settings > Application > Azure Active Directory Applications

**Permission denied**
- Request SUPER permissions temporarily
- Or ask administrator to register the app

**API calls fail after registration**
- Verify Client ID matches exactly
- Confirm State is Enabled
- Check permission sets assigned
- Wait 5-10 minutes for propagation
