export interface JobApplication {
  id: string;
  applicant: Applicant;
  answers: any[]; // Appears empty in example, 'any[]' is safest
  language: string;
  adjacent_applications: AdjacentApplications;
  dpv_session_id: string;
  is_recommended: boolean;
  is_new: boolean;
  created_at: string; // ISO Date string
  is_viewed: boolean;
  is_criteria_valid: boolean;
  is_rejected: boolean;
  video_token: string;
  has_video: boolean;
  badges: any | null;
  count_bought_badges: any | null;
  has_bought_badges: any | null;
  relevancy_score: number;
  auto_rejection_reason: any[];
  job_listing: string;
  current_stage: CurrentStage;
  created_by: string | null;
}

export interface Applicant {
  age: number | null;
  applicant_profile: ApplicantProfile;
  created_at: string; // ISO Date string
  first_name: string;
  gender: LookupValue;
  id: string;
  last_name: string;
  photo_url: string;
  email: string;
  has_mobile: boolean;
}

export interface ApplicantProfile {
  id: string;
  current_position: LookupValue | null;
  country: LookupValue;
  nationality: LookupValue;
  education_level: LookupValue;
  skill_level: LookupValue | null;
  salary_expectations: LookupValue;
  commitment: LookupValue | null;
  notice_period: LookupValue | null;
  visa_status: LookupValue;
  current_company: string | null;
  work_experience: Record<string, string> | null; // Dynamic keys like "light-vehicle_3169"
  job_gender: LookupValue;
  cv_url: string;
  legacy_id: number | null;
  is_fresher: boolean;
  name: string;
  job_email: string;
  job_date_of_birth: string | null;
  job_phone_number: string | null;
  availability: string;
  profile_image: string | null;
  cv: string;
  cv_text: string;
  cv_upload_date: string | null;
  cover_letter: string;
  digital_profile_token: DigitalProfileToken | null;
  emirate: string | null;
  total_work_experience: string | null;
  language: string[];
}

/**
 * Common structure for dropdown/lookup fields
 * (e.g. Country, Nationality, Gender, Visa Status)
 */
export interface LookupValue {
  id: string;
  key: string;
  value: string;
  legacy_id?: number | string; // Examples show both numbers (2555) and strings ("3")
}

export interface DigitalProfileToken {
  video: string | null;
}

export interface AdjacentApplications {
  total_applications: number;
  current: number;
  next: string | null;
  prev: string | null;
}

export interface CurrentStage {
  id: string;
  name: string;
}
export interface ApplicationResponce {
  count: number;
  next: string;
  previous: string;
  results: JobApplication[];
  all_status_count: {
    deleted: number;
    draft: number;
    live: number;
  };
  total_count: number;
}
