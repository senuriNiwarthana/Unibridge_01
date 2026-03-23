import { useRef } from 'react';
import FileTypeBadge from './FileTypeBadge';
import { detectFileType, formatFileSize } from '../utils/formatters';

const FileDropzone = ({ file, onSelect, onRemove, accept, label = 'Drag and drop your file here' }) => {
  const inputRef = useRef(null);

  const handleChoose = () => inputRef.current?.click();

  return (
    <div className="space-y-3">
      <div
        className="accordion-open cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center"
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const dropped = event.dataTransfer.files?.[0];
          if (dropped) onSelect(dropped);
        }}
      >
        <p className="text-sm text-slate-600">{label}</p>
        <button type="button" className="btn-secondary mt-3" onClick={handleChoose}>Choose File</button>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={(event) => {
            const selected = event.target.files?.[0];
            if (selected) onSelect(selected);
          }}
        />
      </div>
      {file && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex items-center gap-3">
            <FileTypeBadge type={detectFileType(file.name)} />
            <div>
              <p className="text-sm font-semibold text-slate-800">{file.name}</p>
              <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
            </div>
          </div>
          <button type="button" className="btn-danger" onClick={onRemove}>Remove</button>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
