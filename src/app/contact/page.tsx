import Link from "next/link";
import { 
  Mail, 
  MessageSquare, 
  Clock, 
  HelpCircle, 
  ShieldCheck, 
  Sparkles,
  ArrowRight
} from "lucide-react";

import { PageLayout } from "@/components/layouts/PageLayout";
import { Container } from "@/components/layouts/Container";
import { ContactForm } from "@/features/contact/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us · Quizzer Support & Content Feedback",
  description: "Get in touch with the Quizzer team for exam content suggestions, question error reporting, feature requests, or technical support.",
};

const faqs = [
  {
    question: "How do I report an error or typo in a question?",
    answer: "Select 'Question Error / Content Feedback' in our contact form, specify the Quiz title and Question text or number, and explain the correction. Our editorial team reviews reports promptly.",
  },
  {
    question: "Is Quizzer completely free for students?",
    answer: "Yes, all interactive quizzes, review modes, and persistent AI explanations are freely available to help students prepare effectively.",
  },
  {
    question: "How are the AI explanations created?",
    answer: "Our explanations are powered by Google Gemini AI, which analyzes each question, examines all multiple-choice options, highlights common student pitfalls, and caches structured deep dives in our database.",
  },
  {
    question: "What user data does Quizzer record about me?",
    answer: "We only record your essential account details (name, email) and your quiz performance history (score %, time taken, selected answers) to power your progress dashboard. You can review and export all your recorded data on your Profile page.",
  },
  {
    question: "Can I request new exam categories or subjects?",
    answer: "Absolutely! Send us a message under 'Feature Request / Suggestion' with the specific syllabus, board, or competitive exam you would like to see added.",
  },
];

/**
 * Contact page providing direct feedback channels, inquiry form, and frequently asked questions.
 */
export default function ContactPage() {
  return (
    <PageLayout contained={false}>
      {/* Header */}
      <section className="bg-linear-to-b from-primary/5 via-background to-background py-14 sm:py-16 px-4 sm:px-6 lg:px-8 border-b border-border/20 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3.5 py-1.5 rounded-full border border-primary/20 mb-4">
            <Mail className="h-4 w-4 text-primary" />
            <span className="text-primary text-xs font-semibold">We're Here to Help</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground mb-3">
            Get in Touch with Quizzer
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed m-0">
            Have a question about a quiz, spotted an error in an explanation, or want to suggest new study material? Send us a message and our team will get back to you.
          </p>
        </div>
      </section>

      {/* Main Form & Contact Info */}
      <Container className="py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left: Contact Info cards (stacks on mobile, 3-cols on tablet, 1-col sidebar on desktop) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Mail className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground m-0">Support & Feedback Email</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Reach our team directly for any general questions, bugs, or content feedback.
              </p>
              <a 
                href="mailto:support@quizzer.com" 
                className="text-xs font-semibold text-primary hover:underline mt-1 w-fit no-underline"
              >
                support@quizzer.com
              </a>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-info/10 text-info flex items-center justify-center border border-info/20">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground m-0">Response Turnaround</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                We review submissions Monday through Friday and typically respond within 24 to 48 business hours.
              </p>
            </div>

            <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 text-success flex items-center justify-center border border-success/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground m-0">Your Data Privacy</h3>
              <p className="text-xs text-muted-foreground leading-relaxed m-0">
                Want to know what data Quizzer records or request data export? Visit our transparency center.
              </p>
              <Link 
                href="/data-privacy" 
                className="text-xs font-semibold text-success hover:underline flex items-center gap-1 mt-1 w-fit no-underline"
              >
                <span>Read Data Transparency Policy</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Right: Contact Form (2 cols) */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>

        </div>
      </Container>

      {/* FAQ Section */}
      <section id="faq" className="bg-secondary/30 border-t border-border/60 py-16">
        <Container>
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20 mb-3">
              <HelpCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-primary text-xs font-semibold">Common Questions</span>
            </div>
            <h2 className="text-2xl font-bold text-foreground m-0">Frequently Asked Questions</h2>
          </div>

          <div className="max-w-3xl mx-auto flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="bg-card border border-border/80 rounded-xl p-5 shadow-xs flex flex-col gap-2 transition-colors hover:border-primary/40"
              >
                <h3 className="text-sm font-semibold text-foreground m-0 flex items-center gap-2">
                  <span className="text-primary font-bold">Q:</span>
                  <span>{faq.question}</span>
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed m-0 pl-5">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </PageLayout>
  );
}
