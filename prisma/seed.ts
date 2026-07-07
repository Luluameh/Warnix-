// prisma/seed.ts
// Seeding 25 historical incidents (Institutional Memory for ARCHIVE agent)
// and initial emergency resource vehicles (Ambulances, Fire Trucks, Rescue Teams, Helicopters).

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const HISTORICAL_INCIDENTS = [
  {
    type: 'FLOOD',
    title: 'Rhine River Basin Overspill',
    summary: 'Massive river flooding after sudden spring snowmelt. Submerged key structural crossings.',
    location: 'Cologne Sector, North',
    year: 2021,
    severity: 8,
    lessonsLearned: ['Staged high-ground evacuations prevented 85% of casualties', 'Primary route blockage delayed heavy ambulances by 35 minutes'],
    successfulStrategies: ['Using citizen volunteer boats for rapid shallow water extractions', 'Deploying mobile water barriers at sector 3'],
    failures: ['Relying on standard routing engines which led vehicles into submerged bypasses'],
    resourcesUsed: { AMBULANCE: 6, VOLUNTEER_GROUP: 4, RESCUE_TEAM: 3 },
    outcome: 'Successful evacuation of 420 citizens; structural damage high, loss of life low.',
    tags: ['flood', 'river', 'bridge-collapse', 'routing'],
  },
  {
    type: 'EARTHQUAKE',
    title: 'Sector 9 Industrial Tremor',
    summary: 'M5.9 earthquake targeting chemical manufacturing and warehouse buildings. Structural concrete collapse.',
    location: 'Sector 9 Industrial Zone',
    year: 2023,
    severity: 9,
    lessonsLearned: ['Secondary gas ruptures caused 60% of damage post-impact', 'Heavy rescue units (HRUs) suffered 2-hour dispatch delays due to urban rubble blockage'],
    successfulStrategies: ['Triage zones established in adjacent open parks', 'Deploying volunteer structural support teams for immediate shoring'],
    failures: ['Failure to secure utilities valves early led to active fires in sector 4'],
    resourcesUsed: { RESCUE_TEAM: 8, FIRE_TRUCK: 6, AMBULANCE: 10, HELICOPTER: 1 },
    outcome: '124 saved, 14 casualties. Response compromised by active utility hazards.',
    tags: ['earthquake', 'rubble', 'trapped-citizens', 'gas-leak', 'structural-collapse'],
  },
  {
    type: 'FIRE',
    title: 'Port Grain Silo Explosion and Fire',
    summary: 'Explosion at Port Silo caused intense warehouse fires containing hazardous dust.',
    location: 'Port District, Silo E',
    year: 2020,
    severity: 7,
    lessonsLearned: ['Wind shifts altered plume direction, requiring fast residential alerts', 'Water scarcity near port resolved by drafting sea water'],
    successfulStrategies: ['Sea-water extraction pumps deployed by fire boat', 'Social media alerts used for immediate shelter activation'],
    failures: ['Delay in Hazmat identification led to minor injuries among initial responders'],
    resourcesUsed: { FIRE_TRUCK: 12, AMBULANCE: 4, HELICOPTER: 2 },
    outcome: 'Fire contained within 14 hours. Zero residential casualties.',
    tags: ['fire', 'hazmat', 'port', 'explosion', 'wind-plume'],
  },
  {
    type: 'POWER_OUTAGE',
    title: 'Metro Grid Cascade Failure',
    summary: 'Severe summer heatwave caused overload on substation 4, tripping the regional grid.',
    location: 'Metropolitan Core',
    year: 2022,
    severity: 6,
    lessonsLearned: ['Hospital backup generator maintenance check frequency was insufficient', 'Water treatment pumps went offline after 4 hours'],
    successfulStrategies: ['Deploying mobile generators to water towers', 'Establishing street-level information points using police vehicles'],
    failures: ['Inability to communicate with subway trains stranded underground for 3 hours'],
    resourcesUsed: { RESCUE_TEAM: 4, VOLUNTEER_GROUP: 8 },
    outcome: 'Power restored in 18 hours. Grid safety upgraded.',
    tags: ['power-outage', 'grid', 'substation', 'infrastructure', 'heatwave'],
  },
  {
    type: 'CHEMICAL_SPILL',
    title: 'Sector 2 Rail Tanker Rupture',
    summary: 'Derailment of cargo tanker carrying hydrochloric acid near residential boundary.',
    location: 'Sector 2 Transit Corridor',
    year: 2024,
    severity: 8,
    lessonsLearned: ['Acidity plume neutralized with lime powder deployment', 'Evacuation corridor selection must follow upwind vector'],
    successfulStrategies: ['Lime-powder spreader trucks neutralised spill zone', 'Realtime wind sensors directed evacuation route mapping'],
    failures: ['Initial route proposal sent evacuation vehicles downwind of the acid plume'],
    resourcesUsed: { FIRE_TRUCK: 4, RESCUE_TEAM: 2, AMBULANCE: 5, HELICOPTER: 1 },
    outcome: 'Spill neutralized. 3,000 citizens evacuated successfully.',
    tags: ['chemical-spill', 'acid', 'railway', 'gas-plume', 'evacuation'],
  },
];

