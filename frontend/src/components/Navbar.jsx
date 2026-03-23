import { Link, NavLink } from 'react-router-dom';
import { APP_ROUTES } from '../constants/routes';
import { ROLES } from '../constants/roles';

const baseLinks = [
  { to: APP_ROUTES.DASHBOARD, label: 'Dashboard' },
  { to: APP_ROUTES.STUDY_MATERIALS, label: 'Study Materials' },
  { to: APP_ROUTES.STRUCTURED_STUDY_MATERIALS, label: 'Structured View' }
];

const Navbar = ({ user, onLogout, onSwitchRole }) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 md:px-6 lg:px-8">
        <Link to={APP_ROUTES.DASHBOARD} className="text-xl font-semibold text-indigo-700">Unibridge</Link>
        <nav className="hidden items-center gap-2 md:flex">
          {baseLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <select 
            value={user?.role || ROLES.STUDENT} 
            onChange={(e) => onSwitchRole(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:border-slate-300"
          >
            <option value={ROLES.STUDENT}>Student</option>
            <option value={ROLES.STUDY_MATERIALS_MANAGER}>Manager</option>
            <option value={ROLES.COORDINATOR}>Coordinator</option>
            <option value={ROLES.ADMIN}>Admin</option>
          </select>
          <div className="h-9 w-9 rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700 grid place-items-center">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <button type="button" className="btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
