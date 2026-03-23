import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { kuppiSessionService } from '../services/kuppiSessionService';
import { useAuth } from '../contexts/AuthContext';
import { isManagerRole } from '../utils/permissions';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/formatters';

const initialEditForm = {
  id: '',
  title: '',
  sessionType: '',
  meetingPlatform: '',
  meetingLink: '',
  moduleName: '',
  description: '',
  date: '',
  time: '',
  sessionHost: '',
  durationMinutes: 60,
  additionalDetails: ''
};

const getStartDate = (session) => {
  const value = new Date(`${session.date}T${session.time}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
};

const isUpcomingSession = (session) => {
  const start = getStartDate(session);
  if (!start) return false;
  return start > new Date();
};

const normalizeList = (sessions = []) => sessions
  .map((session) => ({ ...session, isUpcoming: isUpcomingSession(session) }))
  .sort((a, b) => {
    const left = getStartDate(a)?.getTime() || 0;
    const right = getStartDate(b)?.getTime() || 0;
    return left - right;
  });

const splitUpcomingAndPast = (sessions) => ({
  upcoming: sessions.filter((item) => item.isUpcoming),
  past: sessions.filter((item) => !item.isUpcoming)
});

const ManageKuppiSessionsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [filters, setFilters] = useState({ search: '', moduleName: '' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState('');
  const [editForm, setEditForm] = useState(initialEditForm);
  const [errors, setErrors] = useState({});

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await kuppiSessionService.getAll({ page: 1, limit: 200 });
      setSessions(normalizeList(response.data.sessions || []));
    } catch {
      toast.error('Failed to load Kuppi sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const filtered = useMemo(() => {
    const searchQuery = filters.search.trim().toLowerCase();
    const moduleQuery = filters.moduleName.trim().toLowerCase();

    return sessions.filter((session) => {
      const matchesSearch = !searchQuery
        || String(session.title || '').toLowerCase().includes(searchQuery)
        || String(session.description || '').toLowerCase().includes(searchQuery)
        || String(session.sessionHost || '').toLowerCase().includes(searchQuery);

      const matchesModule = !moduleQuery
        || String(session.moduleName || '').toLowerCase().includes(moduleQuery);

      return matchesSearch && matchesModule;
    });
  }, [sessions, filters.moduleName, filters.search]);

  const groupedSessions = useMemo(() => splitUpcomingAndPast(filtered), [filtered]);

  const updateEditField = (name, value) => {
    setEditForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'sessionType' && value === 'physical') {
        next.meetingPlatform = '';
        next.meetingLink = '';
      }
      return next;
    });

    setErrors((prev) => ({ ...prev, [name]: undefined, dateTime: undefined }));
  };

  const openEditModal = (session) => {
    setEditForm({
      id: session.id,
      title: session.title || '',
      sessionType: session.sessionType || '',
      meetingPlatform: session.meetingPlatform || '',
      meetingLink: session.meetingLink || '',
      moduleName: session.moduleName || '',
      description: session.description || '',
      date: session.date || '',
      time: session.time || '',
      sessionHost: session.sessionHost || '',
      durationMinutes: Number(session.durationMinutes) || 60,
      additionalDetails: session.additionalDetails || ''
    });
    setErrors({});
    setEditModalOpen(true);
  };

  const validateEdit = () => {
    const nextErrors = {};

    if (!editForm.title.trim()) nextErrors.title = 'Session title is required';
    if (!editForm.sessionType) nextErrors.sessionType = 'Session type is required';
    if (!editForm.moduleName.trim()) nextErrors.moduleName = 'Module name is required';
    if (!editForm.sessionHost.trim()) nextErrors.sessionHost = 'Session host is required';
    if (!editForm.description.trim()) nextErrors.description = 'Session description is required';
    if (!editForm.date) nextErrors.date = 'Date is required';
    if (!editForm.time) nextErrors.time = 'Time is required';

    if (editForm.date && editForm.time) {
      const value = new Date(`${editForm.date}T${editForm.time}:00`);
      if (Number.isNaN(value.getTime())) {
        nextErrors.dateTime = 'Please provide a valid date/time';
      } else if (value < new Date()) {
        nextErrors.dateTime = 'Upcoming sessions cannot be moved to past date/time';
      }
    }

    if (editForm.sessionType === 'online') {
      if (!editForm.meetingPlatform) nextErrors.meetingPlatform = 'Meeting platform is required for online sessions';
      if (!editForm.meetingLink.trim()) nextErrors.meetingLink = 'Meeting link is required for online sessions';
    }

    if (editForm.durationMinutes && Number(editForm.durationMinutes) <= 0) {
      nextErrors.durationMinutes = 'Duration must be greater than zero';
    }

    return nextErrors;
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    const validationErrors = validateEdit();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      setSaving(true);
      await kuppiSessionService.update(editForm.id, {
        ...editForm,
        durationMinutes: Number(editForm.durationMinutes) || 60
      });
      toast.success('Session updated successfully');
      setEditModalOpen(false);
      fetchSessions();
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setErrors(apiErrors);
      }
      toast.error(error.response?.data?.message || 'Failed to update session');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await kuppiSessionService.remove(deleteId);
      toast.success('Session deleted successfully');
      setDeleteId('');
      fetchSessions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete session');
    }
  };

  if (!isManagerRole(user.role)) {
    return <EmptyState title="Access restricted" description="Only admins, managers, and coordinators can manage Kuppi sessions." />;
  }

  if (loading) return <LoadingSpinner label="Loading Kuppi sessions" />;

  return (
    <div className="space-y-5">
      <div className="card-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Manage Kuppi Sessions</h1>
        <p className="mt-1 text-sm text-slate-600">Upcoming sessions are editable. Past sessions are view-only.</p>
      </div>

      <div className="card-soft grid gap-3 md:grid-cols-2">
        <input
          className="input-base"
          placeholder="Search by title, description, or host"
          value={filters.search}
          onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
        />
        <input
          className="input-base"
          placeholder="Filter by module"
          value={filters.moduleName}
          onChange={(event) => setFilters((prev) => ({ ...prev, moduleName: event.target.value }))}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Upcoming Sessions</h2>
        {groupedSessions.upcoming.length === 0 ? (
          <EmptyState title="No upcoming sessions" description="Create a Kuppi session to see it here." />
        ) : (
          groupedSessions.upcoming.map((session) => (
            <div key={session.id} className="card-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Upcoming</p>
                  <h3 className="text-base font-semibold text-slate-900">{session.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{session.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{session.moduleName}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{session.sessionType}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(session.date)} at {session.time}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">Host: {session.sessionHost}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" onClick={() => openEditModal(session)}>Edit</button>
                  <button type="button" className="btn-danger" onClick={() => setDeleteId(session.id)}>Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Past Sessions</h2>
        {groupedSessions.past.length === 0 ? (
          <EmptyState title="No past sessions" description="Past sessions will appear here once session time starts or passes." />
        ) : (
          groupedSessions.past.map((session) => (
            <div key={session.id} className="card-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">View Only</p>
                  <h3 className="text-base font-semibold text-slate-900">{session.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{session.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{session.moduleName}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{session.sessionType}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">Status: {session.status || 'past'}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(session.date)} at {session.time}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">Host: {session.sessionHost}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn-secondary" disabled>View Only</button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>

      <Modal isOpen={editModalOpen} title="Edit Kuppi Session" onClose={() => setEditModalOpen(false)}>
        <form className="space-y-3" onSubmit={handleUpdate} noValidate>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Session Title / Topic</label>
            <input className="input-base" value={editForm.title} onChange={(event) => updateEditField('title', event.target.value)} />
            {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Session Type</label>
              <select className="input-base" value={editForm.sessionType} onChange={(event) => updateEditField('sessionType', event.target.value)}>
                <option value="">Select session type</option>
                <option value="physical">Physical</option>
                <option value="online">Online</option>
              </select>
              {errors.sessionType && <p className="text-xs text-red-600">{errors.sessionType}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Module Name</label>
              <input className="input-base" value={editForm.moduleName} onChange={(event) => updateEditField('moduleName', event.target.value)} />
              {errors.moduleName && <p className="text-xs text-red-600">{errors.moduleName}</p>}
            </div>
          </div>

          {editForm.sessionType === 'online' && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Meeting Platform</label>
                <select className="input-base" value={editForm.meetingPlatform} onChange={(event) => updateEditField('meetingPlatform', event.target.value)}>
                  <option value="">Select meeting platform</option>
                  <option value="zoom">Zoom</option>
                  <option value="google-meet">Google Meet</option>
                  <option value="cloud">Cloud</option>
                  <option value="other">Other</option>
                </select>
                {errors.meetingPlatform && <p className="text-xs text-red-600">{errors.meetingPlatform}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Meeting Link</label>
                <input className="input-base" value={editForm.meetingLink} onChange={(event) => updateEditField('meetingLink', event.target.value)} />
                {errors.meetingLink && <p className="text-xs text-red-600">{errors.meetingLink}</p>}
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Session Description</label>
            <textarea className="input-base" rows={3} value={editForm.description} onChange={(event) => updateEditField('description', event.target.value)} />
            {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Date</label>
              <input className="input-base" type="date" value={editForm.date} onChange={(event) => updateEditField('date', event.target.value)} />
              {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Time</label>
              <input className="input-base" type="time" value={editForm.time} onChange={(event) => updateEditField('time', event.target.value)} />
              {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
              <input className="input-base" type="number" min="1" value={editForm.durationMinutes} onChange={(event) => updateEditField('durationMinutes', event.target.value)} />
              {errors.durationMinutes && <p className="text-xs text-red-600">{errors.durationMinutes}</p>}
            </div>
          </div>

          {errors.dateTime && <p className="text-xs text-red-600">{errors.dateTime}</p>}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Created By / Session Host</label>
            <input className="input-base" value={editForm.sessionHost} onChange={(event) => updateEditField('sessionHost', event.target.value)} />
            {errors.sessionHost && <p className="text-xs text-red-600">{errors.sessionHost}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Additional Details</label>
            <textarea className="input-base" rows={3} value={editForm.additionalDetails} onChange={(event) => updateEditField('additionalDetails', event.target.value)} />
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deleteId)}
        title="Delete Kuppi Session"
        message="Are you sure you want to delete this upcoming session? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId('')}
      />
    </div>
  );
};

export default ManageKuppiSessionsPage;
