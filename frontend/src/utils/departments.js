// src/utils/departments.js
// Single source of truth for all departments
// Import this in any file that needs a department dropdown

export const DEPARTMENTS = [
  'AI&DS',
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical',
  'Mechanical',
  'Civil',
];

// Reusable department select component
export function DeptSelect({ value, onChange, includeAll = false, style = {}, className = '' }) {
  return (
    <select value={value} onChange={onChange} style={style} className={className}>
      {includeAll && <option value="">All Departments</option>}
      {DEPARTMENTS.map(d => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  );
}
