import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  MapPin,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  PlusCircle,
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

const PREDEFINED_OFFICER_TYPES = [
  'Field Officer',
  'Road Maintenance Officer',
  'Water Supply Officer',
  'Electrical Officer',
  'Sanitation Officer',
  'Drainage Officer',
  'Street Lighting Inspector',
  'Public Safety Officer',
  'Environmental Officer',
  'Other (Custom)',
];

const PREDEFINED_DESIGNATIONS = [
  'Field Officer',
  'Assistant Engineer (AE)',
  'Junior Engineer (JE)',
  'Executive Engineer (EE)',
  'Senior Inspector',
  'Sanitary Inspector',
  'Ward Supervisor',
  'Technical Officer',
  'Other (Custom)',
];

const EditOfficerModal = ({ officer, onClose, onUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Public Works & Roads',
    officerTypeSelect: 'Field Officer',
    customOfficerType: '',
    designationSelect: 'Field Officer',
    customDesignation: '',
    ward: '',
    city: 'Bhubaneswar',
    status: 'active',
    newPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (officer) {
      const isKnownType = PREDEFINED_OFFICER_TYPES.includes(officer.officerType);
      const isKnownDesig = PREDEFINED_DESIGNATIONS.includes(officer.designation);

      setFormData({
        name: officer.name || '',
        email: officer.email || '',
        phone: officer.phone || '',
        employeeId: officer.employeeId || '',
        department: officer.department || 'Public Works & Roads',
        officerTypeSelect: isKnownType ? officer.officerType : 'Other (Custom)',
        customOfficerType: isKnownType ? '' : (officer.officerType || ''),
        designationSelect: isKnownDesig ? officer.designation : 'Other (Custom)',
        customDesignation: isKnownDesig ? '' : (officer.designation || ''),
        ward: officer.ward || '',
        city: officer.city || 'Bhubaneswar',
        status: officer.status || (officer.isActive === false ? 'inactive' : 'active'),
        newPassword: '',
      });
      setError('');
      setSuccessMsg('');
    }
  }, [officer]);

  if (!officer) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formData.name.trim()) {
      setError('Officer name is required');
      return;
    }
    if (!formData.employeeId.trim()) {
      setError('Employee ID is required');
      return;
    }
    if (!formData.department) {
      setError('Please select a department');
      return;
    }
    if (!formData.city.trim()) {
      setError('City / Municipality is required');
      return;
    }

    const effectiveOfficerType =
      formData.officerTypeSelect === 'Other (Custom)'
        ? formData.customOfficerType.trim() || 'Field Officer'
        : formData.officerTypeSelect;

    const effectiveDesignation =
      formData.designationSelect === 'Other (Custom)'
        ? formData.customDesignation.trim() || 'Field Officer'
        : formData.designationSelect;

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department,
        officerType: effectiveOfficerType,
        designation: effectiveDesignation,
        ward: formData.ward.trim(),
        city: formData.city.trim(),
        status: formData.status,
      };

      if (formData.newPassword.trim()) {
        payload.password = formData.newPassword.trim();
      }

      const res = await adminService.updateOfficer(officer._id, payload);

      if (res.success) {
        setSuccessMsg('Officer account updated successfully!');
        setTimeout(() => {
          if (onUpdated) onUpdated(res.officer);
          onClose();
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update officer profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          padding: 0,
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                Edit Field Officer Profile
              </h3>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Update officer service records, department placement, and status
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{
              padding: '0.4rem',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            <X size={20} color="var(--text-muted)" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
            {/* Alerts */}
            {error && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 'var(--radius-md)',
                  color: '#991b1b',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  padding: '0.75rem 1rem',
                  backgroundColor: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  borderRadius: 'var(--radius-md)',
                  color: '#065f46',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1.25rem',
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
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
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>

              {/* Email Address */}
              <div className="form-group">
                <label className="form-label" htmlFor="email">
                  Official Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
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
                  value={formData.employeeId}
                  onChange={handleChange}
                />
              </div>

              {/* Mobile Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="phone">
                  Mobile Contact Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Department */}
              <div className="form-group">
                <label className="form-label" htmlFor="department">
                  Department Placement *
                </label>
                <select
                  id="department"
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
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
                  onChange={handleChange}
                >
                  <option value="active">Active (Can log in & accept grievances)</option>
                  <option value="inactive">Inactive (Deactivated - Login blocked)</option>
                </select>
              </div>

              {/* Officer Type Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="officerTypeSelect">
                  Officer Type / Classification *
                </label>
                <select
                  id="officerTypeSelect"
                  name="officerTypeSelect"
                  className="form-select"
                  value={formData.officerTypeSelect}
                  onChange={handleChange}
                >
                  {PREDEFINED_OFFICER_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Officer Type if Selected */}
              {formData.officerTypeSelect === 'Other (Custom)' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="customOfficerType">
                    Specify Officer Type *
                  </label>
                  <input
                    id="customOfficerType"
                    name="customOfficerType"
                    type="text"
                    required
                    placeholder="e.g. Drainage Inspector"
                    className="form-input"
                    value={formData.customOfficerType}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Designation Selection */}
              <div className="form-group">
                <label className="form-label" htmlFor="designationSelect">
                  Designation *
                </label>
                <select
                  id="designationSelect"
                  name="designationSelect"
                  className="form-select"
                  value={formData.designationSelect}
                  onChange={handleChange}
                >
                  {PREDEFINED_DESIGNATIONS.map((desig) => (
                    <option key={desig} value={desig}>
                      {desig}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Designation if Selected */}
              {formData.designationSelect === 'Other (Custom)' && (
                <div className="form-group">
                  <label className="form-label" htmlFor="customDesignation">
                    Specify Designation *
                  </label>
                  <input
                    id="customDesignation"
                    name="customDesignation"
                    type="text"
                    required
                    placeholder="e.g. Assistant Engineer"
                    className="form-input"
                    value={formData.customDesignation}
                    onChange={handleChange}
                  />
                </div>
              )}

              {/* Ward / Area */}
              <div className="form-group">
                <label className="form-label" htmlFor="ward">
                  Ward / Assigned Area
                </label>
                <input
                  id="ward"
                  name="ward"
                  type="text"
                  placeholder="e.g. Ward 5, Central Zone"
                  className="form-input"
                  value={formData.ward}
                  onChange={handleChange}
                />
              </div>

              {/* City / Municipality */}
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
                  onChange={handleChange}
                />
              </div>

              {/* Optional Reset Password */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label" htmlFor="newPassword">
                  Reset Password (leave empty to keep current password)
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  placeholder="Enter new password to reset"
                  className="form-input"
                  value={formData.newPassword}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div
            style={{
              padding: '1rem 1.5rem',
              borderTop: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              backgroundColor: '#f8fafc',
            }}
          >
            <button type="button" onClick={onClose} className="btn btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOfficerModal;
