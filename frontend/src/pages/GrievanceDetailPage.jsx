import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Check,
  MapPin,
  Building2,
  Calendar,
  User,
  Phone,
  Image as ImageIcon,
  Edit3,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Clock,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { grievanceService } from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import PriorityBadge from '../components/common/PriorityBadge';
import StatusTimeline from '../components/common/StatusTimeline';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const CATEGORIES = [
  { id: 'Roads', label: 'Roads & Potholes' },
  { id: 'Waste Management', label: 'Waste & Sanitation' },
  { id: 'Water Supply', label: 'Water Supply & Leakage' },
  { id: 'Electricity', label: 'Electricity & Power' },
  { id: 'Street Lighting', label: 'Street Lighting' },
  { id: 'Drainage', label: 'Drainage & Sewage' },
  { id: 'Public Safety', label: 'Public Safety' },
  { id: 'Environment', label: 'Health & Pollution' },
  { id: 'Other', label: 'Other Civic Grievances' },
];

const GrievanceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [grievance, setGrievance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedImageModal, setSelectedImageModal] = useState(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: '',
    address: '',
    landmark: '',
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGrievance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await grievanceService.getById(id);
      if (res.success) {
        setGrievance(res.grievance);
        setEditFormData({
          title: res.grievance.title,
          description: res.grievance.description,
          category: res.grievance.category,
          priority: res.grievance.priority,
          address: res.grievance.location?.address || '',
          landmark: res.grievance.location?.landmark || '',
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to load grievance details'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrievance();
  }, [id]);

  const handleCopyTrackingId = () => {
    if (grievance?.trackingId) {
      navigator.clipboard.writeText(grievance.trackingId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsSavingEdit(true);

    try {
      const res = await grievanceService.update(grievance._id, {
        title: editFormData.title,
        description: editFormData.description,
        category: editFormData.category,
        priority: editFormData.priority,
        location: {
          address: editFormData.address,
          landmark: editFormData.landmark,
        },
      });

      if (res.success) {
        setGrievance(res.grievance);
        setIsEditModalOpen(false);
      }
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update grievance');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDeleteGrievance = async () => {
    if (
      !window.confirm(
        'Are you sure you want to withdraw and delete this grievance report?'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await grievanceService.delete(grievance._id);
      if (res.success) {
        navigate('/grievances');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete grievance');
    } finally {
      setIsDeleting(false);
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
    return <LoadingState message="Fetching grievance details and history..." />;
  }

  if (error || !grievance) {
    return <ErrorState message={error} onRetry={fetchGrievance} />;
  }

  const canEdit = ['Submitted', 'Under Review'].includes(grievance.status);
  const canDelete = grievance.status === 'Submitted';

  return (
    <div className="app-container main-content" style={{ maxWidth: '980px' }}>
      {/* Top Back & Quick Actions */}
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
          to="/grievances"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.9rem',
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to My Grievances</span>
        </Link>

        {/* Citizen Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {canEdit && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="btn btn-secondary btn-sm"
            >
              <Edit3 size={14} />
              <span>Edit Details</span>
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={handleDeleteGrievance}
              disabled={isDeleting}
              className="btn btn-danger btn-sm"
            >
              <Trash2 size={14} />
              <span>Withdraw</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grievance Card */}
      <div className="card-elevated" style={{ marginBottom: '2rem' }}>
        {/* Header: Tracking ID & Badges */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '1rem',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  padding: '0.25rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--primary-border)',
                }}
              >
                {grievance.trackingId}
              </span>

              <button
                type="button"
                onClick={handleCopyTrackingId}
                className="btn btn-secondary btn-sm"
                style={{ padding: '0.25rem 0.5rem' }}
                title="Copy tracking ID"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                <span style={{ fontSize: '0.75rem' }}>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            <h1 style={{ fontSize: '1.5rem', lineHeight: '1.3', color: 'var(--text-main)' }}>
              {grievance.title}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <StatusBadge status={grievance.status} size="lg" />
            <PriorityBadge priority={grievance.priority} size="lg" />
          </div>
        </div>

        {/* Grievance Meta Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.75rem',
            fontSize: '0.85rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Category</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.category}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Target Department</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.department}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Reported On</span>
            <strong style={{ color: 'var(--text-main)' }}>{formatDate(grievance.createdAt)}</strong>
          </div>

          <div>
            <span style={{ color: 'var(--text-muted)', display: 'block' }}>Citizen Ward</span>
            <strong style={{ color: 'var(--text-main)' }}>{grievance.location?.ward || 'General'}</strong>
          </div>
        </div>

        {/* Detailed Description */}
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.6rem', color: 'var(--text-main)' }}>
            Description & Impact
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

        {/* AI Analysis Layer Card */}
        {grievance.aiAnalysis && (
          <div
            style={{
              background: 'linear-gradient(145deg, #f8fafc 0%, #eff6ff 50%, #f5f3ff 100%)',
              border: '1px solid #c7d2fe',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              marginBottom: '2rem',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.08)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-main)' }}>
                    AI Analysis & Smart Routing
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Lightweight LLM Assessment Layer
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: grievance.aiAnalysis.status === 'completed' ? '#4338ca' : '#991b1b',
                    background: grievance.aiAnalysis.status === 'completed' ? '#e0e7ff' : '#fee2e2',
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid #c7d2fe',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  {grievance.aiAnalysis.status === 'completed' ? '✨ AI Assisted' : '⚠️ AI Fallback'}
                </span>

                {grievance.aiAnalysis.confidenceScore && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Confidence: {(grievance.aiAnalysis.confidenceScore * 100).toFixed(0)}%
                  </span>
                )}
              </div>
            </div>

            {/* AI Core Attributes Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
                gap: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #e0e7ff',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  AI Classified Category
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>
                  {grievance.aiAnalysis.category || grievance.category}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Recommended Department
                </span>
                <strong style={{ fontSize: '0.9rem', color: 'var(--primary)' }}>
                  {grievance.aiAnalysis.department || grievance.department}
                </strong>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Assessed Urgency Level
                </span>
                <div style={{ marginTop: '0.2rem' }}>
                  <PriorityBadge
                    priority={grievance.aiAnalysis.priority || grievance.priority}
                    size="sm"
                  />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                  Analyzed On
                </span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                  {grievance.aiAnalysis.analyzedAt ? formatDate(grievance.aiAnalysis.analyzedAt) : 'On submission'}
                </span>
              </div>
            </div>

            {/* AI Summary */}
            <div style={{ marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#3730a3', display: 'block', marginBottom: '0.25rem' }}>
                Executive AI Summary
              </span>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: 'var(--text-main)',
                  lineHeight: '1.6',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e0e7ff',
                }}
              >
                {grievance.aiAnalysis.summary}
              </p>
            </div>

            {/* AI Suggested Action */}
            <div style={{ marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0f766e', display: 'block', marginBottom: '0.25rem' }}>
                Recommended Field Action
              </span>
              <p
                style={{
                  fontSize: '0.9rem',
                  color: '#134e4a',
                  lineHeight: '1.6',
                  backgroundColor: '#f0fdfa',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #99f6e4',
                }}
              >
                {grievance.aiAnalysis.suggestedAction}
              </p>
            </div>

            {/* Disclaimer */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.75rem', fontStyle: 'italic' }}>
              ℹ️ AI analysis provides advisory routing suggestions. Municipal officers verify all details and retain full administrative override authority.
            </div>
          </div>
        )}

        {/* Location & Map info */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '1.5rem',
            marginBottom: '2rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
            Incident Location
          </h3>
          <div
            style={{
              backgroundColor: 'var(--bg-main)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MapPin size={16} color="#ef4444" />
              <strong>{grievance.location?.address}</strong>
            </div>

            {grievance.location?.landmark && (
              <div style={{ color: 'var(--text-muted)', marginLeft: '1.5rem', fontSize: '0.85rem' }}>
                Landmark: {grievance.location.landmark}
              </div>
            )}

            <div style={{ color: 'var(--text-muted)', marginLeft: '1.5rem', fontSize: '0.85rem' }}>
              City: {grievance.location?.city} • PIN: {grievance.location?.pincode}
            </div>

            {grievance.location?.latitude && grievance.location?.longitude && (
              <div style={{ marginLeft: '1.5rem', marginTop: '0.25rem' }}>
                <a
                  href={`https://www.google.com/maps?q=${grievance.location.latitude},${grievance.location.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    fontSize: '0.825rem',
                    color: 'var(--primary)',
                    fontWeight: 600,
                  }}
                >
                  <span>View exact coordinates on Map ({grievance.location.latitude.toFixed(4)}, {grievance.location.longitude.toFixed(4)})</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Photo Evidence Gallery */}
        {grievance.images && grievance.images.length > 0 && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Photo Evidence ({grievance.images.length})
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: '0.75rem',
              }}
            >
              {grievance.images.map((imgUrl, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImageModal(imgUrl)}
                  style={{
                    height: '110px',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <img
                    src={imgUrl}
                    alt={`Attachment ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Assigned Officer Card */}
        {grievance.assignedOfficer && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h3 style={{ fontSize: '1.05rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Assigned Field Officer
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                backgroundColor: 'var(--bg-subtle)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '3rem',
                  height: '3rem',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                {grievance.assignedOfficer.name?.charAt(0)}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', margin: 0 }}>{grievance.assignedOfficer.name}</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0.2rem 0' }}>
                  {grievance.assignedOfficer.designation || 'Municipal Officer'} • {grievance.assignedOfficer.department}
                </p>
                {grievance.assignedOfficer.phone && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Phone size={12} />
                    <span>Official: {grievance.assignedOfficer.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Resolution Card (if resolved) */}
        {grievance.status === 'Resolved' && grievance.resolution && (
          <div
            style={{
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--status-resolved-bg)',
                border: '1px solid #a7f3d0',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <CheckCircle2 size={20} color="var(--status-resolved)" />
                <h3 style={{ fontSize: '1.1rem', color: '#065f46', margin: 0 }}>
                  Official Resolution Report
                </h3>
              </div>
              <p style={{ fontSize: '0.95rem', color: '#064e3b', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                {grievance.resolution.actionTaken || 'Field team resolved the complaint and restored public utility.'}
              </p>
              {grievance.resolution.remarks && (
                <p style={{ fontSize: '0.85rem', color: '#047857', marginBottom: '0.75rem' }}>
                  <strong>Remarks:</strong> {grievance.resolution.remarks}
                </p>
              )}
              {grievance.resolution.resolutionProofImages && grievance.resolution.resolutionProofImages.length > 0 && (
                <div style={{ marginTop: '0.75rem', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#065f46', display: 'block', marginBottom: '0.4rem' }}>
                    Resolution Proof Photo(s):
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {grievance.resolution.resolutionProofImages.map((proofImg, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedImageModal(proofImg)}
                        style={{
                          width: '100px',
                          height: '80px',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: '1px solid #a7f3d0',
                        }}
                      >
                        <img
                          src={proofImg}
                          alt={`Proof ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {grievance.resolution.resolvedAt && (
                <span style={{ fontSize: '0.75rem', color: '#059669', display: 'block', marginTop: '0.5rem' }}>
                  Resolved on: {formatDate(grievance.resolution.resolvedAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Progression Timeline */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <StatusTimeline
            history={grievance.statusHistory || []}
            currentStatus={grievance.status}
          />
        </div>
      </div>

      {/* Full Photo Modal */}
      {selectedImageModal && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: '800px', padding: '1rem', textAlign: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImageModal}
              alt="Evidence Full View"
              style={{ width: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 'var(--radius-md)' }}
            />
            <button
              onClick={() => setSelectedImageModal(null)}
              className="btn btn-secondary btn-sm"
              style={{ marginTop: '1rem' }}
            >
              Close Viewer
            </button>
          </div>
        </div>
      )}

      {/* Edit Modal for Citizen */}
      {isEditModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ padding: '2rem' }}>
            <h2 style={{ fontSize: '1.35rem', marginBottom: '1rem' }}>
              Edit Grievance Report
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              You can modify details while the grievance is in Submitted or Under Review status.
            </p>

            {editError && (
              <div
                style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef2f2',
                  color: '#991b1b',
                  fontSize: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                }}
              >
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-select"
                  value={editFormData.category}
                  onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={editFormData.priority}
                  onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  required
                  className="form-textarea"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="btn btn-primary"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GrievanceDetailPage;
