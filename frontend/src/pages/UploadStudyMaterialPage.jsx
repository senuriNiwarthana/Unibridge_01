import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { APP_ROUTES } from '../constants/routes';
import { MATERIAL_CATEGORIES } from '../constants/categories';
import { studyMaterialService } from '../services/studyMaterialService';
import CategoryPill from '../components/CategoryPill';
import FileDropzone from '../components/FileDropzone';
import ProgressBar from '../components/ProgressBar';

const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const allowedFileExtensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'zip'];

const getExtension = (fileName = '') => fileName.split('.').pop()?.toLowerCase() || '';
const isValidHttpUrl = (value = '') => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const UploadStudyMaterialPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', description: '', module: '', category: 'lecture', tags: '', externalLink: '' });
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');

  const checkDuplicate = async (title, moduleName) => {
    if (!title.trim() || !moduleName.trim()) {
      setDuplicateWarning('');
      return;
    }
    try {
      const response = await studyMaterialService.checkDuplicate({ title: title.trim(), module: moduleName.trim() });
      setDuplicateWarning(response.data.duplicate ? 'A material with the same title and subject already exists.' : '');
    } catch {
      setDuplicateWarning('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.module.trim()) {
      toast.error('Please provide a subject/module');
      return;
    }

    const trimmedLink = form.externalLink.trim();

    if (!file && !trimmedLink) {
      toast.error('Please upload a file or provide an external link');
      return;
    }

    if (!file && trimmedLink && !isValidHttpUrl(trimmedLink)) {
      toast.error('Please provide a valid external link (https://...)');
      return;
    }

    if (file) {
      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
        toast.error('File must be smaller than 10 MB');
        return;
      }

      if (!allowedFileExtensions.includes(getExtension(file.name))) {
        toast.error('Unsupported file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP');
        return;
      }
    }

    if (duplicateWarning) {
      toast.warn('Duplicate title + subject detected. Please use a unique title or subject.');
      return;
    }

    const payload = new FormData();
    if (file) payload.append('file', file);
    payload.append('title', form.title);
    payload.append('description', form.description);
    payload.append('module', form.module);
    payload.append('category', form.category);
    payload.append('tags', form.tags);
    if (trimmedLink) payload.append('externalLink', trimmedLink);

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
        <input
          className="input-base"
          placeholder="Title"
          value={form.title}
          onChange={(e) => {
            const nextTitle = e.target.value;
            setForm({ ...form, title: nextTitle });
            checkDuplicate(nextTitle, form.module);
          }}
          required
        />
        <textarea className="input-base" rows={4} placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        <input
          className="input-base"
          placeholder="Subject / Module"
          value={form.module}
          onChange={(e) => {
            const nextModule = e.target.value;
            setForm({ ...form, module: nextModule });
            checkDuplicate(form.title, nextModule);
          }}
          required
        />
        {duplicateWarning && <p className="text-xs text-amber-600">{duplicateWarning}</p>}

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Category</p>
          <div className="flex flex-wrap gap-2">
            {MATERIAL_CATEGORIES.map((item) => (
              <CategoryPill key={item} value={item} selected={form.category === item} onClick={(value) => setForm({ ...form, category: value })} />
            ))}
          </div>
        </div>

        <input className="input-base" placeholder="Tags (comma separated)" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} />

        <input
          className="input-base"
          placeholder="External link (optional if file uploaded)"
          value={form.externalLink}
          onChange={(e) => setForm({ ...form, externalLink: e.target.value })}
        />

        <FileDropzone
          file={file}
          onSelect={setFile}
          onRemove={() => setFile(null)}
          accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.zip"
        />
        <p className="text-xs text-slate-500">Allowed: PDF, DOC, DOCX, PPT, PPTX, JPG, PNG, ZIP. Max size: 10 MB.</p>

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
