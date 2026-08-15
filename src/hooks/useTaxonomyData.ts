"use client";

import { useState, useEffect, useCallback } from "react";

import { api } from "@/lib/api";

import type { Exam, Topic, FlatTopic, QuizSummary } from "@/components/data-display/TaxonomyManager.types";

interface TaxonomyData {
  exams: Exam[];
  topics: Topic[];
  flatTopics: FlatTopic[];
  allQuizzes: QuizSummary[];
  loading: boolean;
  error: string | null;
}

interface TaxonomyActions {
  fetchData: () => Promise<void>;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
}

export function useTaxonomyData(): [TaxonomyData, TaxonomyActions] {
  const [exams, setExams] = useState<Exam[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flatTopics, setFlatTopics] = useState<FlatTopic[]>([]);
  const [allQuizzes, setAllQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [examsRes, topicsRes, quizzesRes] = await Promise.all([
        api.get<Exam[]>("/api/admin/exams"),
        api.get<Topic[]>("/api/admin/topics?all=true"),
        api.get<QuizSummary[]>("/api/admin/quizzes"),
      ]);

      if (examsRes.success && examsRes.data) setExams(examsRes.data);
      if (topicsRes.success && topicsRes.data) {
        setTopics(topicsRes.data);
        const flats: FlatTopic[] = topicsRes.data.map((t: Topic) => ({
          ...t,
          displayType: t.parentTopics && t.parentTopics.length > 0 ? "Sub Topic" : "Main Topic",
        }));
        setFlatTopics(flats);
      }
      if (quizzesRes.success && quizzesRes.data) setAllQuizzes(quizzesRes.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load taxonomy metadata.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  return [
    { exams, topics, flatTopics, allQuizzes, loading, error },
    { fetchData, setLoading, setError },
  ];
}
