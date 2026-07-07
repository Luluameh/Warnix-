// components/incidents/NewIncidentForm.tsx
'use client';

import React, { useState } from 'react';
import { IncidentType } from '@/types';

interface NewIncidentFormProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    type: string;
    severity: number;
    location: string;
    description: string;
    latitude: number;
    longitude: number;
  }) => void;
}

export const NewIncidentForm: React.FC<NewIncidentFormProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('FLOOD');
  const [severity, setSeverity] = useState(7);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sane default coordinates near central London (our map seed viewport)
  const [latitude, setLatitude] = useState(51.505);
  const [longitude, setLongitude] = useState(-0.09);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !location || !description || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title,
        type,
        severity,
        location,
        description,
        latitude,
        longitude,
      });
    } catch (err) {
      console.error(err);
      setIsSubmitting(false);
    }
  };

  // Generate slightly offset offsets for new incidents to scatter pins
  const handleRandomizeLocation = () => {
    const randomOffsetLat = (Math.random() - 0.5) * 0.04;
    const randomOffsetLng = (Math.random() - 0.5) * 0.06;
    setLatitude(parseFloat((51.505 + randomOffsetLat).toFixed(5)));
    setLongitude(parseFloat((-0.09 + randomOffsetLng).toFixed(5)));
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(5, 6, 8, 0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        backdropFilter: 'blur(3px)',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: '400px',
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-active)',
          borderRadius: '4px',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
          <span className="font-mono text-cyan" style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em' }}>
            REPORT EMERGENCY DISPATCH
          </span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
            }}
          >
            [✕]
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Operation Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Riverside flash floods"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              height: '28px',
              backgroundColor: 'var(--bg-panel-alt)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '0 8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '12px',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Crisis Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              style={{
                height: '28px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            >
              {Object.keys(IncidentType).map(t => (
                <option key={t} value={t}>
                  {t.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Initial Severity (1-10)</label>
            <input
              type="number"
              min={1}
              max={10}
              required
              value={severity}
              onChange={e => setSeverity(parseInt(e.target.value))}
              style={{
                height: '28px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Target Sector/Location</label>
          <input
            type="text"
            required
            placeholder="e.g. Sector 4, Riverside Boulevard"
            value={location}
            onChange={e => setLocation(e.target.value)}
            style={{
              height: '28px',
              backgroundColor: 'var(--bg-panel-alt)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '0 8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '12px',
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr p-5px', gap: '8px', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Latitude</label>
            <input
              type="number"
              step="any"
              required
              value={latitude}
              onChange={e => setLatitude(parseFloat(e.target.value))}
              style={{
                height: '28px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Longitude</label>
            <input
              type="number"
              step="any"
              required
              value={longitude}
              onChange={e => setLongitude(parseFloat(e.target.value))}
              style={{
                height: '28px',
                backgroundColor: 'var(--bg-panel-alt)',
                border: '1px solid var(--border)',
                borderRadius: '3px',
                padding: '0 8px',
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                fontSize: '12px',
              }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={handleRandomizeLocation}
          style={{
            height: '22px',
            backgroundColor: 'var(--bg-panel-alt)',
            border: '1px solid var(--border)',
            borderRadius: '3px',
            color: 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)',
            fontSize: '9px',
            cursor: 'pointer',
          }}
        >
          GENERATE RANDOM COORDINATES
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Detailed Dispatch Description</label>
          <textarea
            required
            rows={3}
            placeholder="Describe the disaster scope and casualties..."
            value={description}
            onChange={e => setDescription(e.target.value)}
            style={{
              backgroundColor: 'var(--bg-panel-alt)',
              border: '1px solid var(--border)',
              borderRadius: '3px',
              padding: '8px',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
              fontSize: '12px',
              resize: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              height: '28px',
              backgroundColor: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: '11px',
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              flex: 1,
              height: '28px',
              backgroundColor: isSubmitting ? 'var(--bg-panel-alt)' : 'var(--accent-dim)',
              border: `1px solid ${isSubmitting ? 'var(--border)' : 'var(--accent)'}`,
              borderRadius: '4px',
              color: isSubmitting ? 'var(--text-secondary)' : '#000000',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '11px',
            }}
          >
            {isSubmitting ? 'DISPATCHING...' : 'DISPATCH AGENTS'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default NewIncidentForm;