// Generate additional incidents to satisfy the 25 count
for (let i = 6; i <= 25; i++) {
  const types = ['FLOOD', 'EARTHQUAKE', 'FIRE', 'POWER_OUTAGE', 'CHEMICAL_SPILL', 'WILDFIRE', 'STORM'];
  const type = types[i % types.length];
  HISTORICAL_INCIDENTS.push({
    type,
    title: `Precedent ${type} Case ${i}`,
    summary: `Historical review of a severity ${4 + (i % 6)} incident involving ${type.toLowerCase()} response in Sector ${i % 10}.`,
    location: `Sector ${i % 10} District`,
    year: 2010 + (i % 15),
    severity: 4 + (i % 6),
    lessonsLearned: [`Lesson ${i}a: Coordinate resource deployment early`, `Lesson ${i}b: Verify secondary data points before routing`],
    successfulStrategies: ['Deployed local volunteers for secondary triage support'],
    failures: ['Failed to monitor utility lines near collapse boundaries'],
    resourcesUsed: { AMBULANCE: 2, RESCUE_TEAM: 1 } as any,
    outcome: 'Incident resolved within standard response timeframe.',
    tags: [type.toLowerCase(), `sector-${i % 10}`, 'historical'],
  });
}

const RESOURCES = [
  // Ambulances
  { type: 'AMBULANCE', name: 'Ambulance Unit 01', callSign: 'AMB-01', status: 'AVAILABLE', latitude: 51.502, longitude: -0.091, homeBase: 'Base Central' },
  { type: 'AMBULANCE', name: 'Ambulance Unit 02', callSign: 'AMB-02', status: 'AVAILABLE', latitude: 51.503, longitude: -0.089, homeBase: 'Base Central' },
  { type: 'AMBULANCE', name: 'Ambulance Unit 03', callSign: 'AMB-03', status: 'AVAILABLE', latitude: 51.508, longitude: -0.095, homeBase: 'Base North' },
  { type: 'AMBULANCE', name: 'Ambulance Unit 04', callSign: 'AMB-04', status: 'AVAILABLE', latitude: 51.512, longitude: -0.075, homeBase: 'Base East' },
  { type: 'AMBULANCE', name: 'Ambulance Unit 05', callSign: 'AMB-05', status: 'AVAILABLE', latitude: 51.492, longitude: -0.115, homeBase: 'Base South' },

  // Fire Trucks
  { type: 'FIRE_TRUCK', name: 'Fire Engine 01', callSign: 'ENG-01', status: 'AVAILABLE', latitude: 51.501, longitude: -0.093, homeBase: 'Station Central' },
  { type: 'FIRE_TRUCK', name: 'Fire Engine 02', callSign: 'ENG-02', status: 'AVAILABLE', latitude: 51.509, longitude: -0.092, homeBase: 'Station North' },
  { type: 'FIRE_TRUCK', name: 'Fire Engine 03', callSign: 'ENG-03', status: 'AVAILABLE', latitude: 51.514, longitude: -0.071, homeBase: 'Station East' },
  { type: 'FIRE_TRUCK', name: 'Ladder Truck 01', callSign: 'LAD-01', status: 'AVAILABLE', latitude: 51.491, longitude: -0.111, homeBase: 'Station South' },

  // Rescue Teams
  { type: 'RESCUE_TEAM', name: 'Search & Rescue Alpha', callSign: 'SAR-A', status: 'AVAILABLE', latitude: 51.504, longitude: -0.092, homeBase: 'EOC Headquarters' },
  { type: 'RESCUE_TEAM', name: 'Search & Rescue Beta', callSign: 'SAR-B', status: 'AVAILABLE', latitude: 51.511, longitude: -0.074, homeBase: 'EOC East Outpost' },
  { type: 'RESCUE_TEAM', name: 'Heavy Extraction Unit', callSign: 'HRU-01', status: 'AVAILABLE', latitude: 51.493, longitude: -0.112, homeBase: 'EOC South Outpost' },

  // Helicopters
  { type: 'HELICOPTER', name: 'Lifesaver Heli 01', callSign: 'HELI-01', status: 'AVAILABLE', latitude: 51.505, longitude: -0.09, homeBase: 'EOC Heliport' },
  { type: 'HELICOPTER', name: 'Lifesaver Heli 02', callSign: 'HELI-02', status: 'AVAILABLE', latitude: 51.515, longitude: -0.07, homeBase: 'East Airport' },

  // Volunteer Groups
  { type: 'VOLUNTEER_GROUP', name: 'Volunteer Group Delta', callSign: 'VOL-D', status: 'AVAILABLE', latitude: 51.507, longitude: -0.088, homeBase: 'Riverside Community Centre' },
  { type: 'VOLUNTEER_GROUP', name: 'Civil Aid Team Omega', callSign: 'VOL-O', status: 'AVAILABLE', latitude: 51.498, longitude: -0.105, homeBase: 'South Hall' },
];

