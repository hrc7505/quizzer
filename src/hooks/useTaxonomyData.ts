"use client";

import { useState, useEffect, useRef } from "react";
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
  const mountedRef = useRef(true);
  const initialisedRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, topicsRes, quizzesRes] = await Promise.all([
        fetch("/api/admin/exams"),
        fetch("/api/admin/topics?all=true"),
        fetch("/api/admin/quizzes"),
      ]);

      const examsData = await examsRes.json();
      const topicsData = await topicsRes.json();
      const quizzesData = await quizzesRes.json();

      if (!mountedRef.current) return;

      if (Array.isArray(examsData)) setExams(examsData);
      if (Array.isArray(topicsData)) {
        setTopics(topicsData);
        const flats: FlatTopic[] = topicsData.map((t: Topic) => ({
          ...t,
          displayType: t.parentTopics && t.parentTopics.length > 0 ? "Sub Topic" : "Main Topic",
        }));
        setFlatTopics(flats);
      }
      if (Array.isArray(quizzesData)) setAllQuizzes(quizzesData);
    } catch (err) {
      if (!mountedRef.current) return;
      console.error(err);
      setError("Failed to load taxonomy metadata.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  // Initial fetch on mount only
  useEffect(() => {
    if (initialisedRef.current) return;
    initialisedRef.current = true;
    fetchData();
  }, []);

  return [
    { exams, topics, flatTopics, allQuizzes, loading, error },
    { fetchData, setLoading, setError },
  ];
}