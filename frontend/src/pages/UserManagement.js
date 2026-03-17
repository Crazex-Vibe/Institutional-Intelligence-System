import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import API from '../utils/api';
import './UserManagement.css';

const DEPARTMENTS = ['AI&DS', 'Computer Science', 'Information Technology', 'Electronics', 'Electrical', 'Mechanical', 'Civil'];
const DESIGNATIONS = ['Assistant Professor', 'Associate Professor', 'Professor', 'HOD', 'Lab Instructor'];

const defaultStudent = { name: '', department: 'Computer Science', semester: '1', section: 'A', batch: '2022-2026', rollNumber: '', parentEmail: '', phone: '' };
const defaultStaff = { name: '', department: 'Computer Science', designation: 'Assistant Professor', employeeId: '', phone: '', subjects: '' };

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add-student'); // add-student | add-staff | edit
  const [formData, setFormData] = useState(defaultStudent);
  const [editingUser, setEditingUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null); // shows generated email + password

  useEffect(() => { fetchUsers(); }, [activeTab, filterDept]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { role: activeTab === 'students' ? 'student' : 'staff' };
      if (filterDept) params.department = filterDept;
      const res = await API.get('/users', { params });
      setUsers(res.data.users);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openAddStudent = () => {
    setFormData(defaultStudent);
    setModalType('add-student');
    setFormError(''); setSuccessInfo(null);
    setShowModal(true);
  };

  const openAddStaff = () => {
    setFormData(defaultStaff);
    setModalType('add-staff');
    setFormError(''); setSuccessInfo(null);
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    if (user.role === 'student') {
      setFormData({
        name: user.name,
        department: user.studentProfile?.department || '',
        semester: String(user.studentProfile?.semester || 1),
        section: user.studentProfile?.section || 'A',
        batch: user.studentProfile?.batch || '',
        rollNumber: user.studentProfile?.rollNumber || '',
        parentEmail: user.studentProfile?.parentEmail || '',
        phone: user.studentProfile?.phone || '',
      });
    } else {
      setFormData({
        name: user.name,
        department: user.staffProfile?.department || '',
        designation: user.staffProfile?.designation || '',
        employeeId: user.staffProfile?.employeeId || '',
        phone: user.staffProfile?.phone || '',
        subjects: user.staffProfile?.subjects?.join(', ') || '',
      });
    }
    setModalType('edit');
    setFormError(''); setSuccessInfo(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true); setFormError(''); setSuccessInfo(null);
    try {
      let res;
      if (modalType === 'add-student') {
        res = await API.post('/users/add-student', formData);
        setSuccessInfo(res.data);
      } else if (modalType === 'add-staff') {
        res = await API.post('/users/add-staff', formData);
        setSuccessInfo(res.data);
      } else if (modalType === 'edit') {
        res = await API.put(`/users/${editingUser._id}`, formData);
        setShowModal(false);
      }
      await fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!window.confirm(`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}?`)) return;
    try {
      await API.put(`/users/${user._id}/toggle-status`);
      await fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    }
  };

  const handleResetPassword = async (user) => {
    const id = user.role === 'student' ? user.studentProfile?.rollNumber : user.staffProfile?.employeeId;
    if (!window.confirm(`Reset ${user.name}'s password to their ${user.role === 'student' ? 'roll number' : 'employee ID'} (${id})?`)) return;
    try {
      await API.put(`/users/${user._id}`, { resetPassword: true });
      alert(`Password reset to: ${id}`);
    } catch (err) { alert('Failed to reset password'); }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.studentProfile?.rollNumber?.toLowerCase().includes(search.toLowerCase()) ||
    u.staffProfile?.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = users.filter(u => u.isActive).length;
  const inactiveCount = users.filter(u => !u.isActive).length;

  return (
    <DashboardLayout>
      <div className="um-root">
        {/* Header */}
        <div className="um-header">
          <div>
            <h1>User Management</h1>
            <p>Add, edit and manage students and staff accounts</p>
          </div>
          <div className="um-header-actions">
            <button className="um-btn-staff" onClick={openAddStaff}>+ Add Staff</button>
            <button className="um-btn-student" onClick={openAddStudent}>+ Add Student</button>
          </div>
        </div>

        {/* Summary pills */}
        <div className="um-summary">
          {[
            { label: 'Total', val: users.length, color: '#2563eb', bg: '#eff6ff' },
            { label: 'Active', val: activeCount, color: '#15803d', bg: '#dcfce7' },
            { label: 'Inactive', val: inactiveCount, color: '#dc2626', bg: '#fef2f2' },
          ].map(s => (
            <div key={s.label} className="um-summary-pill" style={{ background: s.bg, color: s.color }}>
              <span className="usp-val">{s.val}</span>
              <span className="usp-label">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tabs + Filters */}
        <div className="um-controls">
          <div className="um-tabs">
            <button className={activeTab === 'students' ? 'active' : ''} onClick={() => { setActiveTab('students'); setSearch(''); }}>🎓 Students</button>
            <button className={activeTab === 'staff' ? 'active' : ''} onClick={() => { setActiveTab('staff'); setSearch(''); }}>👩‍🏫 Staff</button>
          </div>
          <div className="um-filters">
            <input className="um-search" placeholder="🔎 Search name, email, roll no..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="um-dept-filter" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        {/* Users table */}
        <div className="um-table-card">
          {loading ? (
            <div className="um-loading">⏳ Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="um-empty">
              <div style={{ fontSize: 44 }}>👥</div>
              <p>No {activeTab} found.</p>
              <button className="um-btn-student" style={{ marginTop: 12 }} onClick={activeTab === 'students' ? openAddStudent : openAddStaff}>
                + Add First {activeTab === 'students' ? 'Student' : 'Staff'}
              </button>
            </div>
          ) : (
            <table className="um-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  {activeTab === 'students' ? (
                    <><th>Roll No</th><th>Dept / Sem / Sec</th><th>Batch</th></>
                  ) : (
                    <><th>Employee ID</th><th>Department</th><th>Designation</th></>
                  )}
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u._id} className={!u.isActive ? 'inactive-row' : ''}>
                    <td style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="um-avatar" style={{ background: u.isActive ? '#2563eb' : '#94a3b8' }}>{u.name.charAt(0)}</div>
                        <span style={{ fontWeight: 600, color: u.isActive ? '#1e293b' : '#94a3b8' }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: 12, color: '#64748b' }}>{u.email}</td>
                    {activeTab === 'students' ? (
                      <>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{u.studentProfile?.rollNumber}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{u.studentProfile?.department} | Sem {u.studentProfile?.semester} | Sec {u.studentProfile?.section}</td>
                        <td style={{ fontSize: 12, color: '#94a3b8' }}>{u.studentProfile?.batch}</td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>{u.staffProfile?.employeeId}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{u.staffProfile?.department}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{u.staffProfile?.designation}</td>
                      </>
                    )}
                    <td>
                      <span className="status-chip" style={{ background: u.isActive ? '#dcfce7' : '#fef2f2', color: u.isActive ? '#15803d' : '#dc2626' }}>
                        {u.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="action-btn edit" onClick={() => openEdit(u)}>✏️</button>
                        <button className="action-btn reset" onClick={() => handleResetPassword(u)} title="Reset password">🔑</button>
                        <button
                          className={`action-btn ${u.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {u.isActive ? '🚫' : '✅'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <div className="um-modal-overlay" onClick={(e) => { if (e.target.className === 'um-modal-overlay') { setShowModal(false); setSuccessInfo(null); } }}>
          <div className="um-modal">
            <div className="um-modal-header">
              <h2>{modalType === 'add-student' ? '🎓 Add New Student' : modalType === 'add-staff' ? '👩‍🏫 Add New Staff' : `✏️ Edit ${editingUser?.name}`}</h2>
              <button className="um-modal-close" onClick={() => { setShowModal(false); setSuccessInfo(null); }}>✕</button>
            </div>

            {/* Success info after adding */}
            {successInfo && (
              <div className="um-success-box">
                <div className="usb-title">✅ {successInfo.message}</div>
                <div className="usb-credentials">
                  <div className="usb-row"><span>📧 Email:</span><strong>{successInfo.student?.email || successInfo.staff?.email}</strong></div>
                  <div className="usb-row"><span>🔑 Temp Password:</span><strong>{successInfo.student?.tempPassword || successInfo.staff?.tempPassword}</strong></div>
                  <div className="usb-note">Share these credentials with the {modalType === 'add-student' ? 'student' : 'staff member'}. They can change the password after first login.</div>
                </div>
                <button className="um-btn-student" style={{ width: '100%', marginTop: 12 }} onClick={() => { setShowModal(false); setSuccessInfo(null); }}>Done</button>
              </div>
            )}

            {/* Form */}
            {!successInfo && (
              <div className="um-modal-body">
                {/* Common: Name */}
                <div className="mfg">
                  <label>Full Name *</label>
                  <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Anand Balaji" />
                  {modalType === 'add-student' && <span className="mfg-hint">Email will be auto-generated as: {formData.name ? `${formData.name.toLowerCase().replace(/\s+/g, '.')}@college.edu` : 'name@college.edu'}</span>}
                </div>

                {/* Student fields */}
                {(modalType === 'add-student' || (modalType === 'edit' && editingUser?.role === 'student')) && (
                  <>
                    <div className="mfg-row">
                      <div className="mfg">
                        <label>Roll Number *</label>
                        <input value={formData.rollNumber} onChange={e => setFormData({...formData, rollNumber: e.target.value})} placeholder="e.g. 22CS001" disabled={modalType === 'edit'} />
                        {modalType === 'add-student' && <span className="mfg-hint">Temporary password = roll number</span>}
                      </div>
                      <div className="mfg">
                        <label>Batch</label>
                        <input value={formData.batch} onChange={e => setFormData({...formData, batch: e.target.value})} placeholder="e.g. 2022-2026" />
                      </div>
                    </div>
                    <div className="mfg-row">
                      <div className="mfg">
                        <label>Department *</label>
                        <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="mfg">
                        <label>Semester *</label>
                        <select value={formData.semester} onChange={e => setFormData({...formData, semester: e.target.value})}>
                          {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                        </select>
                      </div>
                      <div className="mfg">
                        <label>Section *</label>
                        <select value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})}>
                          {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mfg-row">
                      <div className="mfg">
                        <label>Parent Email</label>
                        <input value={formData.parentEmail} onChange={e => setFormData({...formData, parentEmail: e.target.value})} placeholder="parent@gmail.com" type="email" />
                      </div>
                      <div className="mfg">
                        <label>Phone</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
                      </div>
                    </div>
                  </>
                )}

                {/* Staff fields */}
                {(modalType === 'add-staff' || (modalType === 'edit' && editingUser?.role === 'staff')) && (
                  <>
                    <div className="mfg-row">
                      <div className="mfg">
                        <label>Employee ID *</label>
                        <input value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})} placeholder="e.g. EMP001" disabled={modalType === 'edit'} />
                        {modalType === 'add-staff' && <span className="mfg-hint">Temporary password = employee ID</span>}
                      </div>
                      <div className="mfg">
                        <label>Phone</label>
                        <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="9876543210" />
                      </div>
                    </div>
                    <div className="mfg-row">
                      <div className="mfg">
                        <label>Department *</label>
                        <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                      <div className="mfg">
                        <label>Designation</label>
                        <select value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})}>
                          {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="mfg">
                      <label>Subjects (comma separated)</label>
                      <input value={formData.subjects} onChange={e => setFormData({...formData, subjects: e.target.value})} placeholder="e.g. Data Structures, Algorithms, DBMS" />
                    </div>
                  </>
                )}

                {/* Reset password toggle for edit */}
                {modalType === 'edit' && (
                  <div className="mfg" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="resetPwd" checked={!!formData.resetPassword} onChange={e => setFormData({...formData, resetPassword: e.target.checked})} />
                    <label htmlFor="resetPwd" style={{ fontSize: 13, color: '#475569', cursor: 'pointer', textTransform: 'none', letterSpacing: 0 }}>
                      Reset password to {editingUser?.role === 'student' ? 'roll number' : 'employee ID'}
                    </label>
                  </div>
                )}

                {formError && <div className="um-form-error">⚠️ {formError}</div>}

                <div className="um-modal-actions">
                  <button className="um-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                  <button className="um-btn-save" onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : modalType === 'edit' ? 'Save Changes' : modalType === 'add-student' ? 'Add Student' : 'Add Staff'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
