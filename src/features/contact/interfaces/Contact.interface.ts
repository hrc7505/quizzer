/**
 * Categories available for contact inquiry submissions.
 */
export type ContactInquiryType = 
  | "question_feedback"
  | "bug_report"
  | "feature_request"
  | "academic_inquiry"
  | "general";

/**
 * Interface representing contact form data submitted by users.
 */
export interface ContactFormData {
  name: string;
  email: string;
  inquiryType: ContactInquiryType;
  subject: string;
  message: string;
}

/**
 * FAQ item displayed on the Contact page.
 */
export interface ContactFaqItem {
  question: string;
  answer: string;
}
