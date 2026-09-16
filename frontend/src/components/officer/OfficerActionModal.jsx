import React, { useState } from 'react';
import {
  X,
  Wrench,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  AlertTriangle,
  Loader2,
  FileText,
  Clock,
} from 'lucide-react';
import { officerService } from '../../services/api';

const OfficerActionModal = ({ grievance, actionType = 'start', onClose, onUpdated }) => {
  const [currentAction, setCurrentAction] = useState(actionType); // 'start' | 'progress' | 'resolve'
  const [notes, setNotes] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [progressImage, setProgressImage] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [resolutionProof, setResolutionProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!grievance) return null;

  const handleFileUpload = (e, setter) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      let res;
      if (currentAction === 'start') {
        res = await officerService.startWork(grievance._id, {
          notes,
          estimatedCompletion: estimatedTime,
        });
      } else if (currentAction === 'progress') {
        if (!notes.trim()) {
          setError('Please provide a progress update note.');
          setIsSubmitting(false);
          return;
        }
        res = await officerService.addProgressNote(grievance._id, {
          note: notes.trim(),
          image: progressImage,
        });
      } else if (currentAction === 'resolve') {
        if (!actionTaken.trim()) {
          setError('Resolution description (action taken) is required.');
          setIsSubmitting(false);
          return;
        }
        res = await officerService.resolveGrievance(grievance._id, {
          actionTaken: actionTaken.trim(),
          remarks: resolutionRemarks.trim(),
          resolutionProofImages: resolutionProof ? [resolutionProof] : [],
        });
      }

      if (res && res.success) {
        if (onUpdated) onUpdated(res.grievance);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to perform action');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '580px', padding: '2rem' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1rem',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {grievance.trackingId}
            </span>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
              {currentAction === 'start'
                ? 'Mobilize Crew & Start Work'
                : currentAction === 'progress'
                ? 'Log Field Progress Update'
                : 'Submit Verified Resolution'}
            </h3>
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

        {/* Action Type Toggle */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.5rem',
            backgroundColor: 'var(--bg-subtle)',
            padding: '0.35rem',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <button
            type="button"
            onClick={() => setCurrentAction('start')}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: currentAction === 'start' ? 'var(--primary)' : 'transparent',
              color: currentAction === 'start' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            1. Start Work
          </button>

          <button
            type="button"
            onClick={() => setCurrentAction('progress')}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: currentAction === 'progress' ? '#d97706' : 'transparent',
              color: currentAction === 'progress' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            2. Log Progress
          </button>

          <button
            type="button"
            onClick={() => setCurrentAction('resolve')}
            style={{
              flex: 1,
              padding: '0.45rem',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              backgroundColor: currentAction === 'resolve' ? '#10b981' : 'transparent',
              color: currentAction === 'resolve' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            3. Mark Resolved
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Start Work Form */}
          {currentAction === 'start' && (
            <div>
              <div className="form-group">
                <label className="form-label">Field Mobilization Note</label>
                <textarea
                  className="form-textarea"
                  placeholder="e.g. Dispatched asphalt patching unit and roller crew to Master Canteen road."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ minHeight: '80px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Estimated Completion Time</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Today by 6:00 PM / Within 24 Hours"
                  value={estimatedTime}
                  onChange={(e) => setEstimatedTime(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Progress Note Form */}
          {currentAction === 'progress' && (
            <div>
              <div className="form-group">
                <label className="form-label">Work Progress Log *</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder="e.g. Excavation complete. Damaged pipeline section replaced. Testing water pressure now."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={{ minHeight: '90px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Site Evidence Photo (Optional)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste Image URL"
                    value={progressImage}
                    onChange={(e) => setProgressImage(e.target.value)}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setProgressImage)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Resolve Grievance Form */}
          {currentAction === 'resolve' && (
            <div>
              <div className="form-group">
                <label className="form-label">Resolution Description (Action Taken) *</label>
                <textarea
                  required
                  className="form-textarea"
                  placeholder="Detailed summary of completed work (e.g. Asphalt resurfacing leveled, 400m drainage desilted, water line restored with zero leakage)."
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  style={{ minHeight: '100px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Remarks / Citizen Advice</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Concrete requires 6 hours curing before heavy vehicle movement."
                  value={resolutionRemarks}
                  onChange={(e) => setResolutionRemarks(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resolution Proof Photograph</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Paste image URL or upload photo"
                    value={resolutionProof}
                    onChange={(e) => setResolutionProof(e.target.value)}
                  />
                  <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', margin: 0 }}>
                    <Upload size={14} />
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setResolutionProof)}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>

                {resolutionProof && (
                  <div style={{ marginTop: '0.5rem', height: '90px', width: '120px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={resolutionProof} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`btn ${currentAction === 'resolve' ? 'btn-primary' : 'btn-primary'}`}
              style={{
                backgroundColor: currentAction === 'resolve' ? '#059669' : undefined,
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  <span>Processing...</span>
                </>
              ) : currentAction === 'resolve' ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>Mark Issue Resolved</span>
                </>
              ) : currentAction === 'start' ? (
                <>
                  <Wrench size={16} />
                  <span>Set In Progress</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Save Progress Log</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OfficerActionModal;