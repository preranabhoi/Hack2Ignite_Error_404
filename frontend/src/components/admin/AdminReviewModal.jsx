import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  ExternalLink,
  ShieldCheck,
  Send,
  Loader2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';
import StatusTimeline from '../common/StatusTimeline';
import { adminService } from '../../services/api';

const STATUS_LIST = [
  'Submitted',
  'Under Review',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected',
];

const CATEGORIES = [
  'Roads',
  'Waste Management',
  'Water Supply',
  'Electricity',
  'Street Lighting',
  'Drainage',
  'Public Safety',
  'Environment',
  'Other',
];

const DEPARTMENTS = [
  'Public Works & Roads',
  'Waste Management',
  'Water Supply & Sanitation',
  'Electricity & Power',
  'Health & Environment',
  'Traffic & Transport',
  'General Administration',
];

const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

const AdminReviewModal = ({ grievance, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState('assign'); // 'assign' | 'status' | 'override'
  const [officers, setOfficers] = useState([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);

  // Form states
  const [selectedOfficerId, setSelectedOfficerId] = useState(
    grievance?.assignedOfficer?._id || ''
  );
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const [selectedStatus, setSelectedStatus] = useState(grievance?.status || 'Submitted');
  const [statusComment, setStatusComment] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  const [overrideCategory, setOverrideCategory] = useState(grievance?.category || '');
  const [overrideDepartment, setOverrideDepartment] = useState(grievance?.department || '');
  const [overridePriority, setOverridePriority] = useState(grievance?.priority || 'Medium');
  const [overrideReason, setOverrideReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Load officers for assignment
  useEffect(() => {
    const fetchOfficers = async () => {
      setLoadingOfficers(true);
      try {
        const res = await adminService.getOfficers();
        if (res.success) {
          setOfficers(res.officers || []);
        }
      } catch (err) {
        console.error('Failed to load officers:', err);
      } finally {
        setLoadingOfficers(false);
      }
    };

    fetchOfficers();
  }, []);

  if (!grievance) return null;

  // 1-Click Apply AI Analysis
  const handleApplyAIRecs = () => {
    if (grievance.aiAnalysis) {
      if (grievance.aiAnalysis.category) setOverrideCategory(grievance.aiAnalysis.category);
      if (grievance.aiAnalysis.department) setOverrideDepartment(grievance.aiAnalysis.department);
      if (grievance.aiAnalysis.priority) setOverridePriority(grievance.aiAnalysis.priority);
      setOverrideReason('Applied AI Analysis recommendation.');
      setActiveTab('override');
      setFeedback({ type: 'info', message: 'Loaded AI suggestions into override form. Click Save Override to commit.' });
    }
  };

  // Submit Officer Assignment
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOfficerId) {
      setFeedback({ type: 'error', message: 'Please select an officer to assign' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await adminService.assignOfficer(grievance._id, {
        officerId: selectedOfficerId,
        notes: assignmentNotes,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        if (onUpdated) onUpdated(res.grievance);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Assignment failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Status Change
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await adminService.updateStatus(grievance._id, {
        status: selectedStatus,
        comment: statusComment,
        remarks: resolutionRemarks,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        if (onUpdated) onUpdated(res.grievance);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Status update failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Override
  const handleOverrideSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ type: '', message: '' });

    try {
      const res = await adminService.overrideGrievance(grievance._id, {
        category: overrideCategory,
        department: overrideDepartment,
        priority: overridePriority,
        overrideReason,
      });

      if (res.success) {
        setFeedback({ type: 'success', message: res.message });
        if (onUpdated) onUpdated(res.grievance);
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Override failed' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{
          maxWidth: '960px',
          width: '95%',
          padding: '2rem',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  color: 'var(--primary)',
                  background: 'var(--primary-light)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                {grievance.trackingId}
              </span>
              <StatusBadge status={grievance.status} size="sm" />
              <PriorityBadge priority={grievance.priority} size="sm" />
            </div>
            <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', margin: 0 }}>
              {grievance.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.4rem', borderRadius: '50%' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.message && (
          <div
            style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor:
                feedback.type === 'success'
                  ? '#ecfdf5'
                  : feedback.type === 'error'
                  ? '#fef2f2'
                  : '#eff6ff',
              color:
                feedback.type === 'success'
                  ? '#065f46'
                  : feedback.type === 'error'
                  ? '#991b1b'
                  : '#1e40af',
              border: `1px solid ${
                feedback.type === 'success'
                  ? '#a7f3d0'
                  : feedback.type === 'error'
                  ? '#fecaca'
                  : '#bfdbfe'
              }`,
            }}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 size={16} />
            ) : feedback.type === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Sparkles size={16} />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* 2-Column Layout: Left = Grievance Details & AI, Right = Admin Action Panel */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '1.75rem',
          }}
        >
          {/* Left Column: Complaint & AI Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Description */}
            <div
              style={{
                backgroundColor: 'var(--bg-subtle)',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                Citizen Description
              </h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', lineHeight: '1.6', margin: 0 }}>
                {grievance.description}
              </p>
            </div>

            {/* Citizen & Location Meta */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                fontSize: '0.825rem',
              }}
            >
              <div className="card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: 'var(--primary)', fontWeight: 600 }}>
                  <User size={14} />
                  <span>Citizen Details</span>
                </div>
                <div style={{ fontWeight: 600 }}>{grievance.citizenId?.name || 'Anonymous'}</div>
                <div style={{ color: 'var(--text-muted)' }}>{grievance.citizenId?.phone || 'No phone'}</div>
                <div style={{ color: 'var(--text-muted)' }}>{grievance.citizenId?.email || ''}</div>
              </div>

              <div className="card" style={{ padding: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: '#ef4444', fontWeight: 600 }}>
                  <MapPin size={14} />
                  <span>Location</span>
                </div>
                <div style={{ fontWeight: 600 }}>{grievance.location?.address}</div>
                <div style={{ color: 'var(--text-muted)' }}>Ward: {grievance.location?.ward || 'General'}</div>
                {grievance.location?.latitude && (
                  <a
                    href={`https://www.google.com/maps?q=${grievance.location.latitude},${grievance.location.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.75rem', color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.2rem' }}
                  >
                    <span>View Map</span>
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>

            {/* AI Analysis Card */}
            {grievance.aiAnalysis && (
              <div
                style={{
                  backgroundColor: '#f5f3ff',
                  border: '1px solid #c7d2fe',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <Sparkles size={16} />
                    <span>AI Recommendation</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyAIRecs}
                    className="btn btn-sm"
                    style={{ backgroundColor: 'var(--accent)', color: 'white', padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
                  >
                    Apply AI Values
                  </button>
                </div>

                <div style={{ fontSize: '0.8rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', marginBottom: '0.6rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>AI Category: </span>
                    <strong>{grievance.aiAnalysis.category}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>AI Dept: </span>
                    <strong style={{ color: 'var(--primary)' }}>{grievance.aiAnalysis.department}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>AI Priority: </span>
                    <strong style={{ color: '#d97706' }}>{grievance.aiAnalysis.priority}</strong>
                  </div>
                </div>

                <div style={{ fontSize: '0.825rem', color: '#3730a3', backgroundColor: 'rgba(255,255,255,0.7)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '0.4rem' }}>
                  <strong>Summary:</strong> {grievance.aiAnalysis.summary}
                </div>
                <div style={{ fontSize: '0.825rem', color: '#065f46', backgroundColor: '#f0fdfa', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Action:</strong> {grievance.aiAnalysis.suggestedAction}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Admin Action Tabs & Forms */}
          <div className="card" style={{ padding: '1.25rem' }}>
            {/* Tab Navigation */}
            <div
              style={{
                display: 'flex',
                gap: '0.4rem',
                borderBottom: '1px solid var(--border-subtle)',
                paddingBottom: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('assign')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: activeTab === 'assign' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'assign' ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                1. Assign Officer
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('status')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: activeTab === 'status' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'status' ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                2. Status Workflow
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('override')}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  backgroundColor: activeTab === 'override' ? 'var(--primary)' : 'transparent',
                  color: activeTab === 'override' ? 'white' : 'var(--text-muted)',
                  fontWeight: 600,
                  fontSize: '0.825rem',
                  cursor: 'pointer',
                }}
              >
                3. Override Attributes
              </button>
            </div>

            {/* Tab 1: Assign Officer Form */}
            {activeTab === 'assign' && (
              <form onSubmit={handleAssignSubmit}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  Assign to Municipal Officer
                </h4>

                <div className="form-group">
                  <label className="form-label">Select Officer *</label>
                  <select
                    className="form-select"
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Field Officer --</option>
                    {officers.map((off) => (
                      <option key={off._id} value={off._id}>
                        {off.name} ({off.department}) — Active Workload: {off.activeGrievancesCount || 0}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Assignment Directives / Instructions</label>
                  <textarea
                    className="form-textarea"
                    placeholder="e.g. Please conduct site inspection by 4 PM and coordinate with ward contractor."
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </form>
            )}

            {/* Tab 2: Status Workflow Form */}
            {activeTab === 'status' && (
              <form onSubmit={handleStatusSubmit}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  Update Grievance Status
                </h4>

                <div className="form-group">
                  <label className="form-label">New Status</label>
                  <select
                    className="form-select"
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                  >
                    {STATUS_LIST.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Administrative Comment / Reason</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Provide notes visible on timeline (e.g. Work verified by inspection team)."
                    value={statusComment}
                    onChange={(e) => setStatusComment(e.target.value)}
                    style={{ minHeight: '80px' }}
                  />
                </div>

                {selectedStatus === 'Resolved' && (
                  <div className="form-group">
                    <label className="form-label">Resolution Summary Remarks</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Asphalt patch leveled and open drain cleared."
                      value={resolutionRemarks}
                      onChange={(e) => setResolutionRemarks(e.target.value)}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating Status...' : 'Apply Status Change'}
                </button>
              </form>
            )}

            {/* Tab 3: Override Attributes Form */}
            {activeTab === 'override' && (
              <form onSubmit={handleOverrideSubmit}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
                  Administrative Attribute Override
                </h4>

                <div className="form-group">
                  <label className="form-label">Target Category</label>
                  <select
                    className="form-select"
                    value={overrideCategory}
                    onChange={(e) => setOverrideCategory(e.target.value)}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Responsible Department</label>
                  <select
                    className="form-select"
                    value={overrideDepartment}
                    onChange={(e) => setOverrideDepartment(e.target.value)}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority Level</label>
                  <select
                    className="form-select"
                    value={overridePriority}
                    onChange={(e) => setOverridePriority(e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Override Audit Reason</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Reclassified after preliminary inspection."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving Override...' : 'Commit Attribute Override'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReviewModal;
