import prisma from '../config/database';
import { ContactSource, ImportStatus } from '@prisma/client';
import { encrypt, decrypt, hashPhone } from '../utils/crypto.util';
import { logger } from '../config/logger';
import * as XLSX from 'xlsx';
import { parse as csvParse } from 'csv-parse/sync';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ContactInput {
    phone: string;
    name?: string;
    email?: string;
    company?: string;
    tags?: string[];
    customFields?: Record<string, string>;
}

export interface ContactFilters {
    search?: string;
    tags?: string[];
    source?: ContactSource;
    page?: number;
    limit?: number;
}

interface ParsedRow {
    phone: string;
    name?: string;
    email?: string;
    company?: string;
    [key: string]: string | undefined;
}

// ─── Service ────────────────────────────────────────────────────────────────

export class ContactService {

    /**
     * Create a single contact (upserts by phone hash)
     */
    public async createContact(factoryId: string, data: ContactInput) {
        if (!data.phone) throw new Error('Phone number is required');

        const phoneCleaned = data.phone.replace(/\D/g, '');
        if (phoneCleaned.length < 7 || phoneCleaned.length > 15) {
            throw new Error('Invalid phone number');
        }

        const phoneH = hashPhone(data.phone);
        const encryptedPhone = encrypt(data.phone);

        const contact = await prisma.contact.upsert({
            where: {
                factoryId_phoneHash: { factoryId, phoneHash: phoneH },
            },
            update: {
                name: data.name,
                email: data.email,
                company: data.company,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                customFields: data.customFields ? JSON.stringify(data.customFields) : undefined,
                updatedAt: new Date(),
            },
            create: {
                factoryId,
                phone: encryptedPhone,
                phoneHash: phoneH,
                name: data.name,
                email: data.email,
                company: data.company,
                tags: data.tags ? JSON.stringify(data.tags) : undefined,
                customFields: data.customFields ? JSON.stringify(data.customFields) : undefined,
                source: ContactSource.MANUAL,
            },
        });

        return this.decryptContact(contact);
    }

