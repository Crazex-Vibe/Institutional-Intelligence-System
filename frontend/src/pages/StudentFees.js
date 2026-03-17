import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StudentFees.css';

const STATUS_STYLE = {
  paid:    { bg: '#dcfce7', color: '#15803d', icon: '✅' },
  pending: { bg: '#fef2f2', color: '#dc2626', icon: '❌' },
  partial: { bg: '#fef3c7', color: '#d97706', icon: '⚠️' },
};

export default function StudentFees() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      setProfile(res.data.profile);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <DashboardLayout><div className="sf-loading">⏳ Loading fee details...</div></DashboardLayout>;

  const fees = profile?.fees?.sort((a, b) => a.semesterNumber - b.semesterNumber) || [];
  const totalAmount = fees.reduce((s, f) => s + (f.totalAmount || 0), 0);
  const totalPaid = fees.reduce((s, f) => s + (f.paidAmount || 0), 0);
  const totalDue = fees.reduce((s, f) => s + (f.dueAmount || 0), 0);
  const scholarship = profile?.scholarship;

  return (
    <DashboardLayout>
      <div className="sf-root">
        <div className="sf-header">
          <h1>Fee Status</h1>
          <p>Your semester-wise fee payment history</p>
        </div>

        {/* Summary */}
        <div className="sf-stats">
          {[
            { icon: '💰', label: 'Total Fee', val: `₹${totalAmount.toLocaleString()}`, color: '#2563eb', bg: '#eff6ff' },
            { icon: '✅', label: 'Total Paid', val: `₹${totalPaid.toLocaleString()}`, color: '#15803d', bg: '#dcfce7' },
            { icon: '⏳', label: 'Total Due', val: `₹${totalDue.toLocaleString()}`, color: totalDue > 0 ? '#dc2626' : '#15803d', bg: totalDue > 0 ? '#fef2f2' : '#dcfce7' },
            { icon: '🏅', label: 'Scholarship', val: scholarship?.status === 'approved' ? `₹${scholarship.amount?.toLocaleString()}` : 'None', color: '#7c3aed', bg: '#f5f3ff' },
          ].map(s => (
            <div key={s.label} className="sf-stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
              <span>{s.icon}</span>
              <span className="sfc-val" style={{ color: s.color }}>{s.val}</span>
              <span className="sfc-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Overall due alert */}
        {totalDue > 0 && (
          <div className="sf-alert">
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: '#dc2626' }}>Outstanding Balance: ₹{totalDue.toLocaleString()}</div>
              <div style={{ fontSize: 12, color: '#ef4444', marginTop: 2 }}>Please clear your dues to avoid exam restrictions.</div>
            </div>
          </div>
        )}

        {/* Scholarship info */}
        {scholarship?.status === 'approved' && (
          <div className="sf-scholarship">
            <span style={{ fontSize: 20 }}>🏅</span>
            <div>
              <div style={{ fontWeight: 700, color: '#7c3aed' }}>Scholarship Approved</div>
              <div style={{ fontSize: 12, color: '#6d28d9', marginTop: 2 }}>
                {scholarship.scholarshipType} — ₹{scholarship.amount?.toLocaleString()} per year
              </div>
            </div>
          </div>
        )}

        {/* Fee cards per semester */}
        <div className="sf-card">
          <h3 className="sf-card-title">📋 Semester-wise Fee Details</h3>
          {fees.length === 0 ? (
            <div className="sf-empty">No fee records found.</div>
          ) : (
            <div className="sf-fee-list">
              {fees.map((fee, i) => {
                const st = STATUS_STYLE[fee.status] || STATUS_STYLE.pending;
                const paidPct = fee.totalAmount > 0 ? Math.round((fee.paidAmount / fee.totalAmount) * 100) : 0;
                return (
                  <div key={i} className="sf-fee-card">
                    <div className="sfc-top">
                      <div className="sfc-left">
                        <div className="sfc-sem">Semester {fee.semesterNumber}</div>
                        <div className="sfc-year">{fee.academicYear}</div>
                      </div>
                      <span className="sfc-status" style={{ background: st.bg, color: st.color }}>
                        {st.icon} {fee.status?.charAt(0).toUpperCase() + fee.status?.slice(1)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="sfc-progress-wrap">
                      <div className="sfc-progress-track">
                        <div
                          className="sfc-progress-fill"
                          style={{
                            width: `${paidPct}%`,
                            background: fee.status === 'paid' ? '#22c55e' : fee.status === 'partial' ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="sfc-pct">{paidPct}% paid</span>
                    </div>

                    <div className="sfc-amounts">
                      <div className="sfc-amount-item">
                        <label>Total</label>
                        <span>₹{fee.totalAmount?.toLocaleString()}</span>
                      </div>
                      <div className="sfc-amount-item">
                        <label>Paid</label>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>₹{fee.paidAmount?.toLocaleString()}</span>
                      </div>
                      <div className="sfc-amount-item">
                        <label>Due</label>
                        <span style={{ color: fee.dueAmount > 0 ? '#dc2626' : '#15803d', fontWeight: 700 }}>
                          ₹{fee.dueAmount?.toLocaleString()}
                        </span>
                      </div>
                      {fee.dueDate && (
                        <div className="sfc-amount-item">
                          <label>Due Date</label>
                          <span style={{ color: new Date(fee.dueDate) < new Date() && fee.dueAmount > 0 ? '#dc2626' : '#475569' }}>
                            {new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
