import Button from '@components/common/Button';
import FileUpload from '@components/common/FileUpload';

export default function StepDocuments({ files, docTypes, onDrop, onRemoveType, onDocTypeChange, onSubmit, loading }) {
  return (
    <div className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Upload Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload supporting documents (business license, accreditation certificate, etc.)
        </p>
      </div>
      <FileUpload
        accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
        multiple
        files={files}
        onDrop={onDrop}
        onRemove={onRemoveType}
        label="Organization Documents"
      />
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Document types:</p>
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-foreground flex-1 truncate">{f.name}</span>
              <select
                className="input text-xs py-1 w-44"
                value={docTypes[i] || 'other'}
                onChange={(e) => onDocTypeChange(i, e.target.value)}
              >
                <option value="business_license">Business License</option>
                <option value="tax_clearance">Tax Clearance</option>
                <option value="accreditation_certificate">Accreditation Certificate</option>
                <option value="authorization_letter">Authorization Letter</option>
                <option value="other">Other</option>
              </select>
            </div>
          ))}
        </div>
      )}
      <Button onClick={onSubmit} isLoading={loading} className="w-full" disabled={!files.length}>
        Upload & Continue
      </Button>
    </div>
  );
}
