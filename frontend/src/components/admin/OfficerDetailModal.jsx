import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Building,
  Shield,
  MapPin,
  Calendar,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Loader2,
  Edit2,
  ChevronRight,
} from 'lucide-react';
import { adminService } from '../../services/api';
import StatusBadge from '../common/StatusBadge';
import PriorityBadge from '../common/PriorityBadge';

const OfficerDetailModal = ({ officerId, onClose, onEdit }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOfficerDetail = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await adminService.getOfficerById(officerId);
        if (res.success) {
          setData(res);
        } else {
          setError('Failed to load officer details.');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading officer profile');
      } finally {
        setLoading(false);
      }
    };

    if (officerId) {
      fetchOfficerDetail();
    }
  }, [officerId]);

  if (!officerId) return null;

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
          maxWidth: '780px',
          maxHeight: '90vh',
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
                width: '2.75rem',
                height: '2.75rem',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #dbeafe',
              }}
            >
              <User size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
                  {data?.officer?.name || 'Field Officer Profile'}
                </h3>
                {data?.officer && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.55rem',
                      borderRadius: '9999px',
                      backgroundColor: data.officer.status === 'active' ? '#ecfdf5' : '#fef2f2',
                      color: data.officer.status === 'active' ? '#047857' : '#b91c1c',
                      border: `1px solid ${data.officer.status === 'active' ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {data.officer.status === 'active' ? '● Active Account' : '○ Inactive Account'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  ID: <strong style={{ color: 'var(--text-main)' }}>{data?.officer?.employeeId || 'N/A'}</strong>
                </span>
                <span style={{ color: 'var(--border-strong)' }}>•</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {data?.officer?.department || 'Department'}
                </span>
              </div>
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
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <div style={{ padding: '3rem 0', textAlign: 'center' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading officer details and workload...</p>
            </div>
          ) : error ? (
            <div
              style={{
                padding: '1rem',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: 'var(--radius-md)',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          ) : data?.officer ? (
            <>
              {/* Workload Statistics Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '0.75rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #dbeafe',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#1d4ed8', fontWeight: 600 }}>Total Assigned</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e40af', marginTop: '0.2rem' }}>
                    {data.stats?.totalAssigned || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fef3c7',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#b45309', fontWeight: 600 }}>In Progress</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#92400e', marginTop: '0.2rem' }}>
                    {data.stats?.inProgress || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #d1fae5',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>Resolved Cases</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#065f46', marginTop: '0.2rem' }}>
                    {data.stats?.resolved || 0}
                  </div>
                </div>

                <div
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>Pending Action</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#334155', marginTop: '0.2rem' }}>
                    {data.stats?.pending || 0}
                  </div>
                </div>
              </div>

              {/* Information Grid */}
              <div
                style={{
                  backgroundColor: '#f8fafc',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid #e2e8f0',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h4 style={{ margin: '0 0 1rem', fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>
                  Official Credentials & Service Placement
                </h4>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      System Security Role
                    </span>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.6rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: '#e0e7ff',
                        color: '#3730a3',
                      }}
                    >
                      <Shield size={13} />
                      {data.officer.role} (Field Officer)
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Officer Classification / Type
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {data.officer.officerType || 'Field Officer'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Department
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {data.officer.department}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Designation
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {data.officer.designation || 'Field Officer'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Official Email
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <Mail size={14} color="var(--text-muted)" />
                      <span>{data.officer.email}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Contact Number
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span>{data.officer.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Ward / Assigned Area
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem', color: 'var(--text-main)' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span>{data.officer.ward || 'All Wards / Unrestricted'}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      City / Municipality
                    </span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                      {data.officer.city || 'Bhubaneswar'}
                    </span>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                      Provisioned On
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      <span>{new Date(data.officer.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Assigned Grievances */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: 700 }}>
                    Recent Assigned Grievances ({data.recentGrievances?.length || 0})
                  </h4>
                </div>

                {!data.recentGrievances || data.recentGrievances.length === 0 ? (
                  <div
                    style={{
                      padding: '2rem',
                      textAlign: 'center',
                      backgroundColor: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                      border: '1px dashed #cbd5e1',
                    }}
                  >
                    <FileText size={28} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                      No grievances currently assigned to this officer.
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Title</th>
                          <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Priority</th>
                          <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</th>
                          <th style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentGrievances.map((g) => (
                          <tr key={g._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem 0.85rem', fontWeight: 600, color: '#4f46e5' }}>
                              {g.trackingId || g._id.slice(-6).toUpperCase()}
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {g.title}
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              <PriorityBadge priority={g.priority} />
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem' }}>
                              <StatusBadge status={g.status} />
                            </td>
                            <td style={{ padding: '0.6rem 0.85rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {new Date(g.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          ) : null}
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
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Close
          </button>
          {data?.officer && (
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onEdit) onEdit(data.officer);
              }}
              className="btn btn-primary"
            >
              <Edit2 size={15} />
              <span>Edit Officer</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfficerDetailModal;
