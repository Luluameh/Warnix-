// lib/db/queries/incidents.ts
// Relational database queries for Incident management.

import { prisma } from '@/lib/db/prisma';
import type { IncidentInput, IncidentStatus } from '@/types';

export class IncidentQueries {
  static async listAll() {
    return prisma.incident.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agentRuns: {
          orderBy: { startedAt: 'desc' },
          take: 1,
        },
        citizenReport: {
          include: {
            cancellationRequests: true,
          },
        },
      },
    });
  }

  static async findById(id: string) {
    return prisma.incident.findUnique({
      where: { id },
      include: {
        agentRuns: {
          orderBy: { startedAt: 'desc' },
          include: {
            votes: true,
            negotiations: true,
            messages: true,
          },
        },
        deployments: true,
        resources: {
          include: { resource: true },
        },
        timeline: {
          orderBy: { timestamp: 'asc' },
        },
        citizenReport: {
          include: {
            cancellationRequests: {
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  static async create(input: IncidentInput) {
    const incident = await prisma.incident.create({
      data: {
        title: input.title,
        type: input.type,
        severity: input.severity,
        location: input.location,
        latitude: input.latitude,
        longitude: input.longitude,
        description: input.description,
        status: 'NEW',
        demoMode: input.demoMode ?? false,
      },
    });

    // Automatically log incident creation event to timeline
    await prisma.timelineEntry.create({
      data: {
        incidentId: incident.id,
        agentId: 'SYSTEM',
        category: 'REPORT',
        title: 'Incident report logged in EOC',
        detail: `Type: ${input.type}. Location: ${input.location}. Severity: ${input.severity}. Descr: ${input.description}`,
        severity: input.severity >= 8 ? 'CRITICAL' : input.severity >= 5 ? 'WARNING' : 'INFO',
      },
    });

    return incident;
  }

  static async updateStatus(id: string, status: IncidentStatus) {
    return prisma.incident.update({
      where: { id },
      data: { status },
    });
  }
}
