import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { APP_ROUTES } from '../constants/routes';
import { MATERIAL_CATEGORIES } from '../constants/categories';
import { studyMaterialService } from '../services/studyMaterialService';
import CategoryPill from '../components/CategoryPill';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';

const UploadStudyMaterialPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', category: 'lecture', tags: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      toast.error('Please select a file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10 MB');
      return;
    }

    const payload = new FormData();
    payload.append('file', file);
    payload.append('title', form.title);
    payload.append('description', form.description);
    payload.append('category', form.category);
    payload.append('tags', form.tags);

    try {
      setSubmitting(true);
      setProgress(20);
      await studyMaterialService.upload(payload);
      setProgress(100);
      toast.success('Study material uploaded successfully');
      setTimeout(() => navigate(APP_ROUTES.STUDY_MATERIALS), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Upload failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="card-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Upload Study Material</h1>
        <p className="mt-1 text-sm text-slate-600">Upload approved resources directly for learners.</p>
      </div>

      <form className="card-soft space-y-4" onSubmit={handleSubmit}>
        <input className="input-base" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <textarea className="input-base" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Category</p>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_CATEGORIES.map((item) => (
              <CategoryPill key={item} value={item} selected={form.category === item} onClick={(value) => setForm({ ...form, category: value })} />
            ))}
          </div>
        </div>

        <input className="input-base" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

        <FileDropzone
          file={file}
          onSelect={setFile}
          onRemove={() => setFile(null)}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
        />

        {submitting && <ProgressBar value={progress} />}

        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={() => navigate(APP_ROUTES.DASHBOARD)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>

      <div className="card-soft">
        <h3 className="text-base font-semibold text-slate-900">Helpful Tips</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          <li>Use clear and specific titles.</li>
          <li>Keep descriptions concise and useful.</li>
          <li>Add topic tags to improve discoverability.</li>
          <li>Upload clean, readable files only.</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadStudyMaterialPage;
