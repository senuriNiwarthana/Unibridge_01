import FileTypeBadge from './FileTypeBadge';
import { detectFileType, formatDate, formatFileSize, getInitials } from '../utils/formatters';

const ResourceCard = ({ item, onDownload, onEdit, onDelete, canEdit = false }) => {
  return (
    <div className="card-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileTypeBadge type={item.file?.typeLabel || detectFileType(item.file?.originalName)} />
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-700">{item.category}</span>
          </div>
          <p className="line-clamp-2 text-sm text-slate-600">{item.description}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">👤 {item.ownerName || getInitials(item.ownerName)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">⬇ {item.downloads || 0}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{formatFileSize(item.file?.size || 0)}</span>
            <span className="rounded-full bg-slate-100 px-2 py-1">{formatDate(item.createdAt)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {(item.tags || []).map((tag) => (
              <span key={tag} className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-600">#{tag}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => onDownload(item)} className="btn-primary">Download</button>
          {canEdit && <button type="button" onClick={() => onEdit(item)} className="btn-secondary">Edit</button>}
          {canEdit && <button type="button" onClick={() => onDelete(item)} className="btn-danger">Delete</button>}
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
