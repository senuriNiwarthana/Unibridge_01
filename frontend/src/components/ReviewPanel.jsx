import CategoryPill from './CategoryPill';
import { MATERIAL_CATEGORIES } from '../constants/categories';

const ReviewPanel = ({ item, draft, onChange, onApprove, onReject, onPreview }) => {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap gap-2">
        {MATERIAL_CATEGORIES.map((category) => (
          <CategoryPill key={category} value={category} selected={draft.category === category} onClick={(value) => onChange({ ...draft, category: value })} />
        ))}
      </div>
      <textarea
        className="input-base mt-3"
        rows={3}
        placeholder="Review notes"
        value={draft.reviewNotes}
        onChange={(event) => onChange({ ...draft, reviewNotes: event.target.value })}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={onPreview}>{item.file ? 'Preview' : 'Open Link'}</button>
        <button type="button" className="btn-primary" onClick={onApprove}>Approve</button>
        <button type="button" className="btn-danger" onClick={onReject}>Reject</button>
      </div>
    </div>
  );
};

export default ReviewPanel;
