import { ROLES } from '../constants/roles';

const roleOptions = [ROLES.STUDENT, ROLES.COORDINATOR, ROLES.STUDY_MATERIALS_MANAGER, ROLES.ADMIN];

const SidebarProfileCard = ({ user, onProfileChange, onRoleChange }) => {
  return (
    <aside className="space-y-4">
      <div className="card-soft overflow-hidden p-0">
        <div className="h-20 bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500" />
        <div className="-mt-8 px-4 pb-4">
          <div className="mb-2 h-16 w-16 rounded-full border-4 border-white bg-indigo-100 text-xl font-semibold text-indigo-700 grid place-items-center">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <p className="text-lg font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
          <span className="mt-1 inline-flex rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold capitalize text-cyan-700">{user.role}</span>
          <div className="mt-3 space-y-2 text-sm text-slate-600">
            <p>Phone: {user.phone || '-'}</p>
            <p>Bio: {user.bio || '-'}</p>
          </div>
        </div>
      </div>

      <div className="card-soft">
        <h3 className="text-sm font-semibold text-slate-900">Edit Profile</h3>
        <div className="mt-3 space-y-2">
          <input className="input-base" placeholder="First Name" value={user.firstName} onChange={(e) => onProfileChange({ firstName: e.target.value })} />
          <input className="input-base" placeholder="Last Name" value={user.lastName} onChange={(e) => onProfileChange({ lastName: e.target.value })} />
          <input className="input-base" placeholder="Phone" value={user.phone || ''} onChange={(e) => onProfileChange({ phone: e.target.value })} />
          <textarea className="input-base" rows={3} placeholder="Bio" value={user.bio || ''} onChange={(e) => onProfileChange({ bio: e.target.value })} />
        </div>
      </div>

      <div className="card-soft">
        <h3 className="text-sm font-semibold text-slate-900">Role Switch (Demo)</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {roleOptions.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => onRoleChange(role)}
              className={`rounded-full border px-3 py-1 text-xs capitalize ${user.role === role ? 'border-indigo-300 bg-indigo-100 text-indigo-700' : 'border-slate-200 bg-white text-slate-600'}`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default SidebarProfileCard;
