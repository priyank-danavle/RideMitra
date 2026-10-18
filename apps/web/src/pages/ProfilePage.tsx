import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/apiClient';

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');

  React.useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      setBio(user.bio || '');
    }
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (name.trim().length < 2) {
      setErrorMsg('Full name must be at least 2 characters.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim() ? phone.trim() : null,
        bio: bio.trim() ? bio.trim() : null,
      });
      setSuccessMsg('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Failed to update profile. Please check your network connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setPhone(user?.phone || '');
    setBio(user?.bio || '');
    setIsEditing(false);
    setErrorMsg(null);
  };

  return (
    <div className="container" style={{ paddingBlock: '3rem 4rem', maxWidth: '780px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Personal Profile</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem' }}>
          Manage your contact information and public commuter details
        </p>
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
          }}
        >
          ✓ {successMsg}
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
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      <div className="card" style={{ padding: '2.5rem' }}>
        {/* Header with Avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--color-border)',
            marginBottom: '2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.75rem',
                fontWeight: 700,
              }}
            >
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', marginBottom: '0.25rem' }}>{user?.name}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="badge badge-primary">{user?.role}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                  Member since{' '}
                  {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          </div>

          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="btn btn-outline btn-sm"
            >
              ✏️ Edit Profile
            </button>
          )}
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSave} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Full Name */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="profile-name" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Full Name
              </label>
              <input
                id="profile-name"
                type="text"
                disabled={!isEditing}
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  minHeight: '48px',
                  backgroundColor: isEditing
                    ? 'var(--color-surface)'
                    : 'var(--color-surface-subtle)',
                  color: 'var(--color-text)',
                  cursor: isEditing ? 'text' : 'not-allowed',
                }}
              />
            </div>

            {/* Email Address (Immutable) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label htmlFor="profile-email" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Email Address
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  🔒 Primary identifier (Cannot be changed)
                </span>
              </div>
              <input
                id="profile-email"
                type="email"
                disabled
                value={user?.email || ''}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  minHeight: '48px',
                  backgroundColor: 'var(--color-surface-subtle)',
                  color: 'var(--color-text-muted)',
                  cursor: 'not-allowed',
                }}
              />
            </div>

            {/* Mobile Phone Number */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label htmlFor="profile-phone" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                  Mobile Phone Number
                </label>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  Format: +919876543210
                </span>
              </div>
              <input
                id="profile-phone"
                type="tel"
                disabled={!isEditing}
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  minHeight: '48px',
                  backgroundColor: isEditing
                    ? 'var(--color-surface)'
                    : 'var(--color-surface-subtle)',
                  color: 'var(--color-text)',
                  cursor: isEditing ? 'text' : 'not-allowed',
                }}
              />
            </div>

            {/* Bio / Commute Notes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <label htmlFor="profile-bio" style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Commuter Bio & Routine
              </label>
              <textarea
                id="profile-bio"
                rows={3}
                disabled={!isEditing}
                placeholder="e.g. Daily office commuter travelling between Vesu and Ring Road. Non-smoker, punctual."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: isEditing
                    ? 'var(--color-surface)'
                    : 'var(--color-surface-subtle)',
                  color: 'var(--color-text)',
                  cursor: isEditing ? 'text' : 'not-allowed',
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Edit Mode Buttons */}
            {isEditing && (
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ minHeight: '44px', minWidth: '140px' }}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-outline"
                  disabled={loading}
                  style={{ minHeight: '44px' }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
