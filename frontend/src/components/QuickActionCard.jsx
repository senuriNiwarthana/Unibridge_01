import { Link } from 'react-router-dom';

const QuickActionCard = ({ to, title, description, icon = '➡️' }) => {
  return (
    <Link to={to} className="card-soft btn-lift block">
      <div className="mb-2 text-xl">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </Link>
  );
};

export default QuickActionCard;
