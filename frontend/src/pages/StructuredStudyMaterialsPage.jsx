import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { moduleService } from '../services/moduleService';
import { studyMaterialService } from '../services/studyMaterialService';
import AccordionSection from '../components/AccordionSection';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import FileTypeBadge from '../components/FileTypeBadge';
import { formatDate, formatFileSize } from '../utils/formatters';

const years = [1, 2, 3, 4];

const StructuredStudyMaterialsPage = () => {
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);
  const [materialsByModule, setMaterialsByModule] = useState({});

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setLoading(true);
        const response = await moduleService.getAll({ page: 1 });
        setModules(response.data.modules || []);
      } catch {
        toast.error('Failed to load modules');
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
  }, []);

  const handleModuleOpen = async (moduleName, year, semester) => {
    if (materialsByModule[moduleName]) return;
    try {
      const response = await studyMaterialService.getByModule(moduleName, { year, semester });
      setMaterialsByModule((current) => ({ ...current, [moduleName]: response.data.materials || [] }));
    } catch {
      toast.error('Failed to load module materials');
    }
  };

  if (loading) return <LoadingSpinner label="Loading structured study materials" />;

  return (
    <div className="space-y-4">
      <div className="card-soft">
        <h1 className="text-2xl font-semibold text-slate-900">Structured Study Materials</h1>
        <p className="mt-1 text-sm text-slate-600">Browse by year, semester, and module.</p>
      </div>

      {years.map((year) => {
        const yearModules = modules.filter((item) => item.year === year);
        return (
          <AccordionSection key={year} title={`${year} Year`} subtitle={`${yearModules.length} modules`}>
            {yearModules.length === 0 ? (
              <EmptyState title="No modules" description="No modules configured for this year." />
            ) : (
              <div className="space-y-3">
                {[1, 2].map((semester) => {
                  const semesterModules = yearModules.filter((item) => item.semester === semester);
                  return (
                    <AccordionSection key={`${year}-${semester}`} title={`${semester} Semester`} subtitle={`${semesterModules.length} modules`}>
                      <div className="flex flex-wrap gap-2">
                        {semesterModules.map((module) => (
                          <button
                            key={module.id}
                            type="button"
                            className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm text-cyan-700"
                            onClick={() => handleModuleOpen(module.name, year, semester)}
                          >
                            {module.name}
                          </button>
                        ))}
                      </div>
                      {semesterModules.map((module) => {
                        const items = materialsByModule[module.name] || [];
                        return (
                          <div key={`${module.name}-materials`} className="mt-3 space-y-2">
                            <h4 className="text-sm font-semibold text-slate-800">{module.name}</h4>
                            {items.length === 0 ? (
                              <p className="text-xs text-slate-500">No materials for this module.</p>
                            ) : (
                              items.map((item) => (
                                <div key={item.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                                  <div className="flex items-center gap-3">
                                    <FileTypeBadge type={item.file?.typeLabel || 'FILE'} />
                                    <div>
                                      <p className="text-sm font-semibold text-slate-800">{item.title}</p>
                                      <p className="text-xs text-slate-500">{formatFileSize(item.file?.size)} • {formatDate(item.createdAt)}</p>
                                    </div>
                                  </div>
                                  <a className="btn-primary" href={`${import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/study-materials/${item.id}/download`}>
                                    Download
                                  </a>
                                </div>
                              ))
                            )}
                          </div>
                        );
                      })}
                    </AccordionSection>
                  );
                })}
              </div>
            )}
          </AccordionSection>
        );
      })}
    </div>
  );
};

export default StructuredStudyMaterialsPage;
