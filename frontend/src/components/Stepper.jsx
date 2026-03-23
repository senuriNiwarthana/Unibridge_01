const Stepper = ({ steps, current }) => {
  return (
    <div className="space-y-2">
      <div className="h-2 rounded-full bg-slate-200">
        <div className={`h-full rounded-full bg-indigo-600 step-${current + 1}`} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {steps.map((step, index) => (
          <div key={step} className={`rounded-lg border px-2 py-2 text-center text-xs ${index <= current ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-500'}`}>
            {step}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Stepper;
