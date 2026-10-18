import React, { useEffect, useState } from 'react';
import { apiClient } from '../lib/apiClient';
import type { HealthCheckResponse } from '@ridemitra/shared';

export const HealthStatusBadge: React.FC = () => {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API Unreachable');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.35rem 0.85rem',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--color-border)',
        fontSize: '0.8rem',
        boxShadow: 'var(--shadow-sm)',
      }}
      aria-live="polite"
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: loading ? '#f59e0b' : health ? '#16a34a' : '#dc2626',
          display: 'inline-block',
          boxShadow: health ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : 'none',
        }}
      />
      {loading ? (
        <span style={{ color: 'var(--color-text-muted)' }}>Checking API status...</span>
      ) : health ? (
        <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>
          API Online (v{health.version}) · {health.environment}
        </span>
      ) : (
        <span style={{ color: 'var(--color-error)', fontWeight: 500 }}>API Offline ({error})</span>
      )}
      <button
        onClick={checkStatus}
        type="button"
        className="btn-outline"
        style={{
          padding: '0.15rem 0.5rem',
          fontSize: '0.75rem',
          minHeight: '24px',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
        }}
        title="Refresh backend health check"
      >
        ↻
      </button>
    </div>
  );
};
