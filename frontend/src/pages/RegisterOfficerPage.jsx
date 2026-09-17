import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  Key,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Shield,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  'Street Lighting Officer',
  'Public Safety Officer',
  'Environmental Officer',
  'Other (Custom)',
];

const RegisterOfficerPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Public Works & Roads',
    officerTypeSelect: 'Field Officer',
    customOfficerType: '',
    designation: 'Field Officer',
    ward: '',
    city: 'Bhubaneswar',
    password: '',
    confirmPassword: '',
    registrationCode: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { registerOfficer } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!formData.registrationCode.trim()) {
      setError('Official Officer Registration Code is required for verification.');
      return;
    }

    const effectiveOfficerType =
      formData.officerTypeSelect === 'Other (Custom)'
        ? formData.customOfficerType.trim() || 'Field Officer'
        : formData.officerTypeSelect;

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department,
        officerType: effectiveOfficerType,
        designation: formData.designation.trim() || 'Field Officer',
        ward: formData.ward.trim(),
        city: formData.city.trim(),
        registrationCode: formData.registrationCode.trim(),
      };

      const res = await registerOfficer(payload);
      if (res.success) {
        navigate('/officer');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Field Officer registration failed. Please check your credentials and registration code.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: '650px',
        margin: '2rem auto',
        padding: '0 1rem',
      }}
    >
      <div className="card-elevated">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: '#0d9488',
              color: 'white',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1rem',
              boxShadow: '0 4px 12px rgba(13,148,136,0.3)',
            }}
          >
            <Wrench size={26} />
          </div>
          <h2 style={{ fontSize: '1.6rem', marginBottom: '0.4rem', fontWeight: 800 }}>
            Field Officer Registration
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Register your official field officer account to manage assigned public grievances.
          </p>
        </div>

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
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
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
                placeholder="e.g. Neha Patil"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Official Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="officer@civicai.gov"
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
                placeholder="e.g. DRN-001"
                className="form-input"
                value={formData.employeeId}
                onChange={handleChange}
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
                placeholder="+91 XXXXX XXXXX"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
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

            {/* Officer Type */}
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
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
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

            {/* Designation */}
            <div className="form-group">
              <label className="form-label" htmlFor="designation">
                Designation
              </label>
              <input
                id="designation"
                name="designation"
                type="text"
                placeholder="e.g. Senior Inspector / Field Officer"
                className="form-input"
                value={formData.designation}
                onChange={handleChange}
              />
            </div>

            {/* Ward / Area */}
            <div className="form-group">
              <label className="form-label" htmlFor="ward">
                Ward / Area
              </label>
              <input
                id="ward"
                name="ward"
                type="text"
                placeholder="e.g. Ward 5"
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
                placeholder="e.g. Bhubaneswar / Dhule"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            {/* Officer Registration Code */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" htmlFor="registrationCode" style={{ color: '#0f766e', fontWeight: 700 }}>
                Official Officer Registration Code *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="registrationCode"
                  name="registrationCode"
                  type="password"
                  required
                  placeholder="Enter authorized officer verification code"
                  className="form-input"
                  value={formData.registrationCode}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem', borderColor: '#99f6e4' }}
                />
                <Key
                  size={16}
                  color="#0d9488"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Provided by municipal administration to verify authorized personnel.
              </span>
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="•••••••• (min 8 chars)"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn"
            style={{
              width: '100%',
              marginTop: '1.25rem',
              backgroundColor: '#0d9488',
              color: 'white',
              fontWeight: 700,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Verifying & Registering...</span>
              </>
            ) : (
              <>
                <span>Complete Officer Registration</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
          }}
        >
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterOfficerPage;
