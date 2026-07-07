// components/map/DisasterMap.tsx
'use client';

import React, { useEffect } from 'react';
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

  // Custom HTML DivIcon for Responder Assets
  const createResourceIcon = (type: string, status: string) => {
    const color = status === 'AVAILABLE' ? 'var(--accent)' : 'var(--status-warn)';
    const text = type === 'AMBULANCE' ? 'AMB' :
                 type === 'FIRE_TRUCK' ? 'FIR' :
                 type === 'RESCUE_TEAM' ? 'SAR' :
                 type === 'HELICOPTER' ? 'COP' : 'VOL';

    return L.divIcon({
      html: `<div style="
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
      ">
        ${text}
      </div>`,
      className: '',
      iconSize: [28, 14],
      iconAnchor: [14, 7],
    });
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        {/* Dark Matter Carto basemap tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* ─── Incident Markers ─── */}
        {incidents.map(inc => {
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
              
              {/* Danger Zone Radius Circle */}
              <Circle
                center={[inc.latitude, inc.longitude]}
                radius={800} // 800m default danger zone radius
                pathOptions={{
                  color: inc.severity >= 8 ? 'var(--status-crit)' : 'var(--status-warn)',
                  fillColor: inc.severity >= 8 ? 'var(--status-crit)' : 'var(--status-warn)',
                  fillOpacity: 0.08,
                  weight: 1,
                  dashArray: '4,4',
                }}
              />
            </React.Fragment>
          );
        })}

        {/* ─── Resource Markers ─── */}
        {resources
          .filter(r => r.latitude !== null && r.longitude !== null)
          .map(res => (
            <Marker
              key={res.id}
              position={[res.latitude!, res.longitude!]}
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
          ))}

        {/* ─── Route Polylines ─── */}
        {routes.map(route => {
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
