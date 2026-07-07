// lib/db/queries/resources.ts
import { prisma } from '@/lib/db/prisma';

export class ResourceQueries {
  static async listAll() {
    return prisma.resource.findMany({
      orderBy: { callSign: 'asc' },
    });
  }

  static async findByType(type: string) {
    return prisma.resource.findMany({
      where: { type },
    });
  }

  static async updateStatus(id: string, status: string) {
    return prisma.resource.update({
      where: { id },
      data: { status },
    });
  }
}
