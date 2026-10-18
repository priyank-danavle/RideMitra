import React from 'react';
import { Building2, GraduationCap, MapPin, Clock, ArrowRight } from 'lucide-react';

export const CommuteSections: React.FC = () => {
  return (
    <>
      {/* City Commuting Section */}
      <section className="section section-subtle" id="city-commute" aria-label="City Commuting">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '3rem',
              alignItems: 'center',
            }}
          >
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
                Intra-City Mobility
              </span>
              <h2 style={{ fontSize: '2.25rem', marginBottom: '1rem', letterSpacing: '-0.02em' }}>
                City Commuting for Daily Office & College Travel
              </h2>
              <p
                style={{
                  color: 'var(--color-text-muted)',
                  fontSize: '1.05rem',
                  lineHeight: 1.6,
                  marginBottom: '1.5rem',
                }}
              >
                Traffic jams during peak morning and evening rush hours cause immense fatigue and
                wasted fuel. RideMitra enables office colleagues and university students travelling
                along the same major city arteries to ride together.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <Building2
                    size={22}
                    style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                      Commercial Hub Corridors
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      Connect directly between residential neighborhoods and corporate IT/business
                      parks.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <GraduationCap
                    size={22}
                    style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                      College & University Commutes
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      Affordable bikepooling and carpooling for students travelling from regional
                      suburbs.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <MapPin
                    size={22}
                    style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '0.2rem' }}>
                      Designated Express Pickups
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                      Coordinate at well-known landmarks, BRTS stops, and highway bypass junctions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid var(--color-border)',
                padding: '2rem',
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>
                Popular Intra-City Corridors
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  {
                    route: 'Surat: Vesu ⇄ Adajan / Ring Road',
                    mode: 'Car & Bike',
                    time: 'Peak 8:30 AM',
                  },
                  {
                    route: 'Ahmedabad: Prahladnagar ⇄ Gandhinagar GIFT City',
                    mode: 'Car & Bike',
                    time: 'Peak 9:00 AM',
                  },
                  {
                    route: 'Vadodara: Alkapuri ⇄ Manjusar GIDC',
                    mode: 'Carpool',
                    time: 'Peak 8:00 AM',
                  },
                  {
                    route: 'Surat: Pal ⇄ Hazira Industrial Belt',
                    mode: 'Car & Bike',
                    time: 'Peak 8:15 AM',
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1rem',
                      backgroundColor: 'var(--color-surface-subtle)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                        {item.route}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                        {item.time}
                      </div>
                    </div>
                    <span className="badge badge-outline">{item.mode}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intercity Travel Section */}
      <section className="section" id="intercity" aria-label="Intercity Travel">
        <div className="container">
          <div className="section-header">
            <span className="badge badge-primary" style={{ marginBottom: '0.75rem' }}>
              Regional Highway Routes
            </span>
            <h2>Comfortable Intercity Highway Carpooling</h2>
            <p>
              Heading between cities for work, family visits, or weekends? Skip crowded public
              transit and enjoy a comfortable ride with drivers already travelling your way.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {[
              {
                from: 'Surat',
                to: 'Ahmedabad',
                duration: '~4.5 hrs via NE-1',
                distance: '265 km',
                note: 'Frequent weekend & weekday executive carpools',
              },
              {
                from: 'Vadodara',
                to: 'Ahmedabad',
                duration: '~1.5 hrs via Expressway',
                distance: '110 km',
                note: 'High daily business commuter frequency',
              },
              {
                from: 'Surat',
                to: 'Vadodara',
                duration: '~2.5 hrs via NH-48',
                distance: '150 km',
                note: 'Smooth expressway corridor with easy highway pickups',
              },
              {
                from: 'Surat',
                to: 'Mumbai',
                duration: '~5.5 hrs via NH-48',
                distance: '280 km',
                note: 'Popular for weekend travelers & airport transfers',
              },
            ].map((route, i) => (
              <div key={i} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: '1.15rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    {route.from} <ArrowRight size={16} style={{ color: 'var(--color-primary)' }} />{' '}
                    {route.to}
                  </span>
                  <span className="badge badge-primary">{route.distance}</span>
                </div>
                <div
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--color-text-muted)',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Clock size={15} style={{ color: 'var(--color-primary)' }} />
                  <span>{route.duration}</span>
                </div>
                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--color-text)',
                    marginTop: 'auto',
                    lineHeight: 1.5,
                  }}
                >
                  {route.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
