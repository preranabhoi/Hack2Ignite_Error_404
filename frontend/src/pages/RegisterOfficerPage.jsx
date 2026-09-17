import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wrench,
  Mail,
  Lock,
  User,
  Phone,
  Building,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
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
];

const DESIGNATIONS = [
  'Field Officer',
  'Senior Field Officer',
  'Municipal Officer',
  'Department Officer',
  'Assistant Engineer',
  'Senior Executive Engineer',
  'Sanitary Inspector',
];

const RegisterOfficerPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Public Works & Roads',
    designation: 'Field Officer',
    ward: '',
    city: 'Bhubaneswar',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone.trim(),
        employeeId: formData.employeeId.trim(),
        department: formData.department,
        designation: formData.designation.trim() || 'Field Officer',
        ward: formData.ward.trim(),
        city: formData.city.trim(),
      };

      const res = await registerOfficer(payload);
      if (res.success) {
        setIsSuccess(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Field Officer registration failed. Please check your details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        style={{
          maxWidth: '520px',
          margin: '3rem auto',
          padding: '0 1rem',
        }}
      >
        <div className="card-elevated" style={{ textAlign: 'center', padding: '2.5rem 1.5rem' }}>
          <div
            style={{
              width: '4rem',
              height: '4rem',
              borderRadius: '50%',
              backgroundColor: '#f0fdfa',
              color: '#0d9488',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem',
            }}
          >
            <CheckCircle2 size={36} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Field Officer account created successfully.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '2rem' }}>
            Welcome, {formData.name}! Your field officer credentials for {formData.department} have been registered.
          </p>
          <Link
            to="/login/officer"
            className="btn"
            style={{
              width: '100%',
              justifyContent: 'center',
              backgroundColor: '#0d9488',
              color: 'white',
              fontWeight: 700,
            }}
          >
            <span>Sign in as Field Officer</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

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
            Create your CivicAI field officer account.
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
              <div style={{ position: 'relative' }}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Rajesh Verma"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Official Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="officer@civicai.gov"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Mail
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Employee ID */}
            <div className="form-group">
              <label className="form-label" htmlFor="employeeId">
                Employee ID *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="employeeId"
                  name="employeeId"
                  type="text"
                  required
                  placeholder="e.g. PWD-101"
                  className="form-input"
                  value={formData.employeeId}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Briefcase
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Mobile Number
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Phone
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
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

            {/* Designation */}
            <div className="form-group">
              <label className="form-label" htmlFor="designation">
                Designation *
              </label>
              <select
                id="designation"
                name="designation"
                className="form-select"
                value={formData.designation}
                onChange={handleChange}
                required
              >
                {DESIGNATIONS.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            </div>

            {/* Ward / Area */}
            <div className="form-group">
              <label className="form-label" htmlFor="ward">
                Ward / Area
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="ward"
                  name="ward"
                  type="text"
                  placeholder="e.g. Ward 14"
                  className="form-input"
                  value={formData.ward}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <MapPin
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
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
                placeholder="e.g. Bhubaneswar"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password * (min 8 chars)
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                Confirm Password *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="form-input"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={{ paddingLeft: '2.5rem' }}
                />
                <Lock
                  size={16}
                  color="var(--text-subtle)"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
              </div>
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
                <span>Creating Officer Account...</span>
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
          <Link to="/login/officer" style={{ fontWeight: 700, color: '#0d9488' }}>
            Sign in as Field Officer
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterOfficerPage;
