import React, { useState } from 'react';
import { AlertTriangle, Eye, GitMerge, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';

const DuplicateGrievanceAlert = ({ grievance, adminMode = false, onReviewed }) => {
  const duplicate = grievance?.duplicateDetection;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!duplicate?.isPotentialDuplicate || duplicate.reviewStatus !== 'pending') return null;

  const related = duplicate.relatedGrievanceIds || [];

  const review = async (decision) => {
    setIsSubmitting(true);
    setError('');
    try {
      const response = await adminService.reviewDuplicateDetection(grievance._id, { decision });
      if (response.success) onReviewed?.(response.grievance);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to record duplicate review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        border: '1px solid #fbbf24',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        backgroundColor: '#fffbeb',
        marginBottom: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
        <AlertTriangle size={19} color="#b45309" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
        <div style={{ flex: 1 }}>
          <strong style={{ color: '#92400e', display: 'block' }}>
            {adminMode ? 'Possible Duplicate' : 'Similar complaints may already exist.'}
          </strong>
          <p style={{ color: '#78350f', fontSize: '0.85rem', margin: '0.35rem 0 0.75rem', lineHeight: '1.5' }}>
            {duplicate.reason}
          </p>

          {related.length > 0 && (
            <div>
              <strong style={{ color: '#92400e', fontSize: '0.8rem' }}>Related complaints:</strong>
              <div style={{ display: 'grid', gap: '0.4rem', marginTop: '0.45rem' }}>
                {related.map((relatedGrievance) => (
                  <div key={relatedGrievance._id || relatedGrievance} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', fontSize: '0.82rem' }}>
                    <span style={{ color: '#78350f' }}>
                      #{relatedGrievance.trackingId || relatedGrievance}
                      {relatedGrievance.title ? ` - ${relatedGrievance.title}` : ''}
                    </span>
                    {relatedGrievance._id && (
                      <Link to={`/grievances/${relatedGrievance._id}`} className="btn btn-secondary btn-sm" style={{ padding: '0.25rem 0.5rem' }}>
                        <Eye size={13} /> View
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {adminMode && (
            <>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.9rem' }}>
                <button type="button" onClick={() => review('ignored')} disabled={isSubmitting} className="btn btn-secondary btn-sm">
                  {isSubmitting ? <Loader2 size={14} /> : <X size={14} />}
                  Ignore
                </button>
                <button type="button" onClick={() => review('merged')} disabled={isSubmitting} className="btn btn-primary btn-sm">
                  {isSubmitting ? <Loader2 size={14} /> : <GitMerge size={14} />}
                  Merge
                </button>
              </div>
              <p style={{ color: '#92400e', fontSize: '0.72rem', margin: '0.65rem 0 0', fontStyle: 'italic' }}>
                Merge records the admin decision and preserves the original grievances and citizen history.
              </p>
            </>
          )}
          {error && <p style={{ color: '#991b1b', fontSize: '0.8rem', marginTop: '0.6rem' }}>{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default DuplicateGrievanceAlert;
