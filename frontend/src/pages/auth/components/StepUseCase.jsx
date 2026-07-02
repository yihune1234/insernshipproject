import { useForm } from 'react-hook-form';
import Textarea from '@components/common/Textarea';
import Button from '@components/common/Button';

export default function StepUseCase({ onSubmit, loading, tags, tagInput, onTagInputChange, onTagKeyDown, onRemoveTag }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Use Case Description</h2>
        <p className="text-sm text-muted-foreground">Explain how you plan to use the credential issuance system.</p>
      </div>
      <Textarea
        label="How will you use this platform?"
        {...register('use_case_description', { required: 'Please describe your use case' })}
        error={errors.use_case_description?.message}
        placeholder="e.g. We will issue digital academic certificates to graduating students..."
        rows={4}
      />
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Intended Credential Types</label>
        <div className="flex flex-wrap gap-1.5 min-h-[2.5rem] p-2 border border-input rounded-md bg-background focus-within:ring-2 focus-within:ring-ring">
          {tags.map((tag, i) => (
            <span key={i} className="flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {tag}
              <button type="button" onClick={() => onRemoveTag(i)}
                className="hover:text-destructive leading-none">×</button>
            </span>
          ))}
          <input
            className="flex-1 min-w-[140px] bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Type and press Enter or comma to add…"
            value={tagInput}
            onChange={onTagInputChange}
            onKeyDown={onTagKeyDown}
          />
        </div>
      </div>
      <Button type="submit" isLoading={loading} className="w-full">Continue</Button>
    </form>
  );
}
