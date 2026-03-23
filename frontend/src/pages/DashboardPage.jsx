import { useEffect, useMemo, useState } from 'react';
import { APP_ROUTES } from '../constants/routes';
import { useAuth } from '../contexts/AuthContext';
import { isManagerRole } from '../utils/permissions';
import { studyMaterialService } from '../services/studyMaterialService';
import { kuppiSessionService } from '../services/kuppiSessionService';
import StatCard from '../components/StatCard';
import QuickActionCard from '../components/QuickActionCard';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';

const DashboardPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsResult, sessionsResult] = await Promise.allSettled([
          studyMaterialService.getApproved({ page: 1, limit: 20 }),
          kuppiSessionService.getAll({ page: 1, limit: 50 })
        ]);

        if (materialsResult.status === 'fulfilled') {
          setMaterials(materialsResult.value.data.materials || []);
        }

        if (sessionsResult.status === 'fulfilled') {
          setSessions(sessionsResult.value.data.sessions || []);
        }
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
    { to: APP_ROUTES.CREATE_KUPPI_SESSION, title: 'Create Kuppi Session', description: 'Create and schedule a new Kuppi session', icon: '🎯' },
    { to: APP_ROUTES.MANAGE_KUPPI_SESSIONS, title: 'Manage Kuppi Sessions', description: 'Edit upcoming sessions and review past sessions', icon: '📅' },
    { to: APP_ROUTES.UPLOAD_STUDY_MATERIAL, title: 'Upload Study Material', description: 'Directly publish approved resources', icon: '⬆️' },
    ...studentActions
  ];

  const sessionStats = useMemo(() => {
    return sessions.reduce((accumulator, session) => {
      const status = String(session.status || '').toLowerCase();
      if (status === 'upcoming') accumulator.upcoming += 1;
      if (status === 'ongoing') accumulator.ongoing += 1;
      if (status === 'completed') accumulator.completed += 1;
      return accumulator;
    }, { upcoming: 0, ongoing: 0, completed: 0 });
  }, [sessions]);

  const recentSessions = useMemo(() => sessions.slice(0, 3), [sessions]);

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

      {!isManagerRole(user.role) && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Sessions (Upcoming / Ongoing / Completed)</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <StatCard label="Upcoming" value={sessionStats.upcoming} icon="🗓️" />
            <StatCard label="Ongoing" value={sessionStats.ongoing} icon="🟢" />
            <StatCard label="Completed" value={sessionStats.completed} icon="✅" />
          </div>
          {recentSessions.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="card-soft">
                  <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{session.status || 'upcoming'}</p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900">{session.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{session.moduleName}</p>
                  <p className="mt-2 text-xs text-slate-500">{session.date} at {session.time}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No sessions yet"
              description="Upcoming, ongoing, and completed Kuppi sessions will appear here."
            />
          )}
        </section>
      )}

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
