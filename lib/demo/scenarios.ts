// lib/demo/scenarios.ts
import type { IncidentInput } from '@/types';

export const DEMO_INCIDENTS: IncidentInput[] = [
  {
    title: 'Severe Flooding — Riverside District',
    type: 'FLOOD',
    severity: 7,
    location: 'Riverside District, Sector B',
    latitude: 51.505,
    longitude: -0.09,
    description: 'Rapidly rising floodwaters after intense storm surge. Bridge A reported submerged. Over 200 residents reported isolated in low-lying housing blocks. Immediate search and rescue required.',
    demoMode: true,
  },
  {
    title: 'Industrial Earthquake collapse — Sector 4',
    type: 'EARTHQUAKE',
    severity: 9,
    location: 'Industrial Zone, East Sector',
    latitude: 51.515,
    longitude: -0.07,
    description: 'M6.2 regional earthquake strike. Structural failures reported at 3 manufacturing plants. Multiple employees trapped under concrete panels. Spontaneous fire broke out. Possible gas infrastructure rupture.',
    demoMode: true,
  },
  {
    title: 'Hazardous Warehouse Fire — Port Area',
    type: 'FIRE',
    severity: 8,
    location: 'Warehouse District, Port North',
    latitude: 51.495,
    longitude: -0.11,
    description: 'Rapidly spreading warehouse structure fire. High risk of Hazmat material containment in contiguous building. Spreading particulate matter plume direction shifting south-east towards residential sectors.',
    demoMode: true,
  },
];
