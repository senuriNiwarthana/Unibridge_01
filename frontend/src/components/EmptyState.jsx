const EmptyState = ({ title, description, actionLabel, onAction }) => {
  return (
    <div className="card-soft text-center">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-xl">📚</div>
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      {actionLabel && (
        <button type="button" onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
