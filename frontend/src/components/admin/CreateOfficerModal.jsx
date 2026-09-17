import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building,
  Mail,
  Lock,
  Phone,
  BadgeAlert,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Shield,
  Briefcase,
} from 'lucide-react';
import { adminService } from '../../services/api';

const DEPARTMENTS = [
  'Public Works & Roads',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Waste Management',
  'Drainage & Sewerage',
  'Street Lighting',
  'Public Safety',
  'Environment',
  'Health & Environment',
  'Traffic & Transport',
  'General Administration',
];

const OFFICER_TYPES = [
  'Field Officer',
  'Road Maintenance Officer',
  'Water Supply Officer',
  'Electrical Officer',
  'Sanitation Officer',
  'Drainage Officer',
  'Drainage Inspector',
  'Environmental Officer',
  'Public Safety Officer',
];

const INITIAL_FORM = {
  name: '',
  email: '',
  phone: '',
  employeeId: '',
  department: 'Public Works & Roads',
  officerType: 'Field Officer',
  customOfficerType: '',
  designation: 'Field Officer',
  ward: '',
  city: 'Bhubaneswar',
  password: '',
  status: 'active',
};

const CreateOfficerModal = ({ onClose, onCreated }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdOfficer, setCreatedOfficer] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password.length < 8) {
      setError('Temporary password must be at least 8 characters long.');
      return;
    }

    if (!formData.employeeId.trim()) {
      setError('Please provide an Employee ID.');
      return;
    }

    const finalOfficerType =
      formData.officerType === 'Custom'
        ? formData.customOfficerType.trim() || 'Field Officer'
        : formData.officerType;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim().toUpperCase(),
        department: formData.department,
        officerType: finalOfficerType,
        designation: formData.designation.trim(),
        ward: formData.ward.trim(),
        city: formData.city.trim() || 'Bhubaneswar',
        password: formData.password,
        status: formData.status,
      };

      const res = await adminService.createOfficer(payload);
      if (res.success && res.officer) {
        setCreatedOfficer(res.officer);
        if (onCreated) onCreated(res.officer);
      } else {
        setError(res.message || 'Failed to create officer account.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create officer account. Please check inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFormData(INITIAL_FORM);
    setCreatedOfficer(null);
    setError('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{
          maxWidth: '620px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#0284c7',
                color: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.15rem', color: 'white', margin: 0 }}>
                {createdOfficer ? 'Officer Account Created' : 'Create Field Officer Account'}
              </h2>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                System Role: Officer (Municipal Field Department)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="modal-close"
            style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {/* Success Screen */}
          {createdOfficer ? (
            <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
              <div
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  borderRadius: '50%',
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '1rem',
                }}
              >
                <CheckCircle2 size={32} />
              </div>

              <h3 style={{ fontSize: '1.35rem', color: '#14532d', marginBottom: '0.35rem' }}>
                Field Officer Account Created
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                The field officer account has been securely provisioned in the database with system role <strong>officer</strong>.
              </p>

              <div
                style={{
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  fontSize: '0.85rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Full Legal Name
                  </span>
                  <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                    {createdOfficer.name}
                  </strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Email Address
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{createdOfficer.email}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Employee ID
                  </span>
                  <strong style={{ color: 'var(--primary)' }}>{createdOfficer.employeeId}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Assigned Department
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{createdOfficer.department}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Officer Type / Classification
                  </span>
                  <strong style={{ color: 'var(--text-main)' }}>{createdOfficer.officerType || 'Field Officer'}</strong>
                </div>

                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>
                    Account Status
                  </span>
                  <span
                    style={{
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    Active
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  color: '#166534',
                  fontSize: '0.825rem',
                  marginBottom: '1.5rem',
                }}
              >
                The officer can now sign in immediately using their email address and temporary password.
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="btn btn-secondary"
                >
                  <UserPlus size={16} />
                  <span>+ Create Another Officer</span>
                </button>
                <button type="button" onClick={onClose} className="btn btn-primary">
                  <span>Done & View Directory</span>
                </button>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1rem',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-md)',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    marginBottom: '1.25rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '1rem',
                }}
              >
                {/* Full Name */}
                <div className="form-group">
                  <label className="form-label" htmlFor="name">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Neha Patil"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Email Address */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Login Email Address *
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input"
                    placeholder="officer.neha@civicai.gov"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Mobile Number */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phone">
                    Mobile Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    className="form-input"
                    placeholder="+91 94370 XXXXX"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Employee ID */}
                <div className="form-group">
                  <label className="form-label" htmlFor="employeeId">
                    Employee ID *
                  </label>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. DRN-042 / PWD-108"
                    value={formData.employeeId}
                    onChange={handleInputChange}
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label className="form-label" htmlFor="department">
                    Department *
                  </label>
                  <select
                    id="department"
                    name="department"
                    required
                    className="form-select"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Officer Type */}
                <div className="form-group">
                  <label className="form-label" htmlFor="officerType">
                    Officer Classification / Type *
                  </label>
                  <select
                    id="officerType"
                    name="officerType"
                    className="form-select"
                    value={formData.officerType}
                    onChange={handleInputChange}
                  >
                    {OFFICER_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="Custom">+ Custom Officer Type...</option>
                  </select>
                </div>

                {/* Custom Officer Type Input */}
                {formData.officerType === 'Custom' && (
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" htmlFor="customOfficerType">
                      Enter Custom Officer Type *
                    </label>
                    <input
                      id="customOfficerType"
                      name="customOfficerType"
                      type="text"
                      required
                      className="form-input"
                      placeholder="e.g. Drainage Executive Inspector"
                      value={formData.customOfficerType}
                      onChange={handleInputChange}
                    />
                  </div>
                )}

                {/* Designation */}
                <div className="form-group">
                  <label className="form-label" htmlFor="designation">
                    Official Designation *
                  </label>
                  <input
                    id="designation"
                    name="designation"
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Assistant Engineer / Lead Inspector"
                    value={formData.designation}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Ward / Area */}
                <div className="form-group">
                  <label className="form-label" htmlFor="ward">
                    Ward / Assigned Area
                  </label>
                  <input
                    id="ward"
                    name="ward"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ward 08 (Nayapalli)"
                    value={formData.ward}
                    onChange={handleInputChange}
                  />
                </div>

                {/* City */}
                <div className="form-group">
                  <label className="form-label" htmlFor="city">
                    City / Municipality *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    className="form-input"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Temporary Password */}
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Temporary Login Password * (min 8 chars)
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="form-input"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Account Status */}
                <div className="form-group">
                  <label className="form-label" htmlFor="status">
                    Account Status *
                  </label>
                  <select
                    id="status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="active">Active (Can log in immediately)</option>
                    <option value="inactive">Inactive (Disabled)</option>
                  </select>
                </div>
              </div>

              {/* Security Banner */}
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                }}
              >
                <Shield size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
                <span>
                  This account will be provisioned securely with <strong>role = "officer"</strong> and assigned to the selected department.
                </span>
              </div>

              {/* Footer Actions */}
              <div
                style={{
                  marginTop: '1.5rem',
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '0.75rem',
                }}
              >
                <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating Officer...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={16} />
                      <span>Create Field Officer</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateOfficerModal;
