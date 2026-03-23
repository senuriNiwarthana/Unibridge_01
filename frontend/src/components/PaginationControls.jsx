const PaginationControls = ({ pagination, onPrevious, onNext }) => {
  if (!pagination || pagination.totalPages <= 1) return null;

  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button type="button" className="btn-secondary" disabled={!pagination.hasPrev} onClick={onPrevious}>Previous</button>
      <span className="text-sm text-slate-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
      <button type="button" className="btn-secondary" disabled={!pagination.hasNext} onClick={onNext}>Next</button>
    </div>
  );
};

export default PaginationControls;
