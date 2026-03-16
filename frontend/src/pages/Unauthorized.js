import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8fafc', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🚫</div>
      <h1 style={{ fontSize: 28, fontFamily: 'Sora, sans-serif', color: '#1e293b', marginBottom: 8 }}>Access Denied</h1>
      <p style={{ color: '#94a3b8', marginBottom: 24 }}>You don't have permission to view this page.</p>
      <button
        onClick={() => navigate(user ? `/${user.role}/dashboard` : '/login')}
        style={{ padding: '12px 28px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}
