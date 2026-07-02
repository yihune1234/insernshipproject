import { useForm } from 'react-hook-form';
import Input from '@components/common/Input';
import Textarea from '@components/common/Textarea';
import Button from '@components/common/Button';

export default function StepOrganization({ onSubmit, loading }) {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Organization Details</h2>
        <p className="text-sm text-muted-foreground">Tell us about your organization.</p>
      </div>
      <Input
        label="Organization Name"
        {...register('organization_name', { required: 'Organization name is required' })}
        error={errors.organization_name?.message}
        placeholder="e.g. University of Technology"
      />
      <Textarea
        label="Address"
        {...register('address', { required: 'Address is required' })}
        error={errors.address?.message}
        placeholder="Full mailing address"
        rows={2}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Phone" {...register('phone')} placeholder="+1-xxx-xxx-xxxx" />
        <Input label="Website" type="url" {...register('website')} placeholder="https://..." />
      </div>
      <Input
        label="Contact Person Name"
        {...register('contact_person_name', { required: 'Contact person name is required' })}
        error={errors.contact_person_name?.message}
        placeholder="Full name"
      />
      <Input
        label="Contact Person Email"
        type="email"
        {...register('contact_person_email')}
        placeholder="Contact email (if different from above)"
      />
      <Button type="submit" isLoading={loading} className="w-full">Continue</Button>
    </form>
  );
}
