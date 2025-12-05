export interface JobListing {
  id: string;
  legacy_id: number;
  legacy_uuid: string;
  created_at: string;
  updated_at: string;
  expires_at: string;
  status: string;
  name: string;
  description: string;
  data: JobData;
  featured_status: string;
  edit_url: string | null;
  application_counts: ApplicationCounts;
  upgrade_url: string;
  dpv_url: string;
  category: Category;
  pipeline: string;
  relevancy: Relevancy;
  company: string;
  auto_reject_config: AutoRejectConfig;
}

export interface JobData {
  gender: string;
  salary: string;
  benefits?: string[];
  industry: string;
  language: string[];
  location: Location;
  commitment: string;
  'remote-job': string; // Key contains a hyphen
  cv_required: boolean;
  absolute_url: string;
  company_name: string;
  company_size: string;
  relative_url: string;
  education_level: string;
  work_experience: string;
  hide_company_name: boolean;
  attributes_display_values: AttributesDisplayValues;
  auto_reject_applicants_not_based_in_the_uae: string;
  other_benefit?: string; // Optional (present in second object, missing in first)
}

export interface Location {
  name: string[];
  name_i18n: LocationNameI18n;
}

export interface LocationNameI18n {
  ar: string[];
}

export interface AttributesDisplayValues {
  salary: BilingualValue;
  commitment: BilingualValue;
  skill_level: BilingualValue;
  company_size: BilingualValue;
  education_level: BilingualValue;
  work_experience: BilingualValue;
}

export interface BilingualValue {
  ar: string;
  en: string;
}

export interface ApplicationCounts {
  total: number;
  applied: number;
  offered: number;
}

export interface Category {
  id: string;
  legacy_id?: number; // Optional based on nested usage in auto_reject_config
  slug: string;
  full_slug?: string; // Optional
}

export interface Relevancy {
  work_experience: string;
  education_level: string;
  nationality: string | null;
  gender: string;
  location: Location;
  category: string;
  percentage: number;
}

export interface AutoRejectConfig {
  gender: ConfigEnabled;
  experience: ExperienceConfig;
  nationality: ConfigEnabled;
  qualification: ConfigEnabled;
  screening_questions: ConfigEnabled;
  auto_reject_applicants_not_based_in_the_uae: ConfigEnabled;
}

export interface ConfigEnabled {
  enabled: boolean;
}

export interface ExperienceConfig {
  values: ExperienceValue[];
  enabled: boolean;
}

export interface ExperienceValue {
  category: Category;
  sub_category: Category[];
  maximum_experience: number;
  minimum_experience: number | string; // JSON 1 has number (1), JSON 2 has string ("0")
}
export interface VacancyResponce {
  count: number;
  next: string;
  previous: string;
  results: JobListing[];
  all_status_count: {
    deleted: number;
    draft: number;
    live: number;
  };
  total_count: number;
}
