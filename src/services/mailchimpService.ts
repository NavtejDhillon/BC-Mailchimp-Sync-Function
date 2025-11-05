import mailchimp from '@mailchimp/mailchimp_marketing';
import crypto from 'crypto';
import { BCCustomerData } from './bcChangeTrackingService';

interface MailchimpContactData {
    email_address: string;
    status: 'subscribed' | 'unsubscribed' | 'cleaned' | 'pending';
    merge_fields: {
        FNAME: string;
        LNAME: string;
        PHONE?: string;
        COMPANY?: string;
        ADDRESS?: string;
        CITY?: string;
        STATE?: string;
        ZIP?: string;
        COUNTRY?: string;
        BCID?: string;
        BCNUMBER?: string;
    };
}

export class MailchimpService {
    private listId: string;

    constructor() {
        // Initialize Mailchimp client
        mailchimp.setConfig({
            apiKey: process.env.MAILCHIMP_API_KEY,
            server: process.env.MAILCHIMP_SERVER_PREFIX // e.g., 'us1', 'us2', etc.
        });

        this.listId = process.env.MAILCHIMP_LIST_ID || '';

        if (!this.listId) {
            throw new Error('MAILCHIMP_LIST_ID environment variable is not set');
        }
    }

    /**
     * Convert BC customer data to Mailchimp contact format
     */
    private mapBCCustomerToMailchimp(customer: BCCustomerData): MailchimpContactData {
        const names = this.parseDisplayName(customer.displayName);

        return {
            email_address: customer.email || '',
            status: 'subscribed',
            merge_fields: {
                FNAME: names.firstName,
                LNAME: names.lastName,
                PHONE: customer.phoneNumber || '',
                COMPANY: customer.displayName,
                ADDRESS: customer.addressLine1 || '',
                CITY: customer.city || '',
                STATE: customer.state || '',
                ZIP: customer.postalCode || '',
                COUNTRY: customer.country || '',
                BCID: customer.id,
                BCNUMBER: customer.number
            }
        };
    }

    /**
     * Parse display name into first and last name
     */
    private parseDisplayName(displayName: string): { firstName: string; lastName: string } {
        const parts = displayName.trim().split(' ');
        if (parts.length === 1) {
            return { firstName: parts[0], lastName: '' };
        }
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ');
        return { firstName, lastName };
    }

    /**
     * Create or update a contact in Mailchimp
     */
    async upsertContact(customer: BCCustomerData): Promise<void> {
        if (!customer.email) {
            throw new Error('Contact email is required');
        }

        const mailchimpContact = this.mapBCCustomerToMailchimp(customer);
        const subscriberHash = this.getSubscriberHash(mailchimpContact.email_address);

        try {
            // Try to update existing contact
            await mailchimp.lists.setListMember(
                this.listId,
                subscriberHash,
                {
                    email_address: mailchimpContact.email_address,
                    status_if_new: mailchimpContact.status,
                    merge_fields: mailchimpContact.merge_fields
                }
            );

            console.log(`Successfully upserted contact: ${mailchimpContact.email_address}`);
        } catch (error: any) {
            console.error('Error upserting contact to Mailchimp:', error.response?.body || error.message);
            throw error;
        }
    }

    /**
     * Delete a contact from Mailchimp
     */
    async deleteContact(email: string): Promise<void> {
        const subscriberHash = this.getSubscriberHash(email);

        try {
            await mailchimp.lists.deleteListMemberPermanent(
                this.listId,
                subscriberHash
            );
            console.log(`Successfully deleted contact: ${email}`);
        } catch (error: any) {
            console.error('Error deleting contact from Mailchimp:', error.response?.body || error.message);
            throw error;
        }
    }

    /**
     * Add tags to a contact
     */
    async addTagsToContact(email: string, tags: string[]): Promise<void> {
        const subscriberHash = this.getSubscriberHash(email);

        try {
            await mailchimp.lists.updateListMemberTags(
                this.listId,
                subscriberHash,
                {
                    tags: tags.map(name => ({ name, status: 'active' as const }))
                }
            );
            console.log(`Successfully added tags to contact: ${email}`);
        } catch (error: any) {
            console.error('Error adding tags to contact:', error.response?.body || error.message);
            throw error;
        }
    }

    /**
     * Generate subscriber hash (MD5 of lowercase email)
     */
    private getSubscriberHash(email: string): string {
        return crypto
            .createHash('md5')
            .update(email.toLowerCase())
            .digest('hex');
    }
}
