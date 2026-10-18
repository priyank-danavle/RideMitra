import React from 'react';
import { Route, Clock, Info } from 'lucide-react';

interface RouteMetricsBadgeProps {
  distanceKm?: number | null;
  durationMinutes?: number | null;
  isBestEffort?: boolean;
  className?: string;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (remainingMins === 0) {
    return `${hours} hr`;
  }
  return `${hours} hr ${remainingMins} min`;
}

export const RouteMetricsBadge: React.FC<RouteMetricsBadgeProps> = ({
  distanceKm,
  durationMinutes,
  isBestEffort = true,
  className = '',
}) => {
  if (distanceKm === undefined && durationMinutes === undefined) {
    return null;
  }

  const hasMetrics =
    distanceKm !== null &&
    distanceKm !== undefined &&
    durationMinutes !== null &&
    durationMinutes !== undefined;

  if (!hasMetrics) {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
          borderRadius: 'var(--radius-md, 8px)',
          border: '1px solid var(--color-border, #e2e8f0)',
          fontSize: '0.825rem',
          color: 'var(--color-text-muted, #64748b)',
        }}
      >
        <Info size={14} />
        <span>Road distance & duration calculated after map pinpointing</span>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '8px 14px',
        backgroundColor: 'var(--color-primary-light, #eff6ff)',
        borderRadius: 'var(--radius-md, 8px)',
        border: '1px solid var(--color-primary-subtle, #bfdbfe)',
        fontSize: '0.875rem',
        color: 'var(--color-primary-dark, #1e40af)',
        fontWeight: 600,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Route size={16} style={{ color: '#2563eb' }} />
        <span>{distanceKm} km</span>
      </div>

      <span style={{ color: '#93c5fd' }}>•</span>

      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Clock size={16} style={{ color: '#2563eb' }} />
        <span>~{formatDuration(durationMinutes)}</span>
      </div>

      {isBestEffort && (
        <span
          style={{
            fontSize: '0.725rem',
            fontWeight: 500,
            color: '#3b82f6',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '2px 6px',
            borderRadius: '4px',
          }}
        >
          OSRM Driving Estimate
        </span>
      )}
    </div>
  );
};
