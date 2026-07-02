import { useForm } from 'react-hook-form';
import Button from '@components/common/Button';
import { Send } from 'lucide-react';

export default function StepSubmit({ onSubmit, loading, email, getOrgName, getContactName, files }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review & Submit</h2>
        <p className="text-sm text-muted-foreground">Review before submission — this cannot be undone.</p>
      </div>
      <div className="bg-muted/40 rounded p-4 space-y-2 text-sm">
        <p><span className="text-muted-foreground">Email:</span> <strong>{email}</strong></p>
        <p><span className="text-muted-foreground">Organization:</span> <strong>{getOrgName()}</strong></p>
        <p><span className="text-muted-foreground">Contact:</span> <strong>{getContactName()}</strong></p>
        <p><span className="text-muted-foreground">Documents:</span> <strong>{files.length} uploaded</strong></p>
      </div>
      <div className="border border-border rounded p-4 bg-muted/10 text-xs text-muted-foreground space-y-2 max-h-32 overflow-y-auto">
        <p className="font-semibold text-foreground text-sm">Terms & Conditions</p>
        <p>By submitting this application, you confirm that all information provided is accurate and complete.
        Your organization is authorized to issue digital credentials through this platform.
        Misuse or fraudulent information will result in application rejection and possible suspension of access.</p>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" {...register('consent', { required: true })} className="mt-0.5 rounded" />
        <span className="text-sm text-foreground">
          I agree to the platform terms and confirm all information is accurate.
        </span>
      </label>
      {errors.consent && <p className="text-xs text-red-500">You must agree to the terms to proceed.</p>}
      <Button type="submit" isLoading={loading} className="w-full">
        <Send className="h-4 w-4 mr-2" /> Submit Application
      </Button>
    </form>
  );
}
