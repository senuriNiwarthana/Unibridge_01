import { useEffect, useMemo, useState } from 'react';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';
import { isManagerRole } from '../utils/permissions';
import { studyMaterialService } from '../services/studyMaterialService';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await studyMaterialService.getApproved({ page: 1, limit: 20 });
        setMaterials(response.data.materials || []);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = useMemo(() => {
    const uploaded = materials.filter((item) => item.ownerId === user.id).length;
    const downloads = materials.reduce((sum, item) => sum + (item.downloads || 0), 0);
    const viewed = materials.reduce((sum, item) => sum + (item.viewed || 0), 0);
    return { uploaded, downloads, viewed };
  }, [materials, user.id]);

  const studentActions = [
    { to: APP_ROUTES.STUDY_MATERIALS, title: 'Browse Study Materials', description: 'Explore approved resources', icon: '📖' },
    { to: APP_ROUTES.SUBMIT_STUDY_MATERIAL, title: 'Submit Study Material', description: 'Send your content for review', icon: '📝' }
  ];

  const managerActions = [
    { to: APP_ROUTES.MANAGE_STUDY_MATERIALS, title: 'Manage Study Materials', description: 'Review submissions and statuses', icon: '🗂' },
    { to: APP_ROUTES.MANAGE_MODULES, title: 'Manage Modules', description: 'Maintain year-semester modules', icon: '🧩' },
    { to: APP_ROUTES.UPLOAD_STUDY_MATERIAL, title: 'Upload Study Material', description: 'Directly publish approved resources', icon: '⬆️' },
    ...studentActions
  ];

  if (loading) return <LoadingSpinner label="Loading dashboard" />;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 p-6 text-white fade-up">
        <h1 className="text-2xl font-semibold">Welcome to Unibridge, {user.firstName} 👋</h1>
        <p className="mt-2 text-sm text-white/90">Your academic study materials hub is ready for today.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Uploaded" value={stats.uploaded} icon="📤" />
        <StatCard label="Downloads" value={stats.downloads} icon="⬇️" />
        <StatCard label="Viewed" value={stats.viewed} icon="👁️" />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(isManagerRole(user.role) ? managerActions : studentActions).map((action) => (
            <QuickActionCard key={action.to} {...action} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Recent Activity</h2>
        <EmptyState
          title="No recent activity yet"
          description="Your latest uploads, reviews, and downloads will appear here."
        />
      </section>
    </div>
  );
};

export default DashboardPage;
