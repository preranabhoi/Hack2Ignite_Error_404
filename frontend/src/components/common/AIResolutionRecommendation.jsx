import React, { useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Sparkles, X } from 'lucide-react';
import { grievanceService } from '../../services/api';

const AIResolutionRecommendation = ({ grievance, onUseAsNote }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);

  const generateRecommendation = async () => {
    setIsLoading(true);
    setError('');
    setIsDismissed(false);

    try {
      const response = await grievanceService.generateResolutionRecommendation(grievance._id);
      if (response.success && response.recommendation) {
        setRecommendation(response.recommendation);
      } else {
        setError('The AI returned no recommendation. Please try again.');
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          'Unable to generate a recommendation right now. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseAsNote = () => {
    if (!recommendation || !onUseAsNote) return;
    onUseAsNote(recommendation.recommendedActions.join('\n'));
  };

  if (isDismissed) {
    return (
      <button
        type="button"
        onClick={() => setIsDismissed(false)}
        className="btn btn-secondary btn-sm"
        style={{ alignSelf: 'flex-start' }}
      >
        <Sparkles size={14} />
        <span>Show AI Recommendation</span>
      </button>
    );
  }

  return (
    <div
      style={{
        border: '1px solid #c7d2fe',
        borderRadius: 'var(--radius-md)',
        padding: '1rem',
        background: 'linear-gradient(145deg, #f8fafc 0%, #eff6ff 100%)',
      }}
    >
      {!recommendation && !isLoading && (
        <button
          type="button"
          onClick={generateRecommendation}
          className="btn btn-primary btn-sm"
          disabled={isLoading}
        >
          <Sparkles size={15} />
          <span>Generate Resolution Recommendation</span>
        </button>
      )}

      {isLoading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3730a3', fontSize: '0.875rem' }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Generating AI Recommendation...</span>
        </div>
      )}

      {error && !isLoading && (
        <div style={{ color: '#991b1b', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={generateRecommendation} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {recommendation && !isLoading && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.9rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#3730a3', fontWeight: 700 }}>
              <Sparkles size={16} />
              <span>AI Resolution Recommendation</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              aria-label="Dismiss AI recommendation"
              title="Dismiss"
              className="btn btn-secondary btn-sm"
              style={{ padding: '0.25rem' }}
            >
              <X size={15} />
            </button>
          </div>

          <div style={{ marginBottom: '0.85rem' }}>
            <strong style={{ display: 'block', color: '#3730a3', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
              Recommended Actions
            </strong>
            <ol style={{ margin: 0, paddingLeft: '1.25rem', color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: '1.55' }}>
              {recommendation.recommendedActions.map((action, index) => (
                <li key={`${action}-${index}`}>{action}</li>
              ))}
            </ol>
          </div>

          <div style={{ display: 'grid', gap: '0.7rem', fontSize: '0.85rem' }}>
            <div>
              <strong style={{ color: '#3730a3' }}>Recommended Department: </strong>
              <span>{recommendation.recommendedDepartment}</span>
            </div>
            <div>
              <strong style={{ color: '#3730a3' }}>Why this is recommended</strong>
              <p style={{ margin: '0.25rem 0 0', lineHeight: '1.5' }}>{recommendation.urgencyReason}</p>
            </div>
            <div>
              <strong style={{ color: '#0f766e' }}>Suggested citizen message</strong>
              <p style={{ margin: '0.25rem 0 0', lineHeight: '1.5', color: '#134e4a' }}>{recommendation.citizenCommunication}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" onClick={handleUseAsNote} className="btn btn-secondary btn-sm">
              <span>Use as Note</span>
            </button>
            <button type="button" onClick={generateRecommendation} className="btn btn-secondary btn-sm">
              <RefreshCw size={14} />
              <span>Regenerate</span>
            </button>
            <button type="button" onClick={() => setIsDismissed(true)} className="btn btn-secondary btn-sm">
              <X size={14} />
              <span>Dismiss</span>
            </button>
          </div>

          <p style={{ margin: '0.85rem 0 0', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Advisory only. Review the recommendation and decide what action to take before updating the grievance.
          </p>
        </>
      )}
    </div>
  );
};

export default AIResolutionRecommendation;
