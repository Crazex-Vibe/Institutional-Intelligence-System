import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import './Timetable.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const HOURS = [1, 2, 3, 4, 5, 6, 7, 8];
const HOUR_TIMES = {
  1: '8:00–8:50', 2: '8:50–9:40', 3: '9:40–10:30',
  4: '10:45–11:35', 5: '11:35–12:25', 6: '1:10–2:00',
  7: '2:00–2:50', 8: '2:50–3:40',
};
const BREAK_AFTER = { 3: '10:30–10:45 Break', 5: '12:25–1:10 Lunch' };

const SUBJECT_COLORS = [
  { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
  { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
  { bg: '#f3e8ff', color: '#7c3aed', border: '#c4b5fd' },
  { bg: '#fef9c3', color: '#a16207', border: '#fde68a' },
  { bg: '#fce7f3', color: '#be185d', border: '#fbcfe8' },
  { bg: '#ffedd5', color: '#c2410c', border: '#fed7aa' },
  { bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
  { bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
];

export default function Timetable({ staffView = false }) {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [today] = useState(new Date().toLocaleDateString('en-US', { weekday: 'long' }));

  // Map subject names to colors consistently
  const subjectColorMap = {};
  let colorIdx = 0;
  const getSubjectColor = (subject) => {
    if (!subject) return { bg: '#f1f5f9', color: '#94a3b8', border: '#e2e8f0' };
    if (!subjectColorMap[subject]) {
      subjectColorMap[subject] = SUBJECT_COLORS[colorIdx % SUBJECT_COLORS.length];
      colorIdx++;
    }
    return subjectColorMap[subject];
  };

  useEffect(() => { fetchTimetable(); }, []);

  const fetchTimetable = async () => {
    try {
      let params = {};
      if (staffView) {
        params = { staffId: user._id || user.id };
      } else {
        const { department, semester, section } = user.studentProfile || {};
        params = { department, semester, section };
      }
      const res = await API.get('/timetable', { params });
      setTimetable(res.data.timetable);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // Build a lookup: day -> hour -> entry
  const buildGrid = () => {
    const grid = {};
    DAYS.forEach(d => { grid[d] = {}; HOURS.forEach(h => { grid[d][h] = null; }); });
    if (!timetable?.schedule) return grid;
    for (const entry of timetable.schedule) {
      if (grid[entry.day]) grid[entry.day][entry.hour] = entry;
    }
    return grid;
  };

  const grid = buildGrid();

  // Today's schedule
  const todaySchedule = HOURS.map(h => grid[today]?.[h]).filter(Boolean);

  if (loading) return <DashboardLayout><div className="tt-loading">⏳ Loading timetable...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="tt-root">
        <div className="tt-header">
          <div>
            <h1>{staffView ? 'My Timetable' : 'Class Timetable'}</h1>
            <p>
              {staffView
                ? `${user.staffProfile?.department} — ${user.staffProfile?.designation}`
                : `${user.studentProfile?.department} | Sem ${user.studentProfile?.semester} | Sec ${user.studentProfile?.section}`}
            </p>
          </div>
          <div className="tt-today-badge">📅 Today: {today}</div>
        </div>

        {!timetable ? (
          <div className="tt-no-data">
            <div style={{ fontSize: 52, marginBottom: 14 }}>🗓️</div>
            <p>No timetable found. Contact your department to set up the schedule.</p>
          </div>
        ) : (
          <>
            {/* Today's classes */}
            {todaySchedule.length > 0 && (
              <div className="tt-today-card">
                <h3 className="tt-section-title">⚡ Today's Classes — {today}</h3>
                <div className="tt-today-list">
                  {HOURS.map(h => {
                    const entry = grid[today]?.[h];
                    if (BREAK_AFTER[h]) {
                      return (
                        <div key={`break-${h}`}>
                          {entry && (
                            <div className="tt-today-item" key={h}>
                              <div className="tti-time">{HOUR_TIMES[h]}</div>
                              <div className="tti-hour">Hr {h}</div>
                              {(() => {
                                const c = getSubjectColor(entry.subject);
                                return (
                                  <div className="tti-subject" style={{ background: c.bg, color: c.color, borderLeft: `3px solid ${c.border}` }}>
                                    <div className="tti-subj-name">{entry.subject}</div>
                                    {entry.staffName && <div className="tti-staff">{entry.staffName}</div>}
                                    {entry.room && <div className="tti-room">📍 {entry.room}</div>}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                          <div className="tt-break-row">{BREAK_AFTER[h]}</div>
                        </div>
                      );
                    }
                    if (!entry) return null;
                    const c = getSubjectColor(entry.subject);
                    return (
                      <div className="tt-today-item" key={h}>
                        <div className="tti-time">{HOUR_TIMES[h]}</div>
                        <div className="tti-hour">Hr {h}</div>
                        <div className="tti-subject" style={{ background: c.bg, color: c.color, borderLeft: `3px solid ${c.border}` }}>
                          <div className="tti-subj-name">{entry.subject}</div>
                          {entry.staffName && <div className="tti-staff">{entry.staffName}</div>}
                          {entry.room && <div className="tti-room">📍 {entry.room}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Full weekly grid */}
            <div className="tt-card">
              <h3 className="tt-section-title">📅 Weekly Schedule</h3>
              <div className="tt-grid-wrap">
                <table className="tt-grid">
                  <thead>
                    <tr>
                      <th className="tt-day-col">Day</th>
                      {HOURS.map(h => (
                        <th key={h} className={`tt-hour-col ${BREAK_AFTER[h - 1] ? 'after-break' : ''}`}>
                          <div>Hour {h}</div>
                          <div className="tt-hour-time">{HOUR_TIMES[h]}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day} className={day === today ? 'today-row' : ''}>
                        <td className="tt-day-cell">
                          <div className="tt-day-name">{day.slice(0, 3)}</div>
                          {day === today && <div className="tt-today-dot">Today</div>}
                        </td>
                        {HOURS.map(h => {
                          const entry = grid[day]?.[h];
                          if (!entry) return <td key={h} className="tt-empty-cell">—</td>;
                          const c = getSubjectColor(entry.subject);
                          return (
                            <td key={h} className="tt-subject-cell">
                              <div className="tt-cell-inner" style={{ background: c.bg, color: c.color, borderLeft: `3px solid ${c.border}` }}>
                                <div className="tt-cell-subj">{entry.subject}</div>
                                {entry.room && <div className="tt-cell-room">{entry.room}</div>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Subject legend */}
              <div className="tt-legend">
                {Object.entries(subjectColorMap).map(([subj, c]) => (
                  <span key={subj} className="tt-legend-item" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
                    {subj}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
