const StatCard = ({ label, value, icon = '📈' }) => {
  return (
    <div className="card-soft fade-up">
      <div className="mb-2 text-xl">{icon}</div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-sm text-slate-600">{label}</p>
    </div>
  );
};

export default StatCard;
