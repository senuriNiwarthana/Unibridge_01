import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studyMaterialService } from '../services/studyMaterialService';
import { useAuth } from '../contexts/AuthContext';
import { canEditMaterial } from '../utils/permissions';
import { APP_ROUTES } from '../constants/routes';
import SearchToolbar from '../components/SearchToolbar';
import ResourceCard from '../components/ResourceCard';
import PaginationControls from '../components/PaginationControls';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonCard from '../components/SkeletonCard';

const categories = [
  { label: 'All', value: 'all' },
  { label: 'Lecture', value: 'lecture' },
  { label: 'Assignment', value: 'assignment' },
  { label: 'Tutorial', value: 'tutorial' },
  { label: 'Reference', value: 'reference' },
  { label: 'Other', value: 'other' }
];

const StudyMaterialListPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [materials, setMaterials] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [filters, setFilters] = useState({ search: '', category: 'all', page: 1 });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await studyMaterialService.getApproved({
        page: filters.page,
        limit: 10,
        category: filters.category === 'all' ? '' : filters.category,
        search: filters.search
      });
      setMaterials(response.data.materials || []);
      setPagination(response.data.pagination || pagination);
    } catch {
      toast.error('Failed to fetch study materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [filters.page, filters.category]);

  const handleDownload = async (item) => {
    if (!item.file && item.externalLink) {
      window.open(item.externalLink, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const response = await studyMaterialService.download(item.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.setAttribute('download', item.file?.originalName || item.title || 'study-material');
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    } catch {
      toast.error('Download failed');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await studyMaterialService.deleteOwned(confirmDelete.id);
      toast.success('Study material deleted');
      setConfirmDelete(null);
      fetchMaterials();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <LoadingSpinner label="Loading study materials" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card-soft flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Learning Study Materials</h1>
        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">{materials.length} resources</span>
      </div>

      <SearchToolbar
        search={filters.search}
        category={filters.category}
        categories={categories}
        onSearchChange={(value) => setFilters({ ...filters, search: value, page: 1 })}
        onCategoryChange={(value) => setFilters({ ...filters, category: value, page: 1 })}
        onSubmit={fetchMaterials}
      />

      {materials.length === 0 ? (
        <EmptyState
          title="No study materials found"
          description="Try a different filter or upload the first resource."
          actionLabel="Upload the first study material"
          onAction={() => navigate(APP_ROUTES.UPLOAD_STUDY_MATERIAL)}
        />
      ) : (
        <div className="space-y-3">
          {materials.map((item) => (
            <ResourceCard
              key={item.id}
              item={item}
              onDownload={handleDownload}
              onEdit={() => toast.info('Edit flow available in Manage Study Materials')}
              onDelete={(target) => setConfirmDelete(target)}
              canEdit={canEditMaterial(user.role, user.id, item.ownerId)}
            />
          ))}
        </div>
      )}

      <PaginationControls
        pagination={pagination}
        onPrevious={() => setFilters({ ...filters, page: filters.page - 1 })}
        onNext={() => setFilters({ ...filters, page: filters.page + 1 })}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmDelete)}
        title="Delete Study Material"
        message="Are you sure you want to delete this resource?"
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default StudyMaterialListPage;
