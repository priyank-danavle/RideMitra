import React, { Component, ErrorInfo, ReactNode } from 'react';
import { MapPin, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackText?: string;
  height?: string | number;
  resetKey?: unknown;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('[MapErrorBoundary] Map component encountered an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    if (this.state.hasError && this.props.resetKey !== prevProps.resetKey) {
      this.setState({ hasError: false, error: undefined });
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: this.props.height || '300px',
            backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
            borderRadius: 'var(--radius-lg, 12px)',
            border: '1px solid var(--color-border, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            textAlign: 'center',
            color: 'var(--color-text-muted, #64748b)',
          }}
        >
          <MapPin size={28} style={{ marginBottom: '0.5rem', opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500 }}>
            {this.props.fallbackText || 'Interactive map preview currently unavailable.'}
          </p>
          <span style={{ fontSize: '0.8rem', marginTop: '0.25rem', opacity: 0.8 }}>
            Core ride details and bookings remain unaffected.
          </span>
          <button
            type="button"
            onClick={this.handleRetry}
            className="btn btn-outline btn-sm"
            style={{
              marginTop: '0.75rem',
              fontSize: '0.75rem',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md, 6px)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <RefreshCw size={12} />
            Retry Map
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

