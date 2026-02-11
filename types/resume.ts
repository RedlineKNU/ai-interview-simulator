export interface ResumeData {
  name: string;
  email: string;
  phone?: string;
  summary?: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  weaknesses?: string[];
  rawText: string;
}

export interface Experience {
  company: string;
  position: string;
  duration: string;
  description: string;
  technologies?: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}
