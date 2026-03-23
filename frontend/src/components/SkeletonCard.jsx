const SkeletonCard = () => {
  return (
    <div className="card-soft animate-pulse">
      <div className="h-4 w-24 rounded bg-slate-200" />
      <div className="mt-3 h-5 w-2/3 rounded bg-slate-200" />
      <div className="mt-2 h-4 w-full rounded bg-slate-200" />
      <div className="mt-2 h-4 w-5/6 rounded bg-slate-200" />
    </div>
  );
};

export default SkeletonCard;
