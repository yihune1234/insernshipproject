import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowLeft, Building2, FileText, Users, Send } from 'lucide-react';
import {
  registrationStep1, registrationVerifyOTP,
  registrationStep2, registrationStep3,
  registrationStep4, registrationStep5,
} from '@/api/issuer';
import toast from 'react-hot-toast';
import StepAccount from './components/StepAccount';
import StepVerifyOtp from './components/StepVerifyOtp';
import StepOrganization from './components/StepOrganization';
import StepDocuments from './components/StepDocuments';
import StepUseCase from './components/StepUseCase';
import StepSubmit from './components/StepSubmit';
import Button from '@components/common/Button';

const STEPS = [
  { label: 'Account', icon: Users },
  { label: 'Verify Email', icon: CheckCircle2 },
  { label: 'Organization', icon: Building2 },
  { label: 'Documents', icon: FileText },
  { label: 'Use Case', icon: Building2 },
  { label: 'Submit', icon: Send },
];

export default function OrgRegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [registrationId, setRegistrationId] = useState(null);
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [files, setFiles] = useState([]);
  const [docTypes, setDocTypes] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [credentialTags, setCredentialTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [orgName, setOrgName] = useState('');
  const [contactName, setContactName] = useState('');

  const next = () => setStep((s) => s + 1);

  const handleStep0 = async (data) => {
    setLoading(true);
    try {
      const res = await registrationStep1({ email: data.email, password: data.password });
      setRegistrationId(res.data.registration_id);
      setEmail(data.email);
      toast.success('Verification code sent to your email');
      next();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.detail || 'Failed to start registration');
    } finally { setLoading(false); }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) { toast.error('Please enter the 6-digit code'); return; }
    setLoading(true);
    try {
      await registrationVerifyOTP({ registration_id: registrationId, otp });
      toast.success('Email verified successfully');
      next();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired verification code');
    } finally { setLoading(false); }
  };

  const handleStep2 = async (data) => {
    setLoading(true);
    try {
      await registrationStep2({
        registration_id: registrationId,
        organization_name: data.organization_name,
        address: data.address,
        phone: data.phone,
        website: data.website,
        contact_person_name: data.contact_person_name,
        contact_person_email: data.contact_person_email,
      });
      setOrgName(data.organization_name);
      setContactName(data.contact_person_name);
      toast.success('Organization details saved');
      next();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save organization details');
    } finally { setLoading(false); }
  };

  const handleStep3 = async () => {
    if (!files.length) { toast.error('Please upload at least one document'); return; }
    setLoading(true);
    const fd = new FormData();
    fd.append('registration_id', registrationId);
    files.forEach((f, i) => {
      fd.append('files', f);
      fd.append('document_types', docTypes[i] || 'other');
    });
    try {
      await registrationStep3(fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Documents uploaded');
      next();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload documents');
    } finally { setLoading(false); }
  };

  const handleStep4 = async (data) => {
    setLoading(true);
    try {
      await registrationStep4({
        registration_id: registrationId,
        use_case_description: data.use_case_description,
        intended_credential_types: credentialTags,
      });
      toast.success('Use case saved');
      next();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save use case');
    } finally { setLoading(false); }
  };

  const handleStep5 = async (data) => {
    if (!data.consent) { toast.error('Please agree to the terms and conditions'); return; }
    setLoading(true);
    try {
      await registrationStep5({ registration_id: registrationId, consent: true });
      setSubmitted(true);
      toast.success('Application submitted successfully!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="card p-8 max-w-md text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Application Submitted!</h1>
          <p className="text-muted-foreground">
            Your issuer registration has been submitted. Our team will review it within 3-5 business days
            and notify you by email once approved.
          </p>
          {registrationId && (
            <p className="text-xs text-muted-foreground">
              Reference ID: <span className="font-mono">{registrationId}</span>
            </p>
          )}
          <Link to="/login">
            <Button className="w-full mt-2">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800 px-4 py-3 text-sm text-blue-800 dark:text-blue-200">
        To register as an issuer, your organization needs to have an internal database or information system containing your member, student, employee, or graduate records. During setup, you will connect this system to the platform using a simple API. The platform will use this connection to verify member eligibility every time a credential is issued. You remain the owner of your data at all times.
      </div>

      <div className="border-b border-border p-4 flex items-center gap-4">
        <Link to="/login" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-bold text-foreground">Issuer Registration</h1>
          <p className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</p>
        </div>
      </div>

      <div className="border-b border-border overflow-x-auto">
        <div className="flex min-w-max px-4 py-3 gap-0">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                i === step ? 'bg-primary text-primary-foreground' :
                i < step ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' :
                'text-muted-foreground'
              }`}>
                {i < step ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                {s.label}
              </div>
              {i < STEPS.length - 1 && <div className="w-4 h-px bg-border mx-1" />}
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-lg space-y-6">
          {step === 0 && <StepAccount onSubmit={handleStep0} loading={loading} />}
          {step === 1 && (
            <StepVerifyOtp
              email={email}
              otp={otp}
              onOtpChange={setOtp}
              onSubmit={handleOtpVerify}
              loading={loading}
              onBack={() => { setStep(0); setOtp(''); }}
            />
          )}
          {step === 2 && <StepOrganization onSubmit={handleStep2} loading={loading} />}
          {step === 3 && (
            <StepDocuments
              files={files}
              docTypes={docTypes}
              onDrop={(accepted) => {
                setFiles((prev) => [...prev, ...accepted]);
                setDocTypes((prev) => [...prev, ...accepted.map(() => 'business_license')]);
              }}
              onRemoveType={(i) => {
                setFiles((prev) => prev.filter((_, idx) => idx !== i));
                setDocTypes((prev) => prev.filter((_, idx) => idx !== i));
              }}
              onDocTypeChange={(i, val) => {
                const updated = [...docTypes];
                updated[i] = val;
                setDocTypes(updated);
              }}
              onSubmit={handleStep3}
              loading={loading}
            />
          )}
          {step === 4 && (
            <StepUseCase
              onSubmit={handleStep4}
              loading={loading}
              tags={credentialTags}
              tagInput={tagInput}
              onTagInputChange={(e) => {
                const val = e.target.value;
                if (val.endsWith(',')) {
                  const tag = val.slice(0, -1).trim();
                  if (tag) setCredentialTags(t => [...t, tag]);
                  setTagInput('');
                } else {
                  setTagInput(val);
                }
              }}
              onTagKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const tag = tagInput.trim();
                  if (tag) setCredentialTags(t => [...t, tag]);
                  setTagInput('');
                }
              }}
              onRemoveTag={(i) => setCredentialTags(t => t.filter((_, idx) => idx !== i))}
            />
          )}
          {step === 5 && (
            <StepSubmit
              onSubmit={handleStep5}
              loading={loading}
              email={email}
              getOrgName={() => orgName}
              getContactName={() => contactName}
              files={files}
            />
          )}
        </div>
      </div>
    </div>
  );
}
