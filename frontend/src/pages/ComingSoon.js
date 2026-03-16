import DashboardLayout from '../components/DashboardLayout';

export default function ComingSoon({ title = 'This Module', icon = '🚧' }) {
  return (
    <DashboardLayout>
      <div className="coming-soon">
        <div className="cs-icon">{icon}</div>
        <h3>{title}</h3>
        <p>This module is under development. It will be built in the next sprint.</p>
      </div>
    </DashboardLayout>
  );
}
