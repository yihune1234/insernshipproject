export interface MockCitizen {
  nationalId: string;
  did: string;
  fullName: string;
  firstName: string;
  lastName: string;
  gender: string;
  dob: string;
  phone: string;
  email: string;
  region: string;
  city: string;
  photo: string;
  walletAddress: string;
  createdAt: string;
}

export interface MockIssuer {
  did: string;
  name: string;
  logo?: string;
  sector: 'EDUCATION' | 'GOVERNMENT' | 'HEALTH' | 'PROFESSIONAL' | 'EMPLOYMENT' | 'FINANCE';
}

export interface MockCredential {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  issuer: MockIssuer;
  issuanceDate: string;
  expiryDate: string | null;
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED' | 'SUSPENDED';
  holderDid: string;
  credentialSubject: Record<string, string | number | boolean>;
  proofFormat: string;
  verificationUrl: string;
  ebcsAnchored: boolean;
  ebcsTxId: string;
  color: string;
  icon: string;
}

export interface MockActivity {
  id: string;
  type: 'ISSUED' | 'SHARED' | 'VERIFIED' | 'LOGIN' | 'RECEIVED' | 'REVOKED';
  title: string;
  description: string;
  timestamp: string;
  credentialId?: string;
  credentialTitle?: string;
  method?: string;
}

export const MOCK_CITIZENS: Record<string, MockCitizen> = {
  'ET123456789': {
    nationalId: 'ET123456789',
    did: 'did:et:citizen:ET123456789',
    fullName: 'Abebe Kebede',
    firstName: 'Abebe',
    lastName: 'Kebede',
    gender: 'Male',
    dob: '1999-04-12',
    phone: '0912345678',
    email: 'abebe.kebede@example.com',
    region: 'Oromia',
    city: 'Adama',
    photo: 'https://i.pravatar.cc/300?u=ET123456789',
    walletAddress: 'debo:ET123456789:wallet:001',
    createdAt: '2024-01-15T08:00:00Z',
  },
  'ET987654321': {
    nationalId: 'ET987654321',
    did: 'did:et:citizen:ET987654321',
    fullName: 'Tigist Bekele',
    firstName: 'Tigist',
    lastName: 'Bekele',
    gender: 'Female',
    dob: '2000-08-25',
    phone: '0945678901',
    email: 'tigist.bekele@example.com',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    photo: 'https://i.pravatar.cc/300?u=ET987654321',
    walletAddress: 'debo:ET987654321:wallet:002',
    createdAt: '2024-03-01T10:00:00Z',
  },
};

