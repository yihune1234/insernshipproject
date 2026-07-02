import { MockCitizen, MockCredential, MockActivity, MOCK_CITIZENS, MOCK_CREDENTIALS, MOCK_ACTIVITIES, DEMO_OTP } from './mockData';

const mockDelay = (min = 400, max = 900): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, min + Math.random() * (max - min)));

export const mockApi = {
  async verifyNationalId(nationalId: string): Promise<MockCitizen> {
    await mockDelay();
    const citizen = MOCK_CITIZENS[nationalId.toUpperCase()];
    if (!citizen) {
      throw new Error('National ID not found. Try ET123456789 or ET987654321');
    }
    return citizen;
  },

  async verifyOtp(nationalId: string, otp: string): Promise<{ token: string }> {
    await mockDelay(600, 1000);
    if (otp !== DEMO_OTP) {
      throw new Error('Invalid OTP. Use 123456 for demo.');
    }
    return { token: `mock-token-${nationalId}-${Date.now()}` };
  },

  async getCredentials(holderDid: string): Promise<MockCredential[]> {
    await mockDelay(300, 700);
    return MOCK_CREDENTIALS.filter((c) => c.holderDid === holderDid);
  },

  async getCredentialById(id: string): Promise<MockCredential | undefined> {
    await mockDelay(200, 400);
    return MOCK_CREDENTIALS.find((c) => c.id === id);
  },

  async getActivities(): Promise<MockActivity[]> {
    await mockDelay(300, 600);
    return MOCK_ACTIVITIES;
  },

  async shareCredential(credentialId: string, method: string): Promise<{ shareUrl: string; token: string }> {
    await mockDelay(500, 900);
    const cred = MOCK_CREDENTIALS.find((c) => c.id === credentialId);
    return {
      shareUrl: cred?.verificationUrl ?? `https://verify.debo.et/mock/${credentialId}`,
      token: `share-token-${Date.now()}`,
    };
  },

  async verifyCredential(qrData: string): Promise<{
    verified: boolean;
    credential: MockCredential | null;
    checks: { name: string; passed: boolean; detail: string }[];
    duration: number;
  }> {
    await mockDelay(800, 1400);
    const cred = MOCK_CREDENTIALS[0];
    return {
      verified: true,
      credential: cred,
      checks: [
        { name: 'DID Resolved', passed: true, detail: 'Issuer identity confirmed' },
        { name: 'Trust Registry', passed: true, detail: 'Haramaya Univ. — Accredited' },
        { name: 'Digital Signature', passed: true, detail: 'Ed25519 signature valid' },
        { name: 'Integrity Hash', passed: true, detail: 'Content untampered' },
        { name: 'Not Revoked', passed: true, detail: 'Active status confirmed' },
        { name: 'EBCS Confirmed', passed: true, detail: 'Blockchain anchor verified' },
      ],
      duration: 1.2,
    };
  },

  async generateQrToken(credentialId: string): Promise<{ token: string; expiresAt: number }> {
    await mockDelay(200, 400);
    return {
      token: `qr-token-${credentialId}-${Date.now()}`,
      expiresAt: Date.now() + 10 * 60 * 1000,
    };
  },
};
