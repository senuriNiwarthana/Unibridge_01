import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { APP_ROUTES } from '../constants/routes';
import { studyMaterialService } from '../services/studyMaterialService';
import { useAuth } from '../contexts/AuthContext';
import StatCard from '../components/StatCard';
import ReviewPanel from '../components/ReviewPanel';
import PaginationControls from '../components/PaginationControls';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatDate, formatFileSize, getInitials } from '../utils/formatters';
import AccordionSection from '../components/AccordionSection';
import { isManagerRole } from '../utils/permissions';

const ManageStudyMaterialsPage = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingReview: 0, approved: 0, rejected: 0, totalStudyMaterials: 0 });
  const [pending, setPending] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [page, setPage] = useState(1);
  const [drafts, setDrafts] = useState({});
  const [completedGrouped, setCompletedGrouped] = useState({});
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState({ open: false, item: null, blobUrl: '' });

  const fetchStats = async () => {
    try {
      const response = await studyMaterialService.getStats();
      setStats(response.data);
    } catch {
      toast.error('Failed to load stats');
    }
  };

  const fetchPending = async () => {
    try {
      setLoading(true);
      const response = await studyMaterialService.getPending({ page, limit: 10 });
      const items = response.data.materials || [];
      setPending(items);
      setPagination(response.data.pagination || pagination);
      setDrafts(items.reduce((acc, item) => ({ ...acc, [item.id]: { category: item.category, reviewNotes: '' } }), {}));
    } catch {
      toast.error('Failed to load pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompleted = async () => {
    try {
      setLoading(true);
      const response = await studyMaterialService.getCompleted({ search });
      setCompletedGrouped(response.data.grouped || {});
    } catch {
      toast.error('Failed to load completed submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (mode === 'pending') fetchPending();
    if (mode === 'completed') fetchCompleted();
  }, [mode, page]);

  const handleReviewAction = async (item, action) => {
    try {
      const draft = drafts[item.id] || { category: item.category, reviewNotes: '' };
      if (action === 'reject' && !draft.reviewNotes.trim()) {
        toast.error('Review notes are required when rejecting');
        return;
      }

      if (action === 'approve') {
        await studyMaterialService.approve(item.id, draft);
        toast.success('Approved successfully');
      } else {
        await studyMaterialService.reject(item.id, draft);
        toast.success('Rejected successfully');
      }

      fetchStats();
      fetchPending();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Review action failed');
    }
  };

  const handlePreview = async (item) => {
    try {
      const response = await studyMaterialService.preview(item.id);
      const blobUrl = URL.createObjectURL(new Blob([response.data]));
      setPreview({ open: true, item, blobUrl });
    } catch {
      toast.error('Preview failed');
    }
  };

  const groupedKeys = useMemo(() => Object.keys(completedGrouped), [completedGrouped]);

  if (!isManagerRole(user.role)) {
    return <EmptyState title="Access restricted" description="Only admins, managers, and coordinators can access this review panel." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-soft flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Manage Study Materials</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={APP_ROUTES.CREATE_KUPPI_SESSION} className="btn-secondary">Create Kuppi Session</Link>
          <Link to={APP_ROUTES.MANAGE_KUPPI_SESSIONS} className="btn-secondary">Manage Kuppi Sessions</Link>
          <div className="flex rounded-full border border-slate-200 p-1">
            <button type="button" className={`rounded-full px-3 py-1 text-sm ${mode === 'completed' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`} onClick={() => setMode('completed')}>Completed</button>
            <button type="button" className={`rounded-full px-3 py-1 text-sm ${mode === 'pending' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500'}`} onClick={() => setMode('pending')}>Pending Review</button>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending Review" value={stats.pendingReview} icon="⏳" />
        <StatCard label="Approved" value={stats.approved} icon="✅" />
        <StatCard label="Rejected" value={stats.rejected} icon="❌" />
        <StatCard label="Total Study Materials" value={stats.totalStudyMaterials} icon="📚" />
      </section>

      {loading && <LoadingSpinner label="Loading management data" />}

      {!loading && mode === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 ? (
            <EmptyState title="No pending submissions" description="Everything is reviewed right now." />
          ) : pending.map((item) => (
            <div key={item.id} className="card-soft">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="rounded-full bg-slate-100 px-2 py-1">{getInitials(item.ownerName)} {item.ownerName}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">Year {item.year}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">Semester {item.semester}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{item.module}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{formatFileSize(item.file?.size)}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              </div>

              <ReviewPanel
                item={item}
                draft={drafts[item.id] || { category: item.category, reviewNotes: '' }}
                onChange={(draft) => setDrafts((current) => ({ ...current, [item.id]: draft }))}
                onApprove={() => handleReviewAction(item, 'approve')}
                onReject={() => handleReviewAction(item, 'reject')}
                onPreview={() => handlePreview(item)}
              />
            </div>
          ))}

          <PaginationControls
            pagination={pagination}
            onPrevious={() => setPage((current) => current - 1)}
            onNext={() => setPage((current) => current + 1)}
          />
        </div>
      )}

      {!loading && mode === 'completed' && (
        <div className="space-y-4">
          <div className="card-soft flex gap-2">
            <input className="input-base" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or module" />
            <button type="button" className="btn-primary" onClick={fetchCompleted}>Search</button>
          </div>

          {groupedKeys.length === 0 ? (
            <EmptyState title="No completed or rejected materials" description="Reviewed resources will appear here." />
          ) : (
            groupedKeys.map((group) => (
              <AccordionSection key={group} title={group} subtitle={`${completedGrouped[group].length} items`}>
                <div className="space-y-2">
                  {completedGrouped[group].map((item) => (
                    <div key={item.id} className="rounded-xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="font-semibold text-slate-800">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.module} • {item.status}</p>
                        </div>
                        <div className="flex gap-2">
                          <button type="button" className="btn-secondary" onClick={() => handlePreview(item)}>Preview</button>
                          <button type="button" className="btn-danger" onClick={async () => {
                            await studyMaterialService.deleteManaged(item.id);
                            toast.success('Deleted successfully');
                            fetchCompleted();
                            fetchStats();
                          }}>Delete</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionSection>
            ))
          )}
        </div>
      )}

      <Modal isOpen={preview.open} fullScreen title={preview.item?.title || 'Preview'} onClose={() => setPreview({ open: false, item: null, blobUrl: '' })}>
        {!preview.item ? null : preview.item.file?.mimetype?.startsWith('image/') ? (
          <img src={preview.blobUrl} alt={preview.item.title} className="mx-auto max-h-[80vh] rounded-xl object-contain" />
        ) : preview.item.file?.mimetype?.includes('pdf') ? (
          <iframe title="pdf-preview" src={preview.blobUrl} className="h-[80vh] w-full rounded-xl border border-slate-200" />
        ) : (
          <div className="card-soft text-center">
            <p className="text-sm text-slate-600">Preview not supported for this type.</p>
            <a className="btn-primary mt-3 inline-flex" href={preview.blobUrl} download={preview.item.file?.originalName}>Download to View</a>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ManageStudyMaterialsPage;
