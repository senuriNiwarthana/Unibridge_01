import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SidebarProfileCard from '../components/SidebarProfileCard';
import { useAuth } from '../contexts/AuthContext';

const AppLayout = () => {
  const { user, updateProfile, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar user={user} onLogout={() => { logout(); navigate('/dashboard'); }} onSwitchRole={switchRole} />
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 md:px-6 lg:grid-cols-[300px_1fr] lg:px-8">
        <SidebarProfileCard
          user={user}
          onProfileChange={(payload) => updateProfile(payload)}
          onRoleChange={(role) => switchRole(role)}
        />
        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
