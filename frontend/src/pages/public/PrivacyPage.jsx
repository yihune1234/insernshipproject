export default function PrivacyPage() {
  return (
    <div className="py-16 px-4">
      <div className="mx-auto max-w-3xl prose dark:prose-invert">
        <h1 className="text-4xl font-bold text-foreground mb-8">Privacy Policy</h1>
        {[
          { title: 'Data We Collect', body: 'We collect information you provide when registering, including name, email, and national ID for identity verification. Credential data is encrypted and stored securely.' },
          { title: 'How We Use Your Data', body: 'Your data is used solely to operate the credential wallet service — issuing, storing, and verifying credentials. We do not sell your data to third parties.' },
          { title: 'Data Security', body: 'All credentials are cryptographically signed. Access tokens expire and are rotated. Data is encrypted at rest and in transit using industry-standard protocols.' },
          { title: 'Your Rights', body: 'You may request deletion of your account and associated data at any time. Contact support@credwallet.io for data requests.' },
          { title: 'Cookies', body: 'We use only essential cookies for authentication session management. No tracking cookies are used.' },
          { title: 'Updates', body: 'This policy may be updated. Material changes will be communicated via email or in-app notification.' },
        ].map((s) => (
          <div key={s.title} className="mb-8">
            <h2 className="text-xl font-semibold text-foreground mb-2">{s.title}</h2>
            <p className="text-muted-foreground">{s.body}</p>
          </div>
        ))}
        <p className="text-xs text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
