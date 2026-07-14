// components/map/DisasterMap.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { IncidentRecord, ResourceRecord } from '@/types';

// Fix Leaflet webpack marker icon issue
const initLeafletIcons = () => {
  // @ts-ignore
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

interface DisasterMapProps {
  incidents: IncidentRecord[];
  resources: ResourceRecord[];
  selectedIncidentId: string | null;
  routes: Array<{
    id: string;
    name: string;
    status: string;
    waypoints: Array<[number, number]>;
    blockedReason: string | null;
  }>;
}

// Interpolation helper along a set of waypoints given progress (0 to 1)
const getInterpolatedPoint = (waypoints: Array<[number, number]>, progress: number): [number, number] => {
  if (!waypoints || waypoints.length === 0) return [51.505, -0.09];
  if (waypoints.length === 1) return waypoints[0];
  if (progress <= 0) return waypoints[0];
  if (progress >= 1) return waypoints[waypoints.length - 1];

  const totalSegments = waypoints.length - 1;
  const rawIndex = progress * totalSegments;
  const segmentIndex = Math.floor(rawIndex);
  const segmentProgress = rawIndex - segmentIndex;

  const start = waypoints[segmentIndex];
  const end = waypoints[segmentIndex + 1];

  const lat = start[0] + (end[0] - start[0]) * segmentProgress;
  const lng = start[1] + (end[1] - start[1]) * segmentProgress;

  return [lat, lng];
};

export const DisasterMap: React.FC<DisasterMapProps> = ({
  incidents,
  resources,
  selectedIncidentId,
  routes,
}) => {
  useEffect(() => {
    initLeafletIcons();
  }, []);

  const selectedIncident = incidents.find(i => i.id === selectedIncidentId);
  const center: [number, number] = selectedIncident
    ? [selectedIncident.latitude, selectedIncident.longitude]
    : [51.505, -0.09]; // Default London center

  // Track progress and positions for active resource movements
  const [animatedPositions, setAnimatedPositions] = useState<Record<string, [number, number]>>({});
  const progressMapRef = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPositions(prev => {
        const next: Record<string, [number, number]> = { ...prev };
        const progressMap = progressMapRef.current;

        resources.forEach((res, index) => {
          // If the resource is not deployed or no routes exist, clean up position override
          if (routes.length === 0 || !['DEPLOYED', 'EN_ROUTE', 'RETURNING'].includes(res.status)) {
            progressMap.set(res.id, 0);
            delete next[res.id];
            return;
          }

          // Distribute resources along available routes
          const route = routes[index % routes.length];
          const waypoints = route.waypoints;
          if (!waypoints || waypoints.length === 0) return;

          // Increment/decrement progress along route waypoints
          let currentProgress = progressMap.get(res.id) ?? 0;
          if (res.status === 'RETURNING') {
            currentProgress = Math.max(currentProgress - 0.02, 0);
          } else {
            currentProgress = Math.min(currentProgress + 0.02, 1);
          }
          progressMap.set(res.id, currentProgress);

          // If the progress is fully home or target and status is available/on-scene, clean up animation override
          if (currentProgress === 0 && res.status === 'AVAILABLE') {
            delete next[res.id];
          } else {
            next[res.id] = getInterpolatedPoint(waypoints, currentProgress);
          }
        });

        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [resources, routes]);

  // Custom HTML DivIcon for Incident Pins
  const createIncidentIcon = (severity: number, isSelected: boolean) => {
    const size = isSelected ? 24 : 16;
    const color = severity >= 8 ? '#FC8181' : severity >= 5 ? '#ECC94B' : '#48BB78';
    const shadowColor = severity >= 8 ? 'rgba(252, 129, 129, 0.4)' : severity >= 5 ? 'rgba(236, 201, 75, 0.4)' : 'rgba(72, 187, 120, 0.4)';
    
    return L.divIcon({
      html: `<div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid #ffffff;
        box-shadow: 0 0 16px ${shadowColor};
        display: flex;
        align-items: center;
        justify-content: center;
        animation: pulse-glow-crit 1.5s infinite ease-in-out;
      ">
        <span style="font-family: monospace; font-size: 8px; color: #000; font-weight: bold;">
          ${severity}
        </span>
      </div>`,
      className: '',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  // Custom HTML DivIcon for Responder Assets with health and status highlights
  const createResourceIcon = (type: string, status: string) => {
    let color = 'var(--text-secondary)';
    let pulseClass = '';

    if (status === 'AVAILABLE') {
      color = 'var(--status-live)';
    } else if (['PREPARING', 'DEPLOYING', 'EN_ROUTE'].includes(status)) {
      color = 'var(--status-warn)';
      pulseClass = 'status-indicator-glow-yellow';
    } else if (status === 'ON_SCENE') {
      color = 'var(--accent)';
      pulseClass = 'status-indicator-glow-cyan';
    } else if (status === 'RETURNING') {
      color = 'var(--text-primary)';
    }

    const text = type === 'AMBULANCE' ? 'AMB' :
                 type === 'FIRE_TRUCK' ? 'FIR' :
                 type === 'RESCUE_TEAM' ? 'SAR' :
                 type === 'HELICOPTER' ? 'COP' : 'VOL';

    return L.divIcon({
      html: `<div class="${pulseClass}" style="
        background-color: var(--bg-panel-alt);
        border: 1px solid ${color};
        color: ${color};
        font-family: monospace;
        font-size: 8px;
        font-weight: 700;
        padding: 2px 4px;
        border-radius: 3px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.5);
        white-space: nowrap;
        transition: all 0.2s ease;
      ">
        ${text}
      </div>`,
      className: '',
      iconSize: [28, 14],
      iconAnchor: [14, 7],
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* HUD Radar sweep overlay */}
      <div className="radar-sweep-overlay" />

      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
        zoomControl={true}
      >
        {/* Dark Matter Carto basemap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* ─── Incident Markers ─── */}
        {incidents
          .filter(inc => typeof inc.latitude === 'number' && typeof inc.longitude === 'number' && !isNaN(inc.latitude) && !isNaN(inc.longitude))
          .map(inc => {
            const isSelected = inc.id === selectedIncidentId;
            return (
              <React.Fragment key={inc.id}>
                <Marker
                  position={[inc.latitude, inc.longitude]}
                  icon={createIncidentIcon(inc.severity, isSelected)}
                >
                  <Popup>
                    <div style={{ backgroundColor: 'var(--bg-panel)', color: 'var(--text-primary)', padding: '4px' }}>
                      <strong style={{ fontSize: '12px' }}>{inc.title}</strong>
                      <div style={{ fontSize: '10px', marginTop: '2px', color: 'var(--text-secondary)' }}>
                        Severity: {inc.severity} | Location: {inc.location}
                      </div>
                    </div>
                  </Popup>
                </Marker>
                
                {/* Danger Zone Radius Circle with Pulse animation */}
                <Circle
                  center={[inc.latitude, inc.longitude]}
                  radius={800} // 800m default danger zone radius
                  pathOptions={{
                    color: inc.severity >= 8 ? 'var(--status-crit)' : 'var(--status-warn)',
                    fillColor: inc.severity >= 8 ? 'var(--status-crit)' : 'var(--status-warn)',
                    fillOpacity: 0.08,
                    weight: 1,
                    dashArray: '4,4',
                    className: 'pulsing-danger-zone',
                  }}
                />
              </React.Fragment>
            );
          })}

        {/* ─── Resource Markers (Dynamic coordinates if animating) ─── */}
        {resources
          .filter(r => typeof r.latitude === 'number' && typeof r.longitude === 'number' && !isNaN(r.latitude) && !isNaN(r.longitude))
          .map(res => {
            const currentPosition: [number, number] = animatedPositions[res.id] ?? [res.latitude!, res.longitude!];
            return (
              <Marker
                key={res.id}
                position={currentPosition}
                icon={createResourceIcon(res.type, res.status)}
              >
                <Popup>
                  <div style={{ padding: '2px' }}>
                    <strong>{res.name}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Callsign: {res.callSign} | Status: {res.status}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* ─── Route Polylines (Flowing path animation) ─── */}
        {routes
          .filter(r => Array.isArray(r.waypoints) && r.waypoints.length > 0)
          .map(route => {
            const isBlocked = route.status === 'BLOCKED';
            return (
              <Polyline
                key={route.id}
                positions={route.waypoints}
                pathOptions={{
                  color: isBlocked ? 'var(--status-crit)' : 'var(--accent)',
                  weight: 3,
                  opacity: 0.8,
                  dashArray: isBlocked ? '6,6' : undefined,
                  className: isBlocked ? undefined : 'animated-route-line',
                }}
              >
                <Popup>
                  <div>
                    <strong>{route.name}</strong>
                    <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                      Status: {route.status} {route.blockedReason ? `(${route.blockedReason})` : ''}
                    </div>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
      </MapContainer>
    </div>
  );
};

export default DisasterMap;
