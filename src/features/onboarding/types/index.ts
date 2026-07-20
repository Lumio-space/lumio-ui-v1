
// Draft 
export interface CreateDraftResponse {
  draftToken:  string;
  currentStep: string;
}

export interface GetDraftResponse {
  draftToken:  string;
  currentStep: string;
}

// Step payloads 

export interface SchoolInfoPayload {
  name:         string;
  contactEmail: string;
  phone:        string;
  address:      string;
  city:         string;
  state:        string;
}

export interface InstitutionInfoPayload {
  schoolType: 'k12' | 'college' | 'district';
}

export interface AcademicSettingsPayload {
  academicYear:  string;
  gradingSystem: 'letter' | 'gpa' | 'percent';
  termStructure: 'semester' | 'trimester' | 'quarter';
  weekStart:     'mon' | 'tues' | 'wed' | 'thurs' | 'fri';
  startTime:     string;
  endTime:       string;
}

export interface AdministratorsPayload {
  fullName: string;
  email:    string;
  phone:    string;
  password: string;
}

// Branding 

export interface BrandingSignatureResponse {
  cloud_name: string;
  api_key:    string;
  signature:  string;
  timestamp:  number;
  folder:     string;
}


export interface LogoMetadata {
  public_id:  string;
  secure_url: string;
  width:      number;
  height:     number;
  format:     string;
}

/** Raw Cloudinary upload response — may contain extra fields. */
export interface CloudinaryUploadResponse extends LogoMetadata {
  [key: string]: unknown;
}

/**
 * Payload sent to POST /registration/drafts/steps/branding.
 * The backend expects camelCase field names — NOT snake_case.
 */
export interface BrandingPayload {
  publicId:  string;
  secureUrl: string;
  width:     number;
  height:    number;
  format:    string;
}

// Complete registration 

export interface CompleteRegistrationResponse {
  schoolId:   string;
  schoolName: string;
  token:      string;
}
