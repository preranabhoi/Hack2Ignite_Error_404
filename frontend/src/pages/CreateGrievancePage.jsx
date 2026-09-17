import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  FilePlus,
  Building2,
  MapPin,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Navigation,
  CheckCircle2,
  ArrowLeft,
  Loader2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { grievanceService } from '../services/api';

const CATEGORIES = [
  { id: 'Roads', label: 'Roads & Potholes', dept: 'Public Works & Roads' },
  { id: 'Waste Management', label: 'Waste & Sanitation', dept: 'Waste Management' },
  { id: 'Water Supply', label: 'Water Supply & Leakage', dept: 'Water Supply & Sanitation' },
  { id: 'Electricity', label: 'Electricity & Power', dept: 'Electricity & Power' },
  { id: 'Street Lighting', label: 'Street Lighting', dept: 'Electricity & Power' },
  { id: 'Drainage', label: 'Drainage & Sewage', dept: 'Water Supply & Sanitation' },
  { id: 'Public Safety', label: 'Public Safety & Encroachment', dept: 'General Administration' },
  { id: 'Environment', label: 'Health & Pollution', dept: 'Health & Environment' },
  { id: 'Other', label: 'Other Civic Grievances', dept: 'General Administration' },
];

const PRIORITIES = [
  { id: 'Low', label: 'Low', desc: 'Standard non-urgent concern' },
  { id: 'Medium', label: 'Medium', desc: 'Noticeable disruption' },
  { id: 'High', label: 'High', desc: 'Urgent public hazard' },
  { id: 'Critical', label: 'Critical', desc: 'Immediate emergency risk' },
];

