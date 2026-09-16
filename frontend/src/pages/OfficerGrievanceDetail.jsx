import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  CheckCircle2,
  FileText,
  MapPin,
  User,
  Phone,
  Calendar,
  Sparkles,
  ExternalLink,
  Upload,
  Clock,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { officerService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusTimeline from '../components/common/StatusTimeline';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const OfficerGrievanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form states for inline work update
  const [progressNote, setProgressNote] = useState('');
  const [progressPhoto, setProgressPhoto] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [remarks, setRemarks] = useState('');
  const [resolutionProof, setResolutionProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchGrievance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await officerService.getById(id);
      if (res.success) {
        setGrievance(res.grievance);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load assigned grievance details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievance();
  }, [id]);

  const handleStartWork = async () => {
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await officerService.startWork(grievance._id);
      if (res.success) {
        setGrievance(res.grievance);
        setFeedback({ type: 'success', message: 'Status updated to In Progress. Field crew mobilized!' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to start work' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogProgress = async (e) => {
    e.preventDefault();
    if (!progressNote.trim()) {
      setFeedback({ type: 'error', message: 'Please provide a progress update note.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await officerService.addProgressNote(grievance._id, {
        note: progressNote.trim(),
        image: progressPhoto,
      });

      if (res.success) {
        setGrievance(res.grievance);
        setProgressNote('');
        setProgressPhoto('');
        setFeedback({ type: 'success', message: 'Progress update successfully logged on timeline!' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to log progress' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!actionTaken.trim()) {
      setFeedback({ type: 'error', message: 'Resolution description is mandatory.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await officerService.resolveGrievance(grievance._id, {
        actionTaken: actionTaken.trim(),
        remarks: remarks.trim(),
        resolutionProofImages: resolutionProof ? [resolutionProof] : [],
      });

      if (res.success) {
        setGrievance(res.grievance);
        setFeedback({ type: 'success', message: 'Grievance marked as Resolved and verified!' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Failed to resolve grievance' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return <LoadingState message="Loading officer grievance task..." />;
  }

  if (error || !grievance) {
    return <ErrorState message={error} onRetry={fetchGrievance} />;
  }

  return (
    <div className="app-container main-content" style={{ maxWidth: '980px' }}>
      {/* Top Back Nav */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <Link
          to="/officer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Assigned Queue</span>
        </Link>

        {/* Quick Transition buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['Assigned', 'Under Review'].includes(grievance.status) && (
            <button
              type="button"
              onClick={handleStartWork}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              <Wrench size={14} />
              <span>Start Field Work</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          style={{
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.5rem',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            backgroundColor: feedback.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: feedback.type === 'success' ? '#065f46' : '#991b1b',
            border: `1px solid ${feedback.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Main Task Card */}
      <div className="card-elevated" style={{ marginBottom: '2rem' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'var(--secondary)',
                  background: 'var(--secondary-light)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {grievance.trackingId}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  background: 'var(--bg-subtle)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 600,
                }}
              >
                {grievance.category}
              </span>
            </div>

            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', margin: 0 }}>
              {grievance.title}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={grievance.status} size="lg" />
            <PriorityBadge priority={grievance.priority} size="lg" />
          </div>
        </div>

        {/* Citizen Contact & Location Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Reporting Citizen</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.citizenId?.name || 'Citizen'}</strong>
            <div style={{ color: 'var(--primary)', marginTop: '0.15rem' }}>
              📞 {grievance.citizenId?.phone || 'No phone'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Incident Address</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.location?.address}</strong>
            <div style={{ color: 'var(--text-muted)' }}>Ward: {grievance.location?.ward || 'General'}</div>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Assigned Department</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.department}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Logged On</span>
            <strong style={{ color: 'var(--text-main)' }}>{formatDate(grievance.createdAt)}</strong>
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
            Citizen's Issue Report
          </h3>
          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-main)',
              lineHeight: '1.7',
              whiteSpace: 'pre-wrap',
            }}
          >
            {grievance.description}
          </p>
        </div>

        {/* Photo Evidence */}
        {grievance.images && grievance.images.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
              Site Photographs ({grievance.images.length})
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {grievance.images.map((img, i) => (
                <div
                  key={i}
                  style={{
                    height: '110px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <img src={img} alt="Evidence" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Analysis Layer */}
        {grievance.aiAnalysis && (
          <div
            style={{
              backgroundColor: '#f5f3ff',
              border: '1px solid #c7d2fe',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.6rem' }}>
              <Sparkles size={16} />
              <span>AI Analysis & Field Recommendations</span>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#3730a3', marginBottom: '0.6rem', lineHeight: '1.5' }}>
              <strong>AI Summary:</strong> {grievance.aiAnalysis.summary}
            </p>

            <div style={{ backgroundColor: '#f0fdfa', border: '1px solid #99f6e4', padding: '0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.875rem', color: '#0f766e' }}>
              <strong>Recommended Action:</strong> {grievance.aiAnalysis.suggestedAction}
            </div>
          </div>
        )}

        {/* Resolution Section if already resolved */}
        {grievance.status === 'Resolved' && grievance.resolution && (
          <div
            style={{
              backgroundColor: 'var(--status-resolved-bg)',
              border: '1px solid #a7f3d0',
              borderRadius: 'var(--radius-md)',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <CheckCircle2 size={20} color="var(--status-resolved)" />
              <h3 style={{ fontSize: '1.1rem', color: '#065f46', margin: 0 }}>
                Verified Official Resolution
              </h3>
            </div>
            <p style={{ fontSize: '0.95rem', color: '#064e3b', lineHeight: '1.6', marginBottom: '0.5rem' }}>
              {grievance.resolution.actionTaken}
            </p>
            {grievance.resolution.remarks && (
              <p style={{ fontSize: '0.85rem', color: '#047857', margin: 0 }}>
                <strong>Remarks:</strong> {grievance.resolution.remarks}
              </p>
            )}
            {grievance.resolution.resolvedAt && (
              <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block', marginTop: '0.5rem' }}>
                Resolved on: {formatDate(grievance.resolution.resolvedAt)}
              </span>
            )}
          </div>
        )}

        {/* Progression Timeline */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', marginBottom: '2rem' }}>
          <StatusTimeline
            history={grievance.statusHistory || []}
            currentStatus={grievance.status}
          />
        </div>

        {/* Inline Execution Forms for Officer */}
        {grievance.status !== 'Resolved' && grievance.status !== 'Rejected' && (
          <div
            style={{
              borderTop: '2px solid var(--border-subtle)',
              paddingTop: '2rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Log Progress Box */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <FileText size={18} color="#d97706" />
                <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Log Field Progress</h3>
              </div>

              <form onSubmit={handleLogProgress}>
                <div className="form-group">
                  <label className="form-label">Progress Update Description *</label>
                  <textarea
                    required
                    className="form-textarea"
                    placeholder="e.g. Cleared 150m drain blockage; replacement pipeline delivered."
                    value={progressNote}
                    onChange={(e) => setProgressNote(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Site Photo URL (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://..."
                    value={progressPhoto}
                    onChange={(e) => setProgressPhoto(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  {isSubmitting ? 'Logging...' : 'Record Progress Update'}
                </button>
              </form>
            </div>

            {/* Mark Resolved Box */}
            <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <CheckCircle2 size={18} color="#059669" />
                <h3 style={{ fontSize: '1.05rem', margin: 0, color: '#065f46' }}>Mark Issue Resolved</h3>
              </div>

              <form onSubmit={handleResolve}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#064e3b' }}>
                    Resolution Summary (Action Taken) *
                  </label>
                  <textarea
                    required
                    className="form-textarea"
                    placeholder="e.g. Ruptured pipeline patched with cast iron clamp. Water pressure restored across Lane 4."
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ color: '#064e3b' }}>
                    Remarks / Advice to Residents
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Safe for drinking; maintenance team will monitor for 48h."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary"
                  style={{ width: '100%', backgroundColor: '#059669' }}
                >
                  {isSubmitting ? 'Verifying...' : 'Complete & Close Grievance'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OfficerGrievanceDetailPage;