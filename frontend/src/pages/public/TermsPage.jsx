export default function TermsPage() {
  return (
    <div className="py-16 px-4">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-bold text-foreground mb-8">Terms of Service</h1>
        {[
          { title: '1. Acceptance', body: 'By using CredWallet, you agree to these terms. If you do not agree, do not use the platform.' },
          { title: '2. Use of Service', body: 'You may use CredWallet only for lawful purposes. Organizations must be approved before issuing credentials. Misuse will result in account suspension.' },
          { title: '3. Credential Integrity', body: 'Issuers are responsible for the accuracy of credentials they issue. CredWallet provides the technical infrastructure; it does not validate the underlying claims.' },
          { title: '4. Account Security', body: 'You are responsible for maintaining the security of your account credentials. Notify us immediately of any unauthorized access.' },
          { title: '5. Liability', body: 'CredWallet is provided as-is. We are not liable for damages arising from the use or inability to use the service.' },
          { title: '6. Changes', body: 'We reserve the right to modify these terms. Continued use after changes constitutes acceptance.' },
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