const CreateGrievancePage = () => {
  const navigate = useNavigate();
  const locationState = useLocation();
  const prefill = locationState.state?.prefill;

  const [formData, setFormData] = useState(() => ({
    title: prefill?.title || '',
    description: prefill?.description || '',
    category: prefill?.category && CATEGORIES.some((c) => c.id === prefill.category)
      ? prefill.category
      : 'Roads',
    priority: prefill?.priority && ['Low', 'Medium', 'High', 'Critical'].includes(prefill.priority)
      ? prefill.priority
      : 'Medium',
    location: {
      address: prefill?.location?.address || (typeof prefill?.location === 'string' ? prefill.location : ''),
      landmark: prefill?.location?.landmark || (typeof prefill?.landmark === 'string' ? prefill.landmark : ''),
      ward: prefill?.location?.ward || 'Ward 14 (Saheed Nagar)',
      city: prefill?.location?.city || 'Bhubaneswar',
      pincode: prefill?.location?.pincode || '751007',
      latitude: null,
      longitude: null,
    },
    images: [],
  }));

  const [imageUrlInput, setImageUrlInput] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedCategory = CATEGORIES.find((c) => c.id === formData.category) || CATEGORIES[0];

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleLocationChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value,
      },
    }));
  };

  // Browser GPS detection
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        setFormData((prev) => ({
          ...prev,
          location: {
            ...prev.location,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            address: prev.location.address || `GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
          },
        }));
      },
      (err) => {
        setGpsLoading(false);
        setError(`Unable to retrieve GPS location (${err.message}). Please enter address manually.`);
      },
      { timeout: 10000 }
    );
  };

  // Add Image URL or Sample Photo
  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, imageUrlInput.trim()],
    }));
    setImageUrlInput('');
  };

  const handleFileUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert file to base64
    const file = files[0];
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, reader.result],
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a descriptive title');
      return;
    }

    if (!formData.description.trim()) {
      setError('Please provide a detailed description');
      return;
    }

    if (!formData.location.address.trim()) {
      setError('Please provide the incident address or landmark');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await grievanceService.create(formData);
      if (res.success) {
        navigate(`/grievances/${res.grievance._id}`, {
          state: {
            newlyCreated: true,
            duplicateDetection: res.duplicateDetection,
          },
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit grievance');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container main-content" style={{ maxWidth: '840px' }}>
      {/* Top Back Nav */}
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div className="card-elevated">
        {/* Form Header */}
        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FilePlus size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem' }}>File a Public Grievance</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Submit your civic complaint for municipal review and field officer assignment.
          </p>
        </div>

        {/* AI Guide Prefill Banner */}
        {prefill && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.85rem 1rem',
              backgroundColor: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: 'var(--radius-md)',
              color: '#166534',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <Sparkles size={18} color="#16a34a" style={{ flexShrink: 0 }} />
            <span>
              <strong>AI Citizen Guide pre-filled this draft.</strong> Please review the details below, set the exact incident location, and submit manually.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              color: '#991b1b',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Section 1: Grievance Details */}
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--text-main)' }}>
              1. Issue Overview
            </h3>

            <div className="form-group">
              <label className="form-label" htmlFor="title">
                Grievance Title *
              </label>
              <input
                id="title"
                type="text"
                required
                maxLength={150}
                className="form-input"
                placeholder="e.g. Ruptured Drinking Water Pipeline near Block 4 Park"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
              />
              <span className="form-helper">{formData.title.length}/150 characters</span>
            </div>

            {/* Category Selector Grid */}
            <div className="form-group">
              <label className="form-label">
                Civic Category *
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '0.25rem',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = formData.category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleInputChange('category', cat.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected
                          ? 'var(--primary-light)'
                          : 'var(--bg-surface)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                        }}
                      >
                        {cat.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Dept: {cat.dept}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Auto-Department indicator banner */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-subtle)',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                marginBottom: '1.25rem',
              }}
            >
              <Building2 size={16} color="var(--primary)" />
              <span>
                Target Municipal Department:{' '}
                <strong style={{ color: 'var(--text-main)' }}>{selectedCategory.dept}</strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="description">
                Detailed Description *
              </label>
              <textarea
                id="description"
                required
                maxLength={3000}
                className="form-textarea"
                placeholder="Describe the severity, how long the issue has persisted, and any immediate hazards to residents..."
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                style={{ minHeight: '120px' }}
              />
              <span className="form-helper">{formData.description.length}/3000 characters</span>
            </div>

            {/* Priority Selector */}
            <div className="form-group">
              <label className="form-label">Urgency & Priority Level</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {PRIORITIES.map((p) => {
                  const isSelected = formData.priority === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() => handleInputChange('priority', p.id)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: isSelected
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected
                          ? 'var(--primary-light)'
                          : 'var(--bg-surface)',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          color: isSelected ? 'var(--primary)' : 'var(--text-main)',
                        }}
                      >
                        {p.label}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        {p.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 2: Location Information */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>
                2. Location & Ward Details
              </h3>

              <button
                type="button"
                onClick={handleDetectLocation}
                disabled={gpsLoading}
                className="btn btn-secondary btn-sm"
              >
                {gpsLoading ? (
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                ) : (
                  <Navigation size={14} color="var(--primary)" />
                )}
                <span>Detect GPS Coordinates</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                Incident Street Address / Location *
              </label>
              <input
                id="address"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Master Canteen Square, Janpath Road, Plot 142"
                value={formData.location.address}
                onChange={(e) => handleLocationChange('address', e.target.value)}
              />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
              }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="landmark">
                  Prominent Landmark
                </label>
                <input
                  id="landmark"
                  type="text"
                  className="form-input"
                  placeholder="Opposite Railway Station Gate"
                  value={formData.location.landmark}
                  onChange={(e) => handleLocationChange('landmark', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="ward">
                  Ward / Zone
                </label>
                <input
                  id="ward"
                  type="text"
                  className="form-input"
                  value={formData.location.ward}
                  onChange={(e) => handleLocationChange('ward', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="pincode">
                  PIN Code
                </label>
                <input
                  id="pincode"
                  type="text"
                  className="form-input"
                  value={formData.location.pincode}
                  onChange={(e) => handleLocationChange('pincode', e.target.value)}
                />
              </div>
            </div>

            {formData.location.latitude && formData.location.longitude && (
              <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                <CheckCircle2 size={14} />
                <span>
                  GPS Lat: {formData.location.latitude.toFixed(5)}, Lng: {formData.location.longitude.toFixed(5)} captured
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Photo Attachments */}
          <div style={{ marginBottom: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              3. Visual Evidence & Photo Attachments
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Photographs expedite verification and assist field repair crews.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <input
                type="text"
                className="form-input"
                placeholder="Paste Image URL (or use file upload)"
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                style={{ flex: 1, minWidth: '240px' }}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="btn btn-secondary"
              >
                Add URL
              </button>

              <label className="btn btn-secondary" style={{ cursor: 'pointer', margin: 0 }}>
                <Upload size={16} />
                <span>Upload File</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Image Preview Gallery */}
            {formData.images.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: '0.75rem',
                  marginTop: '1rem',
                }}
              >
                {formData.images.map((imgUrl, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'relative',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      height: '90px',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <img
                      src={imgUrl}
                      alt={`Evidence ${index + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '1rem',
            }}
          >
            <Link to="/dashboard" className="btn btn-secondary">
              Cancel
            </Link>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Submitting Grievance...</span>
                </>
              ) : (
                <>
                  <FilePlus size={18} />
                  <span>Submit Official Grievance</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGrievancePage;
