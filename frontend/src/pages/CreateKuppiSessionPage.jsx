import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

import { APP_ROUTES } from '../constants/routes';
import { moduleService } from '../services/moduleService';
import { kuppiSessionService } from '../services/kuppiSessionService';
import { useAuth } from '../contexts/AuthContext';
import { isManagerRole } from '../utils/permissions';
import EmptyState from '../components/EmptyState';

const initialForm = {
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

const CreateKuppiSessionPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [form, setForm] = useState({
    ...initialForm,
    sessionHost: [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim()
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadingModules, setLoadingModules] = useState(true);
  const [moduleOptions, setModuleOptions] = useState([]);
  const todayDate = useMemo(() => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${today.getFullYear()}-${month}-${day}`;
  }, []);

  const isOnline = useMemo(() => form.sessionType === 'online', [form.sessionType]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await moduleService.getAll({ page: 1 });
        setModuleOptions(response.data.modules || []);
      } catch {
        toast.error('Failed to load modules');
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, []);

  const setField = (name, value) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === 'sessionType' && value === 'physical') {
        next.meetingPlatform = '';
        next.meetingLink = '';
      }
      return next;
    });

    setErrors((prev) => ({ ...prev, [name]: undefined, dateTime: undefined }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) nextErrors.title = 'Session title/topic is required';
    if (!form.sessionType) nextErrors.sessionType = 'Session type is required';
    if (!form.moduleName.trim()) nextErrors.moduleName = 'Module name is required';
    if (!form.description.trim()) nextErrors.description = 'Session description is required';
    if (!form.date) nextErrors.date = 'Date is required';
    if (!form.time) nextErrors.time = 'Time is required';
    if (!form.sessionHost.trim()) nextErrors.sessionHost = 'Session host is required';

    if (form.date) {
      const selected = new Date(`${form.date}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selected < today) {
        nextErrors.date = 'Date cannot be in the past';
      }
    }

    if (form.date && form.time) {
      const selectedDateTime = new Date(`${form.date}T${form.time}:00`);
      if (Number.isNaN(selectedDateTime.getTime())) {
        nextErrors.dateTime = 'Please select a valid date and time';
      } else if (selectedDateTime < new Date()) {
        nextErrors.dateTime = 'Session date/time cannot be in the past';
      }
    }

    if (form.sessionType === 'online') {
      if (!form.meetingPlatform) nextErrors.meetingPlatform = 'Meeting platform is required for online sessions';
      if (!form.meetingLink.trim()) nextErrors.meetingLink = 'Meeting link is required for online sessions';
    }

    if (form.durationMinutes && Number(form.durationMinutes) <= 0) {
      nextErrors.durationMinutes = 'Duration must be greater than zero';
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    try {
      setSubmitting(true);
      await kuppiSessionService.create({
        ...form,
        durationMinutes: Number(form.durationMinutes) || 60
      });
      toast.success('Kuppi session created successfully');
      navigate(APP_ROUTES.DASHBOARD);
    } catch (error) {
      const apiErrors = error.response?.data?.errors;
      if (apiErrors && typeof apiErrors === 'object') {
        setErrors(apiErrors);
      }
      toast.error(error.response?.data?.message || 'Failed to create session');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isManagerRole(user.role)) {
    return <EmptyState title="Access restricted" description="Only admins, managers, and coordinators can create Kuppi sessions." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Create Kuppi Session</h1>
        <p className="mt-1 text-sm text-slate-600">Set up a new physical or online Kuppi session for your module.</p>
      </div>

      <form className="card-soft space-y-4" onSubmit={handleSubmit} noValidate>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Session Title / Topic</label>
          <input
            className="input-base"
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            placeholder="Enter session title"
          />
          {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Session Type</label>
          <select
            className="input-base"
            value={form.sessionType}
            onChange={(event) => setField('sessionType', event.target.value)}
          >
            <option value="">Select session type</option>
            <option value="physical">Physical</option>
            <option value="online">Online</option>
          </select>
          {errors.sessionType && <p className="text-xs text-red-600">{errors.sessionType}</p>}
        </div>

        {isOnline && (
          <>
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Meeting Platform</label>
              <select
                className="input-base"
                value={form.meetingPlatform}
                onChange={(event) => setField('meetingPlatform', event.target.value)}
              >
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
              <input
                className="input-base"
                value={form.meetingLink}
                onChange={(event) => setField('meetingLink', event.target.value)}
                placeholder="https://"
              />
              {errors.meetingLink && <p className="text-xs text-red-600">{errors.meetingLink}</p>}
            </div>
          </>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Module Name</label>
            <select
              className="input-base"
              value={form.moduleName}
              onChange={(event) => setField('moduleName', event.target.value)}
              disabled={loadingModules}
            >
              <option value="">{loadingModules ? 'Loading modules...' : 'Select module'}</option>
              {moduleOptions.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
            {errors.moduleName && <p className="text-xs text-red-600">{errors.moduleName}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Created By / Session Host</label>
            <input
              className="input-base"
              value={form.sessionHost}
              onChange={(event) => setField('sessionHost', event.target.value)}
              placeholder="Session host name"
            />
            {errors.sessionHost && <p className="text-xs text-red-600">{errors.sessionHost}</p>}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Session Description</label>
          <textarea
            className="input-base"
            rows={4}
            value={form.description}
            onChange={(event) => setField('description', event.target.value)}
            placeholder="Describe what will be covered in the session"
          />
          {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Date</label>
            <input
              className="input-base"
              type="date"
              value={form.date}
                min={todayDate}
              onChange={(event) => setField('date', event.target.value)}
            />
            {errors.date && <p className="text-xs text-red-600">{errors.date}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Time</label>
            <input
              className="input-base"
              type="time"
              value={form.time}
              onChange={(event) => setField('time', event.target.value)}
            />
            {errors.time && <p className="text-xs text-red-600">{errors.time}</p>}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Duration (minutes)</label>
            <input
              className="input-base"
              type="number"
              min="1"
              value={form.durationMinutes}
              onChange={(event) => setField('durationMinutes', event.target.value)}
            />
            {errors.durationMinutes && <p className="text-xs text-red-600">{errors.durationMinutes}</p>}
          </div>
        </div>

        {errors.dateTime && <p className="text-xs text-red-600">{errors.dateTime}</p>}

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700">Additional Details</label>
          <textarea
            className="input-base"
            rows={3}
            value={form.additionalDetails}
            onChange={(event) => setField('additionalDetails', event.target.value)}
            placeholder="Any extra information, instructions, or notes"
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(APP_ROUTES.DASHBOARD)}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Creating...' : 'Create Kuppi Session'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateKuppiSessionPage;
