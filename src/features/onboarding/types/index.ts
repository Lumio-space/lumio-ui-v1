
export interface SchoolInfoPayload {
  name:    string;
  email:   string;
  phone:   string;
  address: string;
  city:    string;
  country: string;
}


export interface SchoolInfoResponse {
  draftToken:  string;
  currentStep: string;
}


export interface GetDraftResponse {
  draftToken:  string;
  currentStep: string;
}


export interface InstitutionInfoPayload {
  institutionType: 'public' | 'private' | 'charter' | 'magnet' | 'online';
  educationalLevels: Array<'nursery' | 'primary' | 'secondary'>;
}

export interface AcademicSettingsPayload {
  academicYear:  string;
  gradingSystem: 'letter' | 'gpa' | 'percent';
  termStructure: 'two_semester' | 'three_trimester' | 'four_quarter';
  weekStartsOn: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  schoolDays: Array<'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'>;
  schoolStartTime: string;
  schoolEndTime: string;
}

export interface AdministratorsPayload {
  primaryFullName: string;
  primaryEmail:    string;
  primaryPhone:    string;
  primaryPassword: string;
}


export interface BrandingSignatureResponse {
  api_key:    string;
  signature:  string;
  timestamp:  number;
  folder:     string;
  tags:       string;
}

export interface BrandingSignatureRawResponse {
  api_key?:  string;
  signature: string;
  timestamp: number;
  folder:    string;
}

export interface LogoMetadata {
  public_id:  string;
  secure_url: string;
  width:      number;
  height:     number;
  format:     string;
}

export interface CloudinaryUploadResponse extends LogoMetadata {
  [key: string]: unknown;
}


export interface BrandingPayload {
  publicId:  string;
  secureUrl: string;
  width:     number;
  height:    number;
  format:    string;
}


export interface CompleteRegistrationResponse {
  schoolId:   string;
  schoolName: string;
  token:      string;
}
