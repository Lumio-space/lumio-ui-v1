export type ResultTerm = 'first_term' | 'second_term' | 'third_term';

export type ResultStatus = 'not_started' | 'draft' | 'published';

export type ResultGrade = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';

export interface StudentSubjectResult {
  classSubjectId: string;
  subjectId: string;
  subjectTitle: string;
  testScore: number | null;
  caScore: number | null;
  examScore: number | null;
  totalScore: number | null;
  grade: ResultGrade | null;
  remark: string | null;
  status: ResultStatus;
}

export interface ClassStudentResults {
  studentId: string;
  fullName: string;
  results: StudentSubjectResult[];
}

export interface SaveResultEntryPayload {
  studentId: string;
  classSubjectId: string;
  testScore: number;
  caScore: number;
  examScore: number;
}

export interface SaveClassResultsPayload {
  academicYear: string;
  term: ResultTerm;
  entries: SaveResultEntryPayload[];
}

export interface SaveClassResultsResponse {
  success: boolean;
  message: string;
  count: number;
}

export interface PublishClassResultsPayload {
  academicYear: string;
  term: ResultTerm;
}

export interface PublishClassResultsResponse {
  success: boolean;
  message: string;
  publishedCount: number;
  alreadyPublishedCount: number;
}

export interface CreateResultCardBatchPayload {
  quantity: number;
  academicYear: string;
  term: ResultTerm;
}

export interface CreateResultCardBatchResponse {
  batchId: string;
  paymentReference: string;
  checkoutId: string | null;
  checkoutUrl: string | null;
  quantity?: number;
  amountNaira?: number;
  currency?: string;
  paymentStatus: string;
}

export type ResultCardStatus = 'available' | 'active' | 'exhausted' | 'revoked';

export interface ResultCardItem {
  serialNumber: string;
  pin: string;
  status: ResultCardStatus;
}

export interface BatchCardsResponse {
  batchId: string;
  academicYear: string;
  term: ResultTerm;
  cards: ResultCardItem[];
}

export interface RedeemResultCardPayload {
  serialNumber: string;
  pin: string;
  academicYear: string;
  term: ResultTerm;
}

export interface RedeemedResultItem {
  resultId: string;
  subjectId: string;
  subjectTitle: string;
  classSubjectId: string;
  testScore: number;
  caScore: number;
  examScore: number;
  totalScore: number;
  grade: ResultGrade;
  remark: string;
}

export interface RedeemResultCardResponse {
  success: boolean;
  student: {
    id: string;
    fullName: string;
  };
  academicYear: string;
  term: ResultTerm;
  usesRemaining: number;
  results: RedeemedResultItem[];
}
