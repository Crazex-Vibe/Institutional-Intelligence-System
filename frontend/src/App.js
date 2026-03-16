import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/ProtectedRoute';

// Pages
import ManagementStaff from './pages/ManagementStaff';
import UserManagement from './pages/UserManagement';
import StaffDirectory from './pages/StaffDirectory';
import Analytics from './pages/Analytics';
import EnterMarks from './pages/EnterMarks';
import StudentMarks from './pages/StudentMarks';
import ManagementCIA from './pages/ManagementCIA';
import StaffStudents from './pages/StaffStudents';
import ManagementStudents from './pages/ManagementStudents';
import StudentProfile from './pages/StudentProfile';
import LoginPage from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import Unauthorized from './pages/Unauthorized';
import ComingSoon from './pages/ComingSoon';
import MarkAttendance from './pages/MarkAttendance';
import StudentAttendance from './pages/StudentAttendance';
import AttendanceOverview from './pages/AttendanceOverview';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={
            <PublicOnlyRoute><LoginPage /></PublicOnlyRoute>
          } />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Student routes */}
          <Route path="/student/dashboard" element={
            <ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute allowedRoles={['student']}><StudentProfile /></ProtectedRoute>
          } />
          <Route path="/student/attendance" element={
            <ProtectedRoute allowedRoles={['student']}><StudentAttendance /></ProtectedRoute>
          } />
          <Route path="/student/marks" element={
            <ProtectedRoute allowedRoles={['student']}><StudentMarks /></ProtectedRoute>
          } />
          <Route path="/student/results" element={
            <ProtectedRoute allowedRoles={['student']}><ComingSoon title="Results & GPA" icon="📊" /></ProtectedRoute>
          } />
          <Route path="/student/timetable" element={
            <ProtectedRoute allowedRoles={['student']}><ComingSoon title="Timetable" icon="🕐" /></ProtectedRoute>
          } />
          <Route path="/student/fees" element={
            <ProtectedRoute allowedRoles={['student']}><ComingSoon title="Fee Status" icon="💳" /></ProtectedRoute>
          } />

          {/* Staff routes */}
          <Route path="/staff/dashboard" element={
            <ProtectedRoute allowedRoles={['staff']}><StaffDashboard /></ProtectedRoute>
          } />
          <Route path="/staff/attendance" element={
            <ProtectedRoute allowedRoles={['staff']}><MarkAttendance /></ProtectedRoute>
          } />
          <Route path="/staff/students" element={
            <ProtectedRoute allowedRoles={['staff']}><StaffStudents /></ProtectedRoute>
          } />
          <Route path="/staff/marks" element={
            <ProtectedRoute allowedRoles={['staff']}><EnterMarks /></ProtectedRoute>
          } />
          <Route path="/staff/timetable" element={
            <ProtectedRoute allowedRoles={['staff']}><ComingSoon title="My Timetable" icon="🕐" /></ProtectedRoute>
          } />
          <Route path="/staff/reports" element={
            <ProtectedRoute allowedRoles={['staff']}><ComingSoon title="Reports" icon="📊" /></ProtectedRoute>
          } />
          <Route path="/staff/directory" element={
            <ProtectedRoute allowedRoles={['staff']}><StaffDirectory /></ProtectedRoute>
          } />
          <Route path="/staff/all-students" element={
            <ProtectedRoute allowedRoles={['staff']}><ManagementStudents /></ProtectedRoute>
          } />

          {/* Management routes */}
          <Route path="/management/dashboard" element={
            <ProtectedRoute allowedRoles={['management']}><ManagementDashboard /></ProtectedRoute>
          } />
          <Route path="/management/students" element={
            <ProtectedRoute allowedRoles={['management']}><ManagementStudents /></ProtectedRoute>
          } />
          <Route path="/management/staff" element={
            <ProtectedRoute allowedRoles={['management']}><ManagementStaff /></ProtectedRoute>
          } />
          <Route path="/management/attendance" element={
            <ProtectedRoute allowedRoles={['management']}><AttendanceOverview /></ProtectedRoute>
          } />
          <Route path="/management/classes" element={
            <ProtectedRoute allowedRoles={['management']}><ComingSoon title="Class Tracking" icon="🏫" /></ProtectedRoute>
          } />
          <Route path="/management/reports" element={
            <ProtectedRoute allowedRoles={['management']}><ManagementCIA /></ProtectedRoute>
          } />
          <Route path="/management/users" element={
            <ProtectedRoute allowedRoles={['management']}><UserManagement /></ProtectedRoute>
          } />
	        <Route path="/management/analytics" element={
  	        <ProtectedRoute allowedRoles={['management']}><Analytics /></ProtectedRoute>
	        } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
