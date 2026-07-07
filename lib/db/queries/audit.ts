// lib/db/queries/audit.ts
import { prisma } from '@/lib/db/prisma';

export interface AuditLogInput {
  category: 'USER' | 'COMMANDER' | 'SYSTEM' | 'AGENT';
  action: string;
  details: string;
  performedBy: string;
  apiRoute: string;
  incidentId?: string;
  oldStatus?: string;
  newStatus?: string;
  metadata?: any;
}

export class AuditQueries {
  static async log(input: AuditLogInput) {
    const detailsString = `${input.details} (Performed by: ${input.performedBy} on ${input.apiRoute}${
      input.oldStatus && input.newStatus ? `, Status: ${input.oldStatus} -> ${input.newStatus}` : ''
    })`;

    return prisma.auditLog.create({
      data: {
        category: input.category,
        action: input.action,
        details: detailsString,
      },
    });
  }
}
