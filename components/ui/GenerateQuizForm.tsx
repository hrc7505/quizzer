"use client";

import { useState, useRef } from "react";
import {
  Button, Input, Textarea, Field, Spinner, MessageBar,
  MessageBarBody, MessageBarTitle, Select, TabList, Tab, Text
} from "@fluentui/react-components";
import type { SelectTabData, SelectTabEvent } from "@fluentui/react-components";
import { GenerateQuizResponse, GenerateQuizPayload } from "./interfaces/GenerateQuizForm.interface";
import { QuizService } from "../../lib/services/quiz.service";
import { useGenerateQuizFormStyles } from "./styles/useGenerateQuizFormStyles";

interface GenerateQuizFormProps {
  /** Called after a successful generation — parent can close dialog / refresh state. */
  onSuccess?: (result: GenerateQuizResponse) => void;
  initialTopicId?: string;
}

/**
 * GenerateQuizForm — embeddable form that generates a quiz via Gemini AI.
 * The quiz title is used only as context for AI question generation.
 * After creation the quiz is standalone; admin links it to subtopics via QuizManager.
 */
export function GenerateQuizForm({ onSuccess, initialTopicId }: GenerateQuizFormProps = {}) {
  const styles = useGenerateQuizFormStyles();
  const [mode, setMode] = useState<"title" | "text" | "pdf">("title");
  const [quizTitle, setQuizTitle] = useState("");
  const [topicText, setTopicText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("Medium");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateQuizResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTabSelect = (_: SelectTabEvent, data: SelectTabData) => {
    setMode(data.value as "title" | "text" | "pdf");
    setError(null);
    setResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a valid PDF file.");
        return;
      }
      setFile(f);
      setError(null);
    }
  };

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (dropped.type !== "application/pdf" && !dropped.name.toLowerCase().endsWith(".pdf")) {
        setError("Please upload a valid PDF file.");
      } else {
        setFile(dropped);
        setError(null);
      }
    }
  };

  const isFormValid = () => {
    if (!quizTitle) return false;
    if (mode === "text" && !topicText) return false;
    if (mode === "pdf" && !file) return false;
    return true;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload: GenerateQuizPayload = {
        mode,
        topicTitle: quizTitle,
        existingTopicId: initialTopicId || undefined,
        difficulty,
        topicText: mode === "text" ? topicText : undefined,
        file: mode === "pdf" ? file : undefined,
      };

      const data = await QuizService.generateQuiz(payload);
      setResult(data);
      setQuizTitle("");
      setTopicText("");
      setFile(null);
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      onSuccess?.(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : undefined;
      setError(message || "An unexpected error occurred while communicating with Gemini API.");

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleGenerate} className={styles.form}>

      {error && (
        <MessageBar intent="error">
          <MessageBarBody>
            <MessageBarTitle>Error</MessageBarTitle>
            {error}
          </MessageBarBody>
        </MessageBar>
      )}

      {result && (
        <MessageBar intent="success">
          <MessageBarBody>
            <MessageBarTitle>Success</MessageBarTitle>
            Generated {result.totalQuestions} questions across {result.quizzesCreated} quiz{result.quizzesCreated > 1 ? "zes" : ""}! Link them to subtopics from Quizzes → Link Topics.
          </MessageBarBody>
        </MessageBar>
      )}

      {/* Mode tabs */}
      <TabList selectedValue={mode} onTabSelect={handleTabSelect} className={styles.tabList}>
        <Tab value="title">From Title Only</Tab>
        <Tab value="text">From Text</Tab>
        <Tab value="pdf">From PDF</Tab>
      </TabList>

      {/* Quiz Title — always shown; used as AI context prompt */}
      <Field
        label="Quiz Title"
        required
        hint="The title is used by AI to generate relevant questions. The quiz will be created standalone — link it to subtopics afterwards."
      >
        <Input
          placeholder="e.g. History of Rome"
          value={quizTitle}
          onChange={e => setQuizTitle(e.target.value)}
          disabled={loading}
          className={styles.fullWidthInput}
        />
      </Field>

      <Field label="Difficulty Level" required>
        <Select value={difficulty} onChange={(_, d) => setDifficulty(d.value)} disabled={loading} className={styles.fullWidthInput}>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </Select>
      </Field>

      {mode === "text" && (
        <Field label="Content (Text)" required hint="Paste the text you want to generate questions from.">
          <Textarea
            placeholder="Paste text here..."
            value={topicText}
            onChange={e => setTopicText(e.target.value)}
            disabled={loading}
            rows={10}
            className={styles.fullWidthTextarea}
          />
        </Field>
      )}

      {mode === "pdf" && (
        <Field label="Upload PDF" required hint="Upload a PDF document to generate questions from.">
          <div
            className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={loading} ref={fileInputRef} style={{ display: "none" }} />
            <Text size={400} weight="semibold" className={styles.dropzoneTitle}>
              {file ? `📄 ${file.name}` : isDragging ? "Drop PDF here" : "Drag & drop a PDF, or click to browse"}
            </Text>
            {!file && !isDragging && <Text size={200} className={styles.dropzoneHint}>Supports .pdf files only</Text>}
          </div>
        </Field>
      )}

      <Button appearance="primary" type="submit" disabled={loading || !isFormValid()} className={styles.submitButton}>
        {loading ? <><Spinner size="tiny" className={styles.spinner} /> Generating…</> : "Generate Quiz"}
      </Button>
    </form>
  );
}