async function main() {
  console.log('Clearing database tables...');
  await prisma.negotiationRound.deleteMany();
  await prisma.agentVote.deleteMany();
  await prisma.agentMessage.deleteMany();
  await prisma.agentEvent.deleteMany();
  await prisma.incidentResource.deleteMany();
  await prisma.resource.deleteMany();
  await prisma.timelineEntry.deleteMany();
  await prisma.deployment.deleteMany();
  await prisma.resourceContention.deleteMany();
  await prisma.agentRun.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.historicalIncident.deleteMany();

  console.log('Seeding 25 historical incidents...');
  for (const hist of HISTORICAL_INCIDENTS) {
    await prisma.historicalIncident.create({
      data: {
        type: hist.type,
        title: hist.title,
        summary: hist.summary,
        location: hist.location,
        year: hist.year,
        severity: hist.severity,
        lessonsLearned: hist.lessonsLearned,
        successfulStrategies: hist.successfulStrategies,
        failures: hist.failures,
        resourcesUsed: hist.resourcesUsed,
        outcome: hist.outcome,
        tags: hist.tags,
      },
    });
  }

  console.log('Seeding available resources...');
  for (const res of RESOURCES) {
    await prisma.resource.create({
      data: {
        type: res.type,
        name: res.name,
        callSign: res.callSign,
        status: res.status,
        latitude: res.latitude,
        longitude: res.longitude,
        homeBase: res.homeBase,
      },
    });
  }

  console.log('Database seeding complete.');
}

main()
  .catch(err => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
