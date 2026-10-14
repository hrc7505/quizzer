"use client";

import { useState } from "react";
import { Send, CheckCircle2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Spinner } from "@/components/ui/Spinner";
import type { ContactFormData, ContactInquiryType } from "../interfaces/Contact.interface";

/**
 * Interactive contact inquiry form with validation and simulated submission feedback.
 */
export function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    inquiryType: "question_feedback",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Simulate submission network call
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSubmitted(true);
      setFormData({
        name: "",
        email: "",
        inquiryType: "question_feedback",
        subject: "",
        message: "",
      });
    } catch {
      setError("Unable to submit message. Please try again or email us directly.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border/80 rounded-2xl p-8 text-center flex flex-col items-center gap-4 shadow-xs">
        <div className="h-12 w-12 rounded-full bg-success/10 text-success flex items-center justify-center">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <h3 className="text-xl font-bold text-foreground m-0">Thank You for Reaching Out!</h3>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-md m-0">
          Your message has been received. Our team will review your inquiry and respond to your email within 24 to 48 hours.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setSubmitted(false)}
          className="mt-2 text-xs font-semibold"
        >
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col gap-5">
      <div className="flex items-center gap-2.5 pb-3 border-b border-border/60">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground m-0">Send Us a Direct Message</h3>
      </div>

      {error && (
        <Alert variant="danger">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/90">
            Your Name <span className="text-danger">*</span>
          </label>
          <Input
            type="text"
            placeholder="e.g. John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={loading}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/90">
            Email Address <span className="text-danger">*</span>
          </label>
          <Input
            type="email"
            placeholder="e.g. student@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/90">
            Inquiry Category
          </label>
          <Select
            value={formData.inquiryType}
            onChange={(e) => setFormData({ ...formData, inquiryType: e.target.value as ContactInquiryType })}
            disabled={loading}
          >
            <option value="question_feedback">Question Error / Content Feedback</option>
            <option value="feature_request">Feature Request / Suggestion</option>
            <option value="bug_report">Technical Bug or Issue</option>
            <option value="academic_inquiry">Educator / Academic Collaboration</option>
            <option value="general">General Inquiry</option>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground/90">
            Subject
          </label>
          <Input
            type="text"
            placeholder="e.g. Typo in Physics Quiz #3"
            value={formData.subject}
            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            disabled={loading}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-foreground/90">
          Message <span className="text-danger">*</span>
        </label>
        <Textarea
          rows={5}
          placeholder="Describe your question, issue, or feedback in detail..."
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        disabled={loading}
        className="w-full sm:w-auto self-start h-11 px-6 font-semibold gap-2 shadow-xs"
      >
        {loading ? (
          <>
            <Spinner size="sm" className="text-primary-foreground" />
            <span>Sending Message...</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            <span>Submit Message</span>
          </>
        )}
      </Button>
    </form>
  );
}
