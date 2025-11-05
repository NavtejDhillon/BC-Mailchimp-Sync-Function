import { app, InvocationContext, Timer } from "@azure/functions";
import { config } from 'dotenv';
import { BCChangeTrackingService, BCCustomerData } from '../services/bcChangeTrackingService';
import { MailchimpService } from '../services/mailchimpService';

// Load environment variables
config();

export async function BCCustomerSync(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('BC Customer Sync triggered at:', new Date().toISOString());

    try {
        // Initialize services
        const changeTrackingService = new BCChangeTrackingService();
        const mailchimpService = new MailchimpService();

        context.log('Checking for customer changes in Business Central...');

        // Get changed customers since last check
        const changedCustomers = await changeTrackingService.getChangedCustomers();

        if (changedCustomers.length === 0) {
            context.log('No customer changes detected');
            return;
        }

        context.log(`Found ${changedCustomers.length} changed customer(s)`);

        let syncedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];

        // Process each changed customer
        for (const customer of changedCustomers) {
            try {
                // Skip customers without valid email
                if (!changeTrackingService.hasValidEmail(customer)) {
                    context.log(`Skipping customer ${customer.displayName} - no valid email`);
                    skippedCount++;
                    continue;
                }

                context.log(`Syncing customer: ${customer.displayName} (${customer.email})`);

                // Sync to Mailchimp
                await mailchimpService.upsertContact(customer);

                syncedCount++;
                context.log(`✓ Synced: ${customer.displayName}`);

            } catch (error: any) {
                const errorMsg = `Failed to sync ${customer.displayName}: ${error.message}`;
                context.error(errorMsg);
                errors.push(errorMsg);
            }
        }

        // Summary
        context.log('========================================');
        context.log('BC Customer Sync Summary:');
        context.log(`  Total changes detected: ${changedCustomers.length}`);
        context.log(`  Successfully synced: ${syncedCount}`);
        context.log(`  Skipped (no email): ${skippedCount}`);
        context.log(`  Errors: ${errors.length}`);
        context.log('========================================');

        if (errors.length > 0) {
            context.warn('Sync completed with errors:', errors);
        }

    } catch (error: any) {
        context.error('Error during BC Customer Sync:', error.message);

        // Check if it's an authentication error
        if (error.response?.status === 401) {
            context.error('Authentication failed. Check Azure AD credentials.');
        }

        // Check if it's a permission error
        if (error.response?.status === 403) {
            context.error('Permission denied. Ensure service principal has API access to Business Central.');
        }

        throw error;
    }
}

// Run every 5 minutes (CRON: "0 */5 * * * *")
// This polls BC for changes every 5 minutes and syncs to Mailchimp
app.timer('BCCustomerSync', {
    schedule: '0 */5 * * * *', // Every 5 minutes
    handler: BCCustomerSync
});
