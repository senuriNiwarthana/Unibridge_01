import { useState } from 'react';

const AccordionSection = ({ title, subtitle, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between p-4 text-left"
        onClick={() => setOpen((current) => !current)}
      >
        <div>
          <p className="font-semibold text-slate-900">{title}</p>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <span className="text-sm text-slate-500">{open ? '−' : '+'}</span>
      </button>
      <div className={`${open ? 'accordion-open max-h-[1200px] p-4 pt-0' : 'max-h-0 overflow-hidden p-0'} transition-all`}>
        {open && children}
      </div>
    </div>
  );
};

export default AccordionSection;
