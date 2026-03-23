import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { moduleService } from '../services/moduleService';
import { useAuth } from '../contexts/AuthContext';
import FilterBar from '../components/FilterBar';
import PaginationControls from '../components/PaginationControls';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { formatDate, getInitials } from '../utils/formatters';
import { isManagerRole } from '../utils/permissions';

const initialModalState = { isOpen: false, editId: null, name: '', year: '', semester: '' };

const ManageModulesPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, hasPrev: false, hasNext: false });
  const [filters, setFilters] = useState({ page: 1, year: '', semester: '' });
  const [modal, setModal] = useState(initialModalState);

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await moduleService.getAll(filters);
      setModules(response.data.modules || []);
      setPagination(response.data.pagination || pagination);
    } catch {
      toast.error('Failed to fetch modules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, [filters.page, filters.year, filters.semester]);

  const openCreate = () => setModal({ ...initialModalState, isOpen: true });
  const openEdit = (item) => setModal({ isOpen: true, editId: item.id, name: item.name, year: String(item.year), semester: String(item.semester) });

  const saveModule = async () => {
    if (!modal.name || !modal.year || !modal.semester) {
      toast.error('All fields are required');
      return;
    }

    const payload = { name: modal.name, year: Number(modal.year), semester: Number(modal.semester) };

    try {
      if (modal.editId) {
        await moduleService.update(modal.editId, payload);
        toast.success('Module updated');
      } else {
        await moduleService.create(payload);
        toast.success('Module created');
      }
      setModal(initialModalState);
      fetchModules();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save module');
    }
  };

  const deleteModule = async (id) => {
    try {
      await moduleService.remove(id);
      toast.success('Module deleted');
      fetchModules();
    } catch {
      toast.error('Delete failed');
    }
  };

  if (loading) return <LoadingSpinner label="Loading modules" />;

  if (!isManagerRole(user.role)) {
    return <EmptyState title="Access restricted" description="Only admins, managers, and coordinators can manage modules." />;
  }

  return (
    <div className="space-y-5">
      <div className="card-soft flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold text-slate-900">Manage Modules</h1>
        <button type="button" className="btn-primary" onClick={openCreate}>Create Module</button>
      </div>

      <FilterBar
        year={filters.year}
        semester={filters.semester}
        onYearChange={(year) => setFilters({ ...filters, year, page: 1 })}
        onSemesterChange={(semester) => setFilters({ ...filters, semester, page: 1 })}
        onClear={() => setFilters({ page: 1, year: '', semester: '' })}
      />

      <div className="card-soft space-y-3">
        {modules.map((item) => (
          <div key={item.id} className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white">📘</div>
              <div>
                <h3 className="font-semibold text-slate-900">{item.name}</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="rounded-full bg-indigo-100 px-2 py-1 text-indigo-700">Year {item.year}</span>
                  <span className="rounded-full bg-cyan-100 px-2 py-1 text-cyan-700">Semester {item.semester}</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{item.createdBy?.firstName} {item.createdBy?.lastName} ({getInitials(`${item.createdBy?.firstName} ${item.createdBy?.lastName}`)})</span>
                  <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.createdAt)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => openEdit(item)}>Edit</button>
              <button type="button" className="btn-danger" onClick={() => deleteModule(item.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      <PaginationControls
        pagination={pagination}
        onPrevious={() => setFilters({ ...filters, page: filters.page - 1 })}
        onNext={() => setFilters({ ...filters, page: filters.page + 1 })}
      />

      <Modal isOpen={modal.isOpen} title={modal.editId ? 'Edit Module' : 'Create Module'} onClose={() => setModal(initialModalState)}>
        <div className="space-y-3">
          <input className="input-base" placeholder="Module Name" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
          <select className="input-base" value={modal.year} onChange={(e) => setModal({ ...modal, year: e.target.value })}>
            <option value="">Select Year</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
          </select>
          <select className="input-base" value={modal.semester} onChange={(e) => setModal({ ...modal, semester: e.target.value })}>
            <option value="">Select Semester</option>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModal(initialModalState)}>Cancel</button>
            <button type="button" className="btn-primary" onClick={saveModule}>Save</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ManageModulesPage;
