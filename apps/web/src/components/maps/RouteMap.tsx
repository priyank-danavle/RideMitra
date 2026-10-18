import React, { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';

export interface LatLng {
  lat: number;
  lng: number;
  label?: string;
  isApproximate?: boolean;
}

interface RouteMapProps {
  origin: LatLng | null;
  destination: LatLng | null;
  polyline?: [number, number][] | null;
  editable?: boolean;
  activeSelection?: 'origin' | 'destination';
  onOriginChange?: (pos: { lat: number; lng: number }) => void;
  onDestinationChange?: (pos: { lat: number; lng: number }) => void;
  height?: string | number;
  className?: string;
}

/**
 * Custom vector HTML icons to avoid broken image asset paths in bundler environments
 */
function createSvgIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
      ">
        <div style="
          background-color: ${color};
          color: white;
          padding: 4px 8px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          box-shadow: 0 4px 6px rgba(0,0,0,0.25);
          white-space: nowrap;
          border: 2px solid white;
          letter-spacing: 0.025em;
        ">
          ${label}
        </div>
        <div style="
          width: 14px;
          height: 14px;
          background-color: ${color};
          border: 2px solid white;
          border-radius: 50%;
          margin-top: -3px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Controller to dynamically pan and zoom the map to fit both pickup and drop-off points
 */
const BoundsFitter: React.FC<{ origin: LatLng | null; destination: LatLng | null }> = ({
  origin,
  destination,
}) => {
  const map = useMap();

  useEffect(() => {
    if (origin && destination) {
      const bounds = L.latLngBounds(
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
      );
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
      });
    } else if (origin) {
      map.setView([origin.lat, origin.lng], 12, { animate: true });
    } else if (destination) {
      map.setView([destination.lat, destination.lng], 12, { animate: true });
    }
  }, [map, origin?.lat, origin?.lng, destination?.lat, destination?.lng]);

  return null;
};

/**
 * Controller allowing the user to click the map to update the active marker location
 */
const MapClickHandler: React.FC<{
  editable: boolean;
  activeSelection?: 'origin' | 'destination';
  onOriginChange?: (pos: { lat: number; lng: number }) => void;
  onDestinationChange?: (pos: { lat: number; lng: number }) => void;
}> = ({ editable, activeSelection, onOriginChange, onDestinationChange }) => {
  useMapEvents({
    click(e) {
      if (!editable) return;
      const { lat, lng } = e.latlng;
      if (activeSelection === 'destination' && onDestinationChange) {
        onDestinationChange({ lat, lng });
      } else if (onOriginChange) {
        onOriginChange({ lat, lng });
      }
    },
  });

  return null;
};

