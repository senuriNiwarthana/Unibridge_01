const Modal = ({ isOpen, title, onClose, children, fullScreen = false }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-fade fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className={`${fullScreen ? 'h-[95vh] w-full max-w-6xl' : 'w-full max-w-2xl'} modal-pop rounded-2xl bg-white p-5 shadow-2xl`}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