    /**
     * Bulk import contacts from parsed rows
     */
    public async bulkImportContacts(
        factoryId: string,
        rows: ParsedRow[],
        source: ContactSource,
        fileName: string
    ) {
        // Create import job
        const importJob = await prisma.importJob.create({
            data: {
                factoryId,
                fileName,
                totalRows: rows.length,
                status: ImportStatus.PROCESSING,
            },
        });

        let importedCount = 0;
        let skippedCount = 0;
        let failedCount = 0;
        const errors: any[] = [];

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                if (!row.phone) {
                    skippedCount++;
                    errors.push({ row: i + 1, error: 'Missing phone number' });
                    continue;
                }

                const phoneCleaned = row.phone.replace(/\D/g, '');
                if (phoneCleaned.length < 7 || phoneCleaned.length > 15) {
                    skippedCount++;
                    errors.push({ row: i + 1, error: 'Invalid phone number', phone: row.phone });
                    continue;
                }

                const phoneH = hashPhone(row.phone);
                const encryptedPhone = encrypt(row.phone);

                // Extract custom fields (anything beyond phone, name, email, company)
                const { phone, name, email, company, ...customFields } = row;
                const hasCustom = Object.keys(customFields).length > 0;

                await prisma.contact.upsert({
                    where: {
                        factoryId_phoneHash: { factoryId, phoneHash: phoneH },
                    },
                    update: {
                        name: name || undefined,
                        email: email || undefined,
                        company: company || undefined,
                        customFields: hasCustom ? JSON.stringify(customFields) : undefined,
                        updatedAt: new Date(),
                    },
                    create: {
                        factoryId,
                        phone: encryptedPhone,
                        phoneHash: phoneH,
                        name: name || undefined,
                        email: email || undefined,
                        company: company || undefined,
                        customFields: hasCustom ? JSON.stringify(customFields) : undefined,
                        source,
                    },
                });

                importedCount++;
            } catch (error) {
                failedCount++;
                errors.push({ row: i + 1, error: (error as Error).message });
            }
        }

        // Update import job
        const updatedJob = await prisma.importJob.update({
            where: { id: importJob.id },
            data: {
                importedCount,
                skippedCount,
                failedCount,
                status: ImportStatus.COMPLETED,
                errors: errors.length > 0 ? JSON.stringify(errors) : undefined,
            },
        });

        return updatedJob;
    }

    /**
     * Parse CSV buffer into rows
     */
    public parseCSV(buffer: Buffer): ParsedRow[] {
        const content = buffer.toString('utf-8');
        const records: Record<string, string>[] = csvParse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            relax_column_count: true,
        });

        return records.map((record) => this.normalizeRow(record));
    }

    /**
     * Parse Excel buffer into rows
     */
    public parseExcel(buffer: Buffer): ParsedRow[] {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const records: Record<string, string>[] = XLSX.utils.sheet_to_json(firstSheet, {
            defval: '',
            raw: false,
        });

        return records.map((record) => this.normalizeRow(record));
    }

    /**
     * Normalize a row's keys to standard names (phone, name, email, company)
     */
    private normalizeRow(record: Record<string, string>): ParsedRow {
        const normalized: ParsedRow = { phone: '' };
        const keyMap: Record<string, string> = {
            'phone': 'phone', 'phone_number': 'phone', 'phonenumber': 'phone',
            'mobile': 'phone', 'mobile_number': 'phone', 'mobilenumber': 'phone',
            'telephone': 'phone', 'tel': 'phone', 'contact': 'phone',
            'whatsapp': 'phone', 'whatsapp_number': 'phone', 'number': 'phone',
            'name': 'name', 'full_name': 'name', 'fullname': 'name',
            'customer_name': 'name', 'customername': 'name', 'contact_name': 'name',
            'first_name': 'name', 'firstname': 'name',
            'email': 'email', 'email_address': 'email', 'emailaddress': 'email',
            'mail': 'email',
            'company': 'company', 'company_name': 'company', 'companyname': 'company',
            'organization': 'company', 'org': 'company', 'business': 'company',
        };

        for (const [key, value] of Object.entries(record)) {
            const normalizedKey = key.toLowerCase().trim().replace(/\s+/g, '_');
            const mapped = keyMap[normalizedKey];
            if (mapped) {
                // If name already set and this is first_name, prepend
                if (mapped === 'name' && normalized.name && normalizedKey.includes('last')) {
                    normalized.name = `${normalized.name} ${value}`;
                } else if (mapped === 'name' && !normalized.name) {
                    normalized.name = value;
                } else {
                    (normalized as any)[mapped] = value;
                }
            } else {
                // Store as custom field
                normalized[normalizedKey] = value;
            }
        }

        return normalized;
    }

    /**
     * Get paginated contacts for a factory
     */
    public async getContacts(factoryId: string, filters: ContactFilters = {}) {
        const page = filters.page || 1;
        const limit = filters.limit || 50;
        const skip = (page - 1) * limit;

        const where: any = { factoryId };

        if (filters.search) {
            where.OR = [
                { name: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } },
                { company: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        if (filters.source) {
            where.source = filters.source;
        }

        const [contacts, total] = await Promise.all([
            prisma.contact.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.contact.count({ where }),
        ]);

        return {
            contacts: contacts.map((c: any) => this.decryptContact(c)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    /**
     * Get a single contact
     */
    public async getContact(factoryId: string, contactId: string) {
        const contact = await prisma.contact.findFirst({
            where: { id: contactId, factoryId },
            include: {
                listMembers: {
                    include: { contactList: { select: { id: true, name: true } } },
                },
            },
        });

        if (!contact) throw new Error('Contact not found');
        return this.decryptContact(contact);
    }

    /**
     * Update a contact
     */
    public async updateContact(factoryId: string, contactId: string, data: Partial<ContactInput>) {
        const existing = await prisma.contact.findFirst({
            where: { id: contactId, factoryId },
        });
        if (!existing) throw new Error('Contact not found');

        const updateData: any = {};
        if (data.name !== undefined) updateData.name = data.name;
        if (data.email !== undefined) updateData.email = data.email;
        if (data.company !== undefined) updateData.company = data.company;
        if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);
        if (data.customFields !== undefined) updateData.customFields = JSON.stringify(data.customFields);

        if (data.phone) {
            updateData.phone = encrypt(data.phone);
            updateData.phoneHash = hashPhone(data.phone);
        }

        const updated = await prisma.contact.update({
            where: { id: contactId },
            data: updateData,
        });

        return this.decryptContact(updated);
    }

    /**
     * Delete a contact
     */
    public async deleteContact(factoryId: string, contactId: string) {
        const contact = await prisma.contact.findFirst({
            where: { id: contactId, factoryId },
        });
        if (!contact) throw new Error('Contact not found');

        await prisma.contact.delete({ where: { id: contactId } });
        return { success: true };
    }

    /**
     * Delete multiple contacts
     */
    public async deleteContacts(factoryId: string, contactIds: string[]) {
        await prisma.contact.deleteMany({
            where: { id: { in: contactIds }, factoryId },
        });
        return { success: true, deleted: contactIds.length };
    }

    // ─── Contact Lists ──────────────────────────────────────────────────────

    public async createContactList(factoryId: string, name: string, description?: string, contactIds?: string[]) {
        const list = await prisma.contactList.create({
            data: { factoryId, name, description },
        });

        if (contactIds && contactIds.length > 0) {
            await prisma.contactListMember.createMany({
                data: contactIds.map((contactId) => ({
                    contactListId: list.id,
                    contactId,
                })),
                skipDuplicates: true,
            });

            await prisma.contactList.update({
                where: { id: list.id },
                data: { contactCount: contactIds.length },
            });
        }

        return list;
    }

    public async getContactLists(factoryId: string) {
        return prisma.contactList.findMany({
            where: { factoryId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { members: true } } },
        });
    }

    public async getContactListMembers(factoryId: string, listId: string, page = 1, limit = 50) {
        const list = await prisma.contactList.findFirst({
            where: { id: listId, factoryId },
        });
        if (!list) throw new Error('Contact list not found');

        const skip = (page - 1) * limit;

        const [members, total] = await Promise.all([
            prisma.contactListMember.findMany({
                where: { contactListId: listId },
                include: { contact: true },
                skip,
                take: limit,
            }),
            prisma.contactListMember.count({ where: { contactListId: listId } }),
        ]);

        return {
            list,
            members: members.map((m: any) => ({
                id: m.id,
                contact: this.decryptContact(m.contact),
            })),
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }

    public async addContactsToList(factoryId: string, listId: string, contactIds: string[]) {
        const list = await prisma.contactList.findFirst({
            where: { id: listId, factoryId },
        });
        if (!list) throw new Error('Contact list not found');

        await prisma.contactListMember.createMany({
            data: contactIds.map((contactId) => ({
                contactListId: listId,
                contactId,
            })),
            skipDuplicates: true,
        });

        const newCount = await prisma.contactListMember.count({
            where: { contactListId: listId },
        });

        await prisma.contactList.update({
            where: { id: listId },
            data: { contactCount: newCount },
        });

        return { success: true, contactCount: newCount };
    }

    public async removeContactsFromList(factoryId: string, listId: string, contactIds: string[]) {
        const list = await prisma.contactList.findFirst({
            where: { id: listId, factoryId },
        });
        if (!list) throw new Error('Contact list not found');

        await prisma.contactListMember.deleteMany({
            where: { contactListId: listId, contactId: { in: contactIds } },
        });

        const newCount = await prisma.contactListMember.count({
            where: { contactListId: listId },
        });

        await prisma.contactList.update({
            where: { id: listId },
            data: { contactCount: newCount },
        });

        return { success: true, contactCount: newCount };
    }

    public async deleteContactList(factoryId: string, listId: string) {
        const list = await prisma.contactList.findFirst({
            where: { id: listId, factoryId },
        });
        if (!list) throw new Error('Contact list not found');

        await prisma.contactList.delete({ where: { id: listId } });
        return { success: true };
    }

    // ─── Import History ─────────────────────────────────────────────────────

    public async getImportHistory(factoryId: string) {
        return prisma.importJob.findMany({
            where: { factoryId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Decrypt the phone field on a contact object
     */
    private decryptContact(contact: any) {
        try {
            return {
                ...contact,
                phone: decrypt(contact.phone),
                tags: contact.tags ? (typeof contact.tags === 'string' ? JSON.parse(contact.tags) : contact.tags) : [],
                customFields: contact.customFields ? (typeof contact.customFields === 'string' ? JSON.parse(contact.customFields) : contact.customFields) : {},
            };
        } catch {
            return {
                ...contact,
                phone: '[encrypted]',
                tags: [],
                customFields: {},
            };
        }
    }

    /**
     * Get contacts by IDs (with decrypted phones) — used by broadcast
     */
    public async getContactsByIds(factoryId: string, contactIds: string[]) {
        const contacts = await prisma.contact.findMany({
            where: { id: { in: contactIds }, factoryId },
        });
        return contacts.map((c: any) => this.decryptContact(c));
    }

    /**
     * Get all contacts from a list (with decrypted phones) — used by broadcast
     */
    public async getContactsFromList(factoryId: string, listId: string) {
        const members = await prisma.contactListMember.findMany({
            where: { contactListId: listId },
            include: { contact: true },
        });
        return members.map((m: any) => this.decryptContact(m.contact));
    }

    /**
     * Get total contacts count for a factory
     */
    public async getContactCount(factoryId: string) {
        return prisma.contact.count({ where: { factoryId } });
    }
}

export const contactService = new ContactService();
