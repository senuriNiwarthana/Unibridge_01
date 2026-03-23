import { cn } from '../utils/cn';

const palette = {
  PDF: 'bg-red-100 text-red-700 border-red-200',
  DOC: 'bg-blue-100 text-blue-700 border-blue-200',
  PPT: 'bg-amber-100 text-amber-700 border-amber-200',
  XLS: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  VID: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
  ZIP: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  FILE: 'bg-slate-100 text-slate-700 border-slate-200'
};

const FileTypeBadge = ({ type = 'FILE' }) => (
  <span className={cn('rounded-lg border px-2 py-1 text-xs font-semibold', palette[type] || palette.FILE)}>
    {type}
  </span>
);

export default FileTypeBadge;