export const RouteMap: React.FC<RouteMapProps> = ({
  origin,
  destination,
  polyline,
  editable = false,
  activeSelection = 'origin',
  onOriginChange,
  onDestinationChange,
  height = '340px',
  className = '',
}) => {
  // Default regional center: Western India (approx between Ahmedabad & Surat)
  const defaultCenter: [number, number] = useMemo(() => {
    if (origin) return [origin.lat, origin.lng];
    if (destination) return [destination.lat, destination.lng];
    return [22.2587, 72.8311]; // Gujarat Transit Corridor centroid
  }, [origin, destination]);

  const originIcon = useMemo(
    () => createSvgIcon('#059669', origin?.isApproximate ? 'Pickup (Approx)' : 'Pickup'),
    [origin?.isApproximate],
  );
  const destinationIcon = useMemo(
    () => createSvgIcon('#4f46e5', destination?.isApproximate ? 'Drop-off (Approx)' : 'Drop-off'),
    [destination?.isApproximate],
  );

  // If no coordinates provided at all, render informational placeholder
  if (!origin && !destination) {
    return (
      <div
        className={className}
        style={{
          height,
          backgroundColor: 'var(--color-surface-subtle, #f8fafc)',
          borderRadius: 'var(--radius-lg, 12px)',
          border: '1px dashed var(--color-border, #e2e8f0)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          textAlign: 'center',
          color: 'var(--color-text-muted, #64748b)',
        }}
      >
        <MapPin size={32} style={{ marginBottom: '0.75rem', opacity: 0.6 }} />
        <h4 style={{ margin: '0 0 0.25rem 0', fontSize: '0.95rem', fontWeight: 600 }}>
          Interactive Route Map
        </h4>
        <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '300px' }}>
          Select or enter origin and destination locations above to preview the route corridor.
        </p>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        height,
        width: '100%',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
        border: '1px solid var(--color-border, #e2e8f0)',
        position: 'relative',
        boxShadow: 'var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%', zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={18}
        />

        <BoundsFitter origin={origin} destination={destination} />

        {editable && (
          <MapClickHandler
            editable={editable}
            activeSelection={activeSelection}
            onOriginChange={onOriginChange}
            onDestinationChange={onDestinationChange}
          />
        )}

        {/* Origin / Pickup Marker */}
        {origin && (
          <Marker
            position={[origin.lat, origin.lng]}
            icon={originIcon}
            draggable={editable}
            eventHandlers={{
              dragend: (e) => {
                if (editable && onOriginChange) {
                  const latlng = e.target.getLatLng();
                  onOriginChange({ lat: latlng.lat, lng: latlng.lng });
                }
              },
            }}
          >
            <Popup>
              <div style={{ fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <strong>Pickup Point</strong>
                  {origin.isApproximate && (
                    <span
                      style={{
                        fontSize: '10px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      Approximate Hub
                    </span>
                  )}
                </div>
                {origin.isApproximate ? (
                  <div style={{ color: '#d97706', fontSize: '11px', marginTop: '2px', marginBottom: '4px' }}>
                    Approximate city center — adjust the pin for your exact location.
                  </div>
                ) : (
                  <div style={{ color: '#059669', fontSize: '11px', marginTop: '2px', marginBottom: '4px' }}>
                    Exact pinpointed location
                  </div>
                )}
                <div>{origin.label || 'Selected Location'}</div>
                {editable && (
                  <div style={{ color: '#059669', marginTop: '4px', fontSize: '11px' }}>
                    Drag marker or click map to adjust
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination / Drop-off Marker */}
        {destination && (
          <Marker
            position={[destination.lat, destination.lng]}
            icon={destinationIcon}
            draggable={editable}
            eventHandlers={{
              dragend: (e) => {
                if (editable && onDestinationChange) {
                  const latlng = e.target.getLatLng();
                  onDestinationChange({ lat: latlng.lat, lng: latlng.lng });
                }
              },
            }}
          >
            <Popup>
              <div style={{ fontSize: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                  <strong>Drop-off Point</strong>
                  {destination.isApproximate && (
                    <span
                      style={{
                        fontSize: '10px',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        padding: '1px 5px',
                        borderRadius: '4px',
                        fontWeight: 600,
                      }}
                    >
                      Approximate Hub
                    </span>
                  )}
                </div>
                {destination.isApproximate ? (
                  <div style={{ color: '#d97706', fontSize: '11px', marginTop: '2px', marginBottom: '4px' }}>
                    Approximate city center — adjust the pin for your exact location.
                  </div>
                ) : (
                  <div style={{ color: '#4f46e5', fontSize: '11px', marginTop: '2px', marginBottom: '4px' }}>
                    Exact pinpointed location
                  </div>
                )}
                <div>{destination.label || 'Selected Location'}</div>
                {editable && (
                  <div style={{ color: '#4f46e5', marginTop: '4px', fontSize: '11px' }}>
                    Drag marker or click map to adjust
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Polyline (OSRM Driving Route or Fallback Straight Line) */}
        {polyline && polyline.length > 0 ? (
          <Polyline
            positions={polyline}
            pathOptions={{
              color: '#3b82f6',
              weight: 4,
              opacity: 0.85,
              lineJoin: 'round',
            }}
          />
        ) : origin && destination ? (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{
              color: '#94a3b8',
              weight: 2,
              dashArray: '6, 8',
              opacity: 0.7,
            }}
          />
        ) : null}
      </MapContainer>

      {/* Editing Hint Overlay */}
      {editable && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            zIndex: 1000,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(4px)',
            padding: '5px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: 'var(--color-text-muted, #475569)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            pointerEvents: 'none',
          }}
        >
          <Navigation size={12} style={{ color: '#3b82f6' }} />
          <span>
            Pinpointing{' '}
            <strong style={{ color: activeSelection === 'origin' ? '#059669' : '#4f46e5' }}>
              {activeSelection === 'origin' ? 'Pickup' : 'Drop-off'}
            </strong>{' '}
            (Click map or drag pins to adjust)
          </span>
        </div>
      )}
    </div>
  );
};