export const MOCK_CREDENTIALS: MockCredential[] = [
  {
    id: 'crd-uuid-001',
    type: 'AcademicDegreeCredential',
    title: 'Bachelor of Science',
    subtitle: 'Computer Science',
    issuer: {
      did: 'did:et:org:haramaya-university',
      name: 'Haramaya University',
      sector: 'EDUCATION',
    },
    issuanceDate: '2024-07-15T00:00:00Z',
    expiryDate: null,
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      degreeType: 'Bachelor of Science',
      degreeField: 'Computer Science',
      graduationYear: '2024',
      cgpa: '3.75',
      studentId: 'HU/1234/20',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-001',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-001',
    color: '#1B6B3A',
    icon: 'school',
  },
  {
    id: 'crd-uuid-002',
    type: 'AcademicTranscriptCredential',
    title: 'Official Academic Transcript',
    subtitle: 'Haramaya University — 2020–2024',
    issuer: {
      did: 'did:et:org:haramaya-university',
      name: 'Haramaya University',
      sector: 'EDUCATION',
    },
    issuanceDate: '2024-07-16T00:00:00Z',
    expiryDate: null,
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      studentId: 'HU/1234/20',
      program: 'Computer Science',
      years: '2020–2024',
      cgpa: '3.75',
      totalCredits: 180,
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-002',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-002',
    color: '#1A6FAA',
    icon: 'document-text',
  },
  {
    id: 'crd-uuid-003',
    type: 'NationalIdCredential',
    title: 'National Identity Card',
    subtitle: 'Federal Democratic Republic of Ethiopia',
    issuer: {
      did: 'did:et:org:nida',
      name: 'National ID Authority (NIDA)',
      sector: 'GOVERNMENT',
    },
    issuanceDate: '2022-01-10T00:00:00Z',
    expiryDate: '2032-01-09T23:59:59Z',
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      nationalId: 'ET123456789',
      dob: '1999-04-12',
      gender: 'Male',
      region: 'Oromia',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-003',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-003',
    color: '#C8991A',
    icon: 'card',
  },
  {
    id: 'crd-uuid-004',
    type: 'DrivingLicenseCredential',
    title: 'Driving License',
    subtitle: 'Category B — Light Vehicle',
    issuer: {
      did: 'did:et:org:erta',
      name: 'Ethiopian Road Transport Authority',
      sector: 'GOVERNMENT',
    },
    issuanceDate: '2023-05-20T00:00:00Z',
    expiryDate: '2026-05-19T23:59:59Z',
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      licenseNumber: 'DL-ET-2023-4521',
      category: 'B',
      vehicleType: 'Light Vehicle',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-004',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-004',
    color: '#7B3FA0',
    icon: 'car',
  },
  {
    id: 'crd-uuid-005',
    type: 'VaccinationCredential',
    title: 'Vaccination Record',
    subtitle: 'COVID-19 — AstraZeneca (2 doses)',
    issuer: {
      did: 'did:et:org:fmoh',
      name: 'Federal Ministry of Health',
      sector: 'HEALTH',
    },
    issuanceDate: '2022-04-01T00:00:00Z',
    expiryDate: null,
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      vaccineType: 'COVID-19',
      manufacturer: 'AstraZeneca',
      doses: 2,
      lastDoseDate: '2022-06-15',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-005',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-005',
    color: '#0E7490',
    icon: 'medkit',
  },
  {
    id: 'crd-uuid-006',
    type: 'EmploymentCredential',
    title: 'Employment Certificate',
    subtitle: 'Software Engineer — Safaricom Ethiopia',
    issuer: {
      did: 'did:et:org:safaricom-et',
      name: 'Safaricom Ethiopia',
      sector: 'EMPLOYMENT',
    },
    issuanceDate: '2024-09-01T00:00:00Z',
    expiryDate: null,
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      jobTitle: 'Software Engineer',
      department: 'Technology',
      employeeId: 'SAF-ET-2024-1122',
      startDate: '2024-09-01',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-006',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-006',
    color: '#B45309',
    icon: 'briefcase',
  },
  {
    id: 'crd-uuid-007',
    type: 'ProfessionalCertificateCredential',
    title: 'AWS Certified Developer',
    subtitle: 'Amazon Web Services — Associate Level',
    issuer: {
      did: 'did:et:org:aws-cert',
      name: 'Amazon Web Services',
      sector: 'PROFESSIONAL',
    },
    issuanceDate: '2024-03-15T00:00:00Z',
    expiryDate: '2027-03-14T23:59:59Z',
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      certificationName: 'AWS Certified Developer – Associate',
      certificationId: 'AWS-DEV-2024-445522',
      level: 'Associate',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-007',
    ebcsAnchored: false,
    ebcsTxId: '',
    color: '#FF9900',
    icon: 'cloud',
  },
  {
    id: 'crd-uuid-008',
    type: 'BirthCertificateCredential',
    title: 'Birth Certificate',
    subtitle: 'Vital Statistics Record — Oromia',
    issuer: {
      did: 'did:et:org:moi-oromia',
      name: 'Ministry of Interior — Oromia',
      sector: 'GOVERNMENT',
    },
    issuanceDate: '2023-11-05T00:00:00Z',
    expiryDate: null,
    status: 'ACTIVE',
    holderDid: 'did:et:citizen:ET123456789',
    credentialSubject: {
      givenName: 'Abebe',
      familyName: 'Kebede',
      dateOfBirth: '1999-04-12',
      placeOfBirth: 'Adama, Oromia',
      registrationNumber: 'BC-ORM-1999-0412-001',
    },
    proofFormat: 'DATA_INTEGRITY',
    verificationUrl: 'https://verify.debo.et/mock/crd-uuid-008',
    ebcsAnchored: true,
    ebcsTxId: 'ebcs-tx-mock-008',
    color: '#2E5090',
    icon: 'ribbon',
  },
];

export const MOCK_ACTIVITIES: MockActivity[] = [
  {
    id: 'act-001',
    type: 'VERIFIED',
    title: 'Credential Verified',
    description: 'Bachelor Degree verified by Commercial Bank of Ethiopia',
    timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-001',
    credentialTitle: 'Bachelor of Science',
    method: 'QR Code',
  },
  {
    id: 'act-002',
    type: 'SHARED',
    title: 'Credential Shared',
    description: 'Degree shared to Commercial Bank of Ethiopia',
    timestamp: new Date(Date.now() - 2.75 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-001',
    credentialTitle: 'Bachelor of Science',
    method: 'Verification Link',
  },
  {
    id: 'act-003',
    type: 'LOGIN',
    title: 'Wallet Unlocked',
    description: 'Biometric authentication',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-004',
    type: 'RECEIVED',
    title: 'Credential Received',
    description: 'Bachelor of Science from Haramaya University',
    timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-001',
    credentialTitle: 'Bachelor of Science',
  },
  {
    id: 'act-005',
    type: 'LOGIN',
    title: 'Wallet Unlocked',
    description: 'PIN authentication',
    timestamp: new Date(Date.now() - 28 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'act-006',
    type: 'RECEIVED',
    title: 'Credential Received',
    description: 'Driving License from Ethiopian Road Transport Authority',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-004',
    credentialTitle: 'Driving License',
  },
  {
    id: 'act-007',
    type: 'SHARED',
    title: 'Credential Shared',
    description: 'National ID shared to Safaricom Ethiopia HR Portal',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-003',
    credentialTitle: 'National Identity Card',
    method: 'QR Code',
  },
  {
    id: 'act-008',
    type: 'RECEIVED',
    title: 'Credential Received',
    description: 'Employment Certificate from Safaricom Ethiopia',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    credentialId: 'crd-uuid-006',
    credentialTitle: 'Employment Certificate',
  },
];

export const DEMO_OTP = '123456';
export const VALID_NATIONAL_IDS = Object.keys(MOCK_CITIZENS);
