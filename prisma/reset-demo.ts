/**
 * Demo Reset Script
 * Archives all existing incidents so the dashboard shows clean for the demo video.
 * Run with: npx ts-node prisma/reset-demo.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function resetDemo() {
  console.log('🔄 Archiving all existing incidents for demo reset...');

  const result = await prisma.incident.updateMany({
    data: {
      status: 'ARCHIVED',
    },
  });

  console.log(`✅ Archived ${result.count} incidents. Dashboard is now clean.`);
  await prisma.$disconnect();
}

resetDemo().catch((e) => {
  console.error('❌ Reset failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
