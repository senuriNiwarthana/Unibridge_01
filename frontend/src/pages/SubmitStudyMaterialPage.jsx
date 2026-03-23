import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { APP_ROUTES } from '../constants/routes';
import { MATERIAL_CATEGORIES } from '../constants/categories';
import { moduleService } from '../services/moduleService';
import { studyMaterialService } from '../services/studyMaterialService';
import Stepper from '../components/Stepper';
import CategoryPill from '../components/CategoryPill';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';
import LoadingSpinner from '../components/LoadingSpinner';

const steps = ['Academic Context', 'Study Material Info', 'File Upload'];

const SubmitStudyMaterialPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loadingModules, setLoadingModules] = useState(false);
  const [modules, setModules] = useState([]);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: '',
    year: '',
    semester: '',
    module: '',
    description: '',
    category: 'lecture',
    tags: '',
    file: null
  });

  useEffect(() => {
    if (!form.year || !form.semester) return;

    const fetchModules = async () => {
      try {
        setLoadingModules(true);
        const response = await moduleService.getAll({ year: form.year, semester: form.semester, page: 1 });
        setModules(response.data.modules || []);
      } catch {
        setModules([]);
      } finally {
        setLoadingModules(false);
      }
    };

    fetchModules();
  }, [form.year, form.semester]);

  const titleCount = useMemo(() => form.title.length, [form.title]);
  const descriptionCount = useMemo(() => form.description.length, [form.description]);

  const validateStep = () => {
    const nextErrors = {};

    if (step === 0) {
      if (form.title.length < 5 || form.title.length > 120) nextErrors.title = 'Title must be 5-120 characters';
      if (!form.year) nextErrors.year = 'Year is required';
      if (!form.semester) nextErrors.semester = 'Semester is required';
      if (!form.module) nextErrors.module = 'Module is required';
    }

    if (step === 1 && (form.description.length < 20 || form.description.length > 1000)) {
      nextErrors.description = 'Description must be 20-1000 characters';
    }

    if (step === 2 && !form.file) {
      nextErrors.file = 'File is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('description', form.description);
    payload.append('year', form.year);
    payload.append('semester', form.semester);
    payload.append('module', form.module);
    payload.append('category', form.category);
    payload.append('tags', form.tags);
    payload.append('file', form.file);

    try {
      setSubmitting(true);
      setProgress(25);
      await studyMaterialService.submitForReview(payload);
      setProgress(100);
      toast.success('Submitted for review successfully');
      navigate(APP_ROUTES.DASHBOARD);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Submit Study Material</h1>
        <p className="mt-1 text-sm text-slate-600">Complete the 3-step workflow and submit for review.</p>
      </div>

      <div className="card-soft space-y-4">
        <Stepper steps={steps} current={step} />

        {step === 0 && (
          <div className="space-y-3 fade-up">
            <label className="block text-sm font-medium text-slate-700">Title ({titleCount}/120)</label>
            <input className={`input-base ${errors.title ? 'input-error' : ''}`} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}

            <div className="grid gap-3 md:grid-cols-3">
              <select className={`input-base ${errors.year ? 'input-error shake' : ''}`} value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value, module: '' })}>
                <option value="">Select Year</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <select className={`input-base ${errors.semester ? 'input-error shake' : ''}`} value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value, module: '' })}>
                <option value="">Select Semester</option>
                <option value="1">1st Semester</option>
                <option value="2">2nd Semester</option>
              </select>
              <select className={`input-base ${errors.module ? 'input-error shake' : ''}`} value={form.module} disabled={!form.year || !form.semester || loadingModules} onChange={(e) => setForm({ ...form, module: e.target.value })}>
                <option value="">Select Module</option>
                {modules.map((module) => <option key={module.id} value={module.name}>{module.name}</option>)}
              </select>
            </div>
            {loadingModules && <LoadingSpinner label="Fetching modules" />}
          </div>
        )}

        {step === 1 && (
          <div className="space-y-3 fade-up">
            <label className="block text-sm font-medium text-slate-700">Description ({descriptionCount}/1000)</label>
            <textarea className={`input-base ${errors.description ? 'input-error shake' : ''}`} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <div className="flex flex-wrap gap-2">
              {MATERIAL_CATEGORIES.map((item) => (
                <CategoryPill key={item} value={item} selected={form.category === item} onClick={(value) => setForm({ ...form, category: value })} />
              ))}
            </div>
            <input className="input-base" placeholder="Tags (optional)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 fade-up">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <p><strong>Title:</strong> {form.title}</p>
              <p><strong>Year/Semester:</strong> {form.year} / {form.semester}</p>
              <p><strong>Module:</strong> {form.module}</p>
              <p><strong>Category:</strong> <span className="capitalize">{form.category}</span></p>
            </div>
            <FileDropzone
              file={form.file}
              onSelect={(selected) => setForm({ ...form, file: selected })}
              onRemove={() => setForm({ ...form, file: null })}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
            />
            {errors.file && <p className="text-xs text-red-500">{errors.file}</p>}
            {submitting && <ProgressBar value={progress} />}
          </div>
        )}

        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => (step === 0 ? navigate(APP_ROUTES.DASHBOARD) : setStep(step - 1))}>{step === 0 ? 'Cancel' : 'Back'}</button>
          </div>
          <div>
            {step < 2 ? (
              <button type="button" className="btn-primary" onClick={() => validateStep() && setStep(step + 1)}>Continue</button>
            ) : (
              <button type="button" className="btn-primary" disabled={submitting} onClick={handleSubmit}>Submit for Review</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmitStudyMaterialPage;
