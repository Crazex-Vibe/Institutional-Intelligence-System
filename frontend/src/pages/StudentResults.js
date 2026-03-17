import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './StudentResults.css';

const GRADE_POINTS = { O: 10, 'A+': 9, A: 8, 'B+': 7, B: 6, C: 5, U: 0, RA: 0, '--': 0 };
const GRADE_COLOR = {
  O:   { bg: '#dcfce7', color: '#15803d' },
  'A+':{ bg: '#dbeafe', color: '#1d4ed8' },
  A:   { bg: '#eff6ff', color: '#2563eb' },
  'B+':{ bg: '#fef9c3', color: '#a16207' },
  B:   { bg: '#fef3c7', color: '#b45309' },
  C:   { bg: '#fff7ed', color: '#c2410c' },
  U:   { bg: '#fef2f2', color: '#dc2626' },
  RA:  { bg: '#fef2f2', color: '#dc2626' },
  '--':{ bg: '#f1f5f9', color: '#94a3b8' },
};

export default function StudentResults() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSem, setExpandedSem] = useState(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/profile/me');
      setProfile(res.data.profile);
      // Auto-expand latest published semester
      const published = res.data.profile?.semesters?.filter(s => s.isResultPublished);
      if (published?.length > 0) {
        setExpandedSem(published[published.length - 1].semesterNumber);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <DashboardLayout><div className="sr-loading">⏳ Loading results...</div></DashboardLayout>;

  const semesters = profile?.semesters?.sort((a, b) => a.semesterNumber - b.semesterNumber) || [];
  const published = semesters.filter(s => s.isResultPublished);
  const cgpa = profile?.cgpa || 0;
  const totalCredits = profile?.totalCreditsEarned || 0;
  const totalArrears = profile?.totalArrears || 0;

  // Build CGPA trend data
  const trend = published.map(s => ({ sem: s.semesterNumber, sgpa: s.sgpa || 0 }));

  return (
    <DashboardLayout>
      <div className="sr-root">
        <div className="sr-header">
          <h1>Results & GPA</h1>
          <p>Semester-wise academic performance</p>
        </div>

        {/* Top stats */}
        <div className="sr-stats">
          {[
            { icon: '🎓', label: 'CGPA', val: cgpa.toFixed(2), sub: 'Cumulative', color: '#2563eb', bg: '#eff6ff' },
            { icon: '📚', label: 'Credits Earned', val: totalCredits, sub: 'Total', color: '#7c3aed', bg: '#f5f3ff' },
            { icon: '📋', label: 'Semesters', val: published.length, sub: 'Results Published', color: '#15803d', bg: '#dcfce7' },
            { icon: '⚠️', label: 'Arrears', val: totalArrears, sub: 'Pending', color: totalArrears > 0 ? '#dc2626' : '#15803d', bg: totalArrears > 0 ? '#fef2f2' : '#dcfce7' },
          ].map(s => (
            <div key={s.label} className="sr-stat-card" style={{ borderTop: `4px solid ${s.color}` }}>
              <span className="src-icon">{s.icon}</span>
              <span className="src-val" style={{ color: s.color }}>{s.val}</span>
              <span className="src-label">{s.label}</span>
              <span className="src-sub">{s.sub}</span>
            </div>
          ))}
        </div>

        {/* SGPA Trend Chart */}
        {trend.length > 0 && (
          <div className="sr-card">
            <h3 className="sr-card-title">📈 SGPA Trend</h3>
            <div className="sgpa-chart">
              {trend.map((t, i) => {
                const h = Math.max(8, (t.sgpa / 10) * 120);
                const color = t.sgpa >= 8 ? '#22c55e' : t.sgpa >= 6 ? '#3b82f6' : t.sgpa >= 5 ? '#f59e0b' : '#ef4444';
                return (
                  <div key={i} className="sgpa-col">
                    <div className="sgpa-val">{t.sgpa.toFixed(2)}</div>
                    <div className="sgpa-bar" style={{ height: h, background: color }} />
                    <div className="sgpa-sem">Sem {t.sem}</div>
                  </div>
                );
              })}
            </div>
            <div className="sgpa-legend">
              {[['#22c55e','≥8.0 Distinction'],['#3b82f6','6.0–7.9 First Class'],['#f59e0b','5.0–5.9 Second Class'],['#ef4444','<5.0 Reappear']].map(([c,l]) => (
                <span key={l} className="sgpa-leg-item"><span style={{ background: c }} className="sgpa-leg-dot" />{l}</span>
              ))}
            </div>
          </div>
        )}

        {/* Semester Results */}
        <div className="sr-card">
          <h3 className="sr-card-title">📄 Semester-wise Results</h3>
          {semesters.length === 0 ? (
            <div className="sr-empty">No results available yet.</div>
          ) : (
            semesters.map(sem => (
              <div key={sem.semesterNumber} className="sem-block">
                <div
                  className={`sem-header ${expandedSem === sem.semesterNumber ? 'open' : ''}`}
                  onClick={() => setExpandedSem(expandedSem === sem.semesterNumber ? null : sem.semesterNumber)}
                >
                  <div className="sem-header-left">
                    <span className="sem-num">Semester {sem.semesterNumber}</span>
                    {sem.academicYear && <span className="sem-year">{sem.academicYear}</span>}
                    {!sem.isResultPublished && <span className="sem-badge ongoing">In Progress</span>}
                  </div>
                  <div className="sem-header-right">
                    {sem.isResultPublished && (
                      <>
                        <div className="sem-sgpa-pill">SGPA: <strong>{sem.sgpa?.toFixed(2)}</strong></div>
                        <div className="sem-credits-pill">{sem.earnedCredits}/{sem.totalCredits} Credits</div>
                      </>
                    )}
                    <span className="sem-arrow">{expandedSem === sem.semesterNumber ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expandedSem === sem.semesterNumber && (
                  <div className="sem-body">
                    {!sem.isResultPublished ? (
                      <div className="sem-pending">Results not yet published for this semester.</div>
                    ) : (
                      <table className="results-table">
                        <thead>
                          <tr><th>Subject</th><th>Credits</th><th>Grade</th><th>Points</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                          {sem.subjects?.map((subj, i) => {
                            const gc = GRADE_COLOR[subj.grade] || GRADE_COLOR['--'];
                            const gp = GRADE_POINTS[subj.grade] ?? 0;
                            const isArrear = subj.grade === 'U' || subj.grade === 'RA';
                            return (
                              <tr key={i} className={isArrear ? 'arrear-row' : ''}>
                                <td className="subj-name">{subj.name}</td>
                                <td style={{ textAlign: 'center' }}>{subj.credits}</td>
                                <td><span className="grade-chip" style={{ background: gc.bg, color: gc.color }}>{subj.grade}</span></td>
                                <td style={{ textAlign: 'center', fontWeight: 700 }}>{gp}</td>
                                <td>
                                  <span className="status-chip" style={{ background: isArrear ? '#fef2f2' : '#dcfce7', color: isArrear ? '#dc2626' : '#15803d' }}>
                                    {isArrear ? '❌ Arrear' : '✅ Pass'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="tfoot-row">
                            <td colSpan={2} style={{ fontWeight: 700, color: '#1e293b' }}>Semester GPA</td>
                            <td colSpan={3} style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#2563eb' }}>
                              SGPA: {sem.sgpa?.toFixed(2)} &nbsp;|&nbsp; Credits: {sem.earnedCredits}/{sem.totalCredits}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
