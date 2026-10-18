import React, { useEffect, useState } from 'react';
import { Car, Bike, Plus, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiClient, ApiError } from '../lib/apiClient';
import type { Vehicle, SpecificVehicleType, CreateVehicleRequest } from '@ridemitra/shared';

const currentYear = new Date().getFullYear();

export const VehiclesPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal / Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState<CreateVehicleRequest>({
    type: 'CAR',
    make: '',
    model: '',
    year: currentYear,
    color: '',
    registrationNumber: '',
    capacity: 4,
  });

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await apiClient.getVehicles();
      setVehicles(res.vehicles);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, []);

  const handleTypeChange = (newType: SpecificVehicleType) => {
    setFormData((prev) => ({
      ...prev,
      type: newType,
      capacity: newType === 'BIKE' ? 1 : 4,
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!formData.make.trim() || !formData.model.trim()) {
      setErrorMsg('Please specify both make and model.');
      return;
    }
    if (!formData.registrationNumber.trim()) {
      setErrorMsg('Please provide a valid vehicle registration number.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.createVehicle({
        ...formData,
        make: formData.make.trim(),
        model: formData.model.trim(),
        color: formData.color.trim(),
        registrationNumber: formData.registrationNumber.trim().toUpperCase(),
        capacity: Number(formData.capacity),
        year: Number(formData.year),
      });

      setSuccessMsg('Vehicle registered successfully!');
      setShowAddModal(false);
      setFormData({
        type: 'CAR',
        make: '',
        model: '',
        year: currentYear,
        color: '',
        registrationNumber: '',
        capacity: 4,
      });
      await loadVehicles();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to register vehicle. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate ${name}? It will no longer be available for publishing rides.`,
      )
    ) {
      return;
    }

    try {
      await apiClient.deleteVehicle(id);
      setSuccessMsg('Vehicle deactivated successfully.');
      await loadVehicles();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to deactivate vehicle.');
    }
  };

  return (
    <div className="container" style={{ paddingBlock: '3rem 4rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>My Vehicles</h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
            Register and manage cars or bikes you use to offer shared rides
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setErrorMsg(null);
            setSuccessMsg(null);
            setShowAddModal(true);
          }}
          className="btn btn-primary"
          aria-label="+ Add New Vehicle"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Plus size={16} /> Add New Vehicle
        </button>
      </div>

      {successMsg && (
        <div
          role="status"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-success-bg)',
            color: 'var(--color-success)',
            fontSize: '0.9rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            fontSize: '0.9rem',
            fontWeight: 500,
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Vehicle List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)' }}>
          Loading vehicles...
        </div>
      ) : vehicles.length === 0 ? (
        /* Empty State */
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            backgroundColor: 'var(--color-surface-subtle)',
            border: '2px dashed var(--color-border)',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '1rem',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              marginBottom: '1.25rem',
            }}
          >
            <Car size={32} />
            <Bike size={32} />
          </div>
          <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>No vehicles registered yet</h2>
          <p
            style={{
              color: 'var(--color-text-muted)',
              fontSize: '0.95rem',
              maxWidth: '480px',
              marginInline: 'auto',
              marginBottom: '1.75rem',
            }}
          >
            Add your car or motorcycle to start offering rides and sharing commute expenses along
            your daily route.
          </p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={16} /> Register Your Vehicle Now
          </button>
        </div>
      ) : (
        /* Vehicle Cards Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {vehicles.map((v) => (
            <div
              key={v.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary-dark)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {v.type === 'CAR' ? <Car size={20} /> : <Bike size={20} />}
                  </span>
                  <span className="badge badge-primary">
                    {v.type === 'CAR' ? 'Carpool' : 'Bikepool'}
                  </span>
                </div>
                <span
                  className="badge badge-outline"
                  title="Vehicle verification workflow will be implemented in subsequent phases"
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--color-warning)',
                    borderColor: 'var(--color-warning)',
                  }}
                >
                  Unverified
                </span>
              </div>

              <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>
                {v.make} {v.model}
              </h2>
              <div
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--color-text-muted)',
                  marginBottom: '1rem',
                }}
              >
                {v.year} · {v.color}
              </div>

              <div
                style={{
                  backgroundColor: 'var(--color-surface-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    PLATE NUMBER
                  </div>
                  <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>
                    {v.registrationNumber}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    PASSENGER SEATS
                  </div>
                  <div style={{ fontWeight: 700, textAlign: 'right' }}>{v.capacity} Seat(s)</div>
                </div>
              </div>

              <div style={{ marginTop: 'auto', display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => handleDeactivate(v.id, `${v.make} ${v.model}`)}
                  className="btn btn-outline btn-sm"
                  style={{
                    color: 'var(--color-error)',
                    borderColor: 'var(--color-error-bg)',
                    marginLeft: 'auto',
                  }}
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vehicle Modal */}
      {showAddModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
            zIndex: 200,
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              padding: '2rem',
              borderRadius: 'var(--radius-xl)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
              }}
            >
              <h2 id="modal-title" style={{ fontSize: '1.4rem' }}>
                Register a Vehicle
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-outline btn-sm"
                style={{
                  width: '32px',
                  height: '32px',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label="Close dialog"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Vehicle Type Choice */}
                <div>
                  <label
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Vehicle Mode
                  </label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor:
                          formData.type === 'CAR' ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor:
                          formData.type === 'CAR' ? 'var(--color-primary-light)' : 'transparent',
                        color:
                          formData.type === 'CAR'
                            ? 'var(--color-primary-dark)'
                            : 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="CAR"
                        checked={formData.type === 'CAR'}
                        onChange={() => handleTypeChange('CAR')}
                        className="visually-hidden"
                      />
                      <Car size={18} /> Carpool
                    </label>

                    <label
                      style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid',
                        borderColor:
                          formData.type === 'BIKE' ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor:
                          formData.type === 'BIKE' ? 'var(--color-primary-light)' : 'transparent',
                        color:
                          formData.type === 'BIKE'
                            ? 'var(--color-primary-dark)'
                            : 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="radio"
                        name="type"
                        value="BIKE"
                        checked={formData.type === 'BIKE'}
                        onChange={() => handleTypeChange('BIKE')}
                        className="visually-hidden"
                      />
                      <Bike size={18} /> Bikepool
                    </label>
                  </div>
                </div>

                {/* Make & Model */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="make" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Make / Brand
                    </label>
                    <input
                      id="make"
                      type="text"
                      required
                      placeholder="e.g. Maruti, Honda"
                      value={formData.make}
                      onChange={(e) => setFormData((prev) => ({ ...prev, make: e.target.value }))}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="model" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Model Name
                    </label>
                    <input
                      id="model"
                      type="text"
                      required
                      placeholder="e.g. Swift, Activa"
                      value={formData.model}
                      onChange={(e) => setFormData((prev) => ({ ...prev, model: e.target.value }))}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>
                </div>

                {/* Year & Color */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="year" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Manufacturing Year
                    </label>
                    <input
                      id="year"
                      type="number"
                      required
                      min={1990}
                      max={currentYear + 1}
                      value={formData.year}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, year: Number(e.target.value) }))
                      }
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="color" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Color
                    </label>
                    <input
                      id="color"
                      type="text"
                      required
                      placeholder="e.g. Silver, White"
                      value={formData.color}
                      onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                      }}
                    />
                  </div>
                </div>

                {/* Registration Number & Capacity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="regNum" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Plate Number
                    </label>
                    <input
                      id="regNum"
                      type="text"
                      required
                      placeholder="GJ-05-AB-1234"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, registrationNumber: e.target.value }))
                      }
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <label htmlFor="capacity" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                      Passenger Seats
                    </label>
                    <input
                      id="capacity"
                      type="number"
                      required
                      disabled={formData.type === 'BIKE'}
                      min={1}
                      max={formData.type === 'BIKE' ? 1 : 8}
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, capacity: Number(e.target.value) }))
                      }
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--color-border)',
                        backgroundColor:
                          formData.type === 'BIKE'
                            ? 'var(--color-surface-subtle)'
                            : 'var(--color-surface)',
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1rem',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="btn btn-outline"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Registering...' : 'Register Vehicle'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
