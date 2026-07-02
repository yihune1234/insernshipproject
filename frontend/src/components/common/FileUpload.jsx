import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, File } from 'lucide-react';
import { formatFileSize } from '../../utils/fileUtils';

export default function FileUpload({ onDrop, accept, multiple = false, files = [], onRemove, label }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple,
  });

  return (
    <div>
      {label && <p className="mb-1.5 text-sm font-medium text-foreground">{label}</p>}
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
          isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <input {...getInputProps()} />
        <UploadCloud className="mb-2 h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {isDragActive ? 'Drop files here' : 'Drag & drop or click to upload'}
        </p>
      </div>
      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <File className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="flex-1 truncate text-foreground">{f.name}</span>
              <span className="text-xs text-muted-foreground">{formatFileSize(f.size)}</span>
              {onRemove && (
                <button onClick={() => onRemove(i)} className="rounded p-0.5 hover:bg-accent">
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
