import React from 'react';
import {
  Layers,
  Building2,
  PieChart as PieIcon,
  TrendingUp,
  BarChart3,
} from 'lucide-react';

const AdminCharts = ({ stats = {} }) => {
  const {
    byCategory = [],
    byDepartment = [],
    byStatus = [],
    overTime = [],
    byPriority = [],
    resolutionTrend = [],
    insights = [],
    total = 0,
  } = stats;

  // Max count for timeline chart scaling
  const maxDailyCount = Math.max(...overTime.map((d) => d.count), 1);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      {/* 1. Grievances by Category */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Layers size={18} color="var(--primary)" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
            Grievances by Category
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {byCategory.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</p>
          ) : (
            byCategory.slice(0, 6).map((cat, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat.category}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${cat.percentage}%`,
                      backgroundColor: 'var(--primary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 2. Grievances by Department */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Building2 size={18} color="var(--secondary)" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
            Workload by Department
          </h3>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {byDepartment.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</p>
          ) : (
            byDepartment.slice(0, 6).map((dept, idx) => (
              <div key={idx}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{dept.department}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {dept.count} ({dept.percentage}%)
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-full)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${dept.percentage}%`,
                      backgroundColor: 'var(--secondary)',
                      borderRadius: 'var(--radius-full)',
                      transition: 'width 0.5s ease-out',
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Grievances by Status Distribution */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <PieIcon size={18} color="var(--accent)" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
            Resolution Pipeline Status
          </h3>
        </div>

        {/* Multi-segment distribution bar */}
        <div
          style={{
            display: 'flex',
            height: '14px',
            borderRadius: 'var(--radius-full)',
            overflow: 'hidden',
            backgroundColor: 'var(--bg-subtle)',
            marginBottom: '1.25rem',
          }}
        >
          {byStatus.map((st, idx) => {
            const widthPct = total > 0 ? (st.count / total) * 100 : 0;
            if (widthPct === 0) return null;
            return (
              <div
                key={idx}
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: st.color,
                  height: '100%',
                  title: `${st.status}: ${st.count}`,
                }}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '0.65rem',
            fontSize: '0.8rem',
          }}
        >
          {byStatus.map((st, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: st.color,
                  display: 'inline-block',
                  flexShrink: 0,
                }}
              />
              <span style={{ color: 'var(--text-muted)' }}>{st.status}:</span>
              <strong style={{ color: 'var(--text-main)', marginLeft: 'auto' }}>{st.count}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Grievance Volume Over Time (7-Day Trend) */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={18} color="#059669" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>
            Complaints Over Time
          </h3>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '120px',
            paddingTop: '1rem',
            gap: '0.5rem',
          }}
        >
          {overTime.map((item, idx) => {
            const barHeightPct = Math.max((item.count / maxDailyCount) * 100, 8);
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1,
                  height: '100%',
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    color: item.count > 0 ? 'var(--primary)' : 'var(--text-subtle)',
                    marginBottom: '0.25rem',
                  }}
                >
                  {item.count}
                </span>
                <div
                  style={{
                    width: '80%',
                    maxWidth: '32px',
                    height: `${barHeightPct}%`,
                    backgroundColor: item.count > 0 ? 'var(--primary)' : 'var(--border-subtle)',
                    borderRadius: '4px 4px 0 0',
                    transition: 'height 0.4s ease-out',
                  }}
                />
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.35rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.label.split(',')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <BarChart3 size={18} color="#dc2626" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>Priority Distribution</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {byPriority.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No data available</p> : byPriority.map((item) => (
            <div key={item.priority}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.25rem' }}>
                <strong>{item.priority}</strong><span>{item.count} ({item.percentage}%)</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${item.percentage}%`, background: item.color || 'var(--primary)' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <TrendingUp size={18} color="#7c3aed" />
          <h3 style={{ fontSize: '1.05rem', margin: 0, color: 'var(--text-main)' }}>Resolution Time Trend</h3>
        </div>
        {resolutionTrend.length === 0 ? <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No resolved grievances in this period</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {resolutionTrend.slice(-8).map((item) => (
              <div key={item.date} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.8rem' }}>
                <span style={{ minWidth: '76px', color: 'var(--text-muted)' }}>{item.date}</span>
                <div style={{ flex: 1, height: '8px', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(item.averageDays * 10, 100)}%`, height: '100%', background: '#7c3aed' }} />
                </div>
                <strong>{item.averageDays}d</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
          <TrendingUp size={18} color="#0f766e" />
          <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Insights</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {insights.map((insight, index) => <p key={index} style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.875rem', lineHeight: 1.5 }}>• {insight}</p>)}
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;
