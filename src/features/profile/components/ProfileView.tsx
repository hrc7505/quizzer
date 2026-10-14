"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  User, 
  Mail, 
  Calendar, 
  Trophy, 
  Timer, 
  CheckCircle, 
  AlertCircle, 
  Download, 
  Trash2, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  Sparkles, 
  BookOpen, 
  Edit3, 
  Check, 
  X,
  ExternalLink,
  Layers,
  Lock
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { Alert } from "@/components/ui/Alert";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import type { UserProfileResponse } from "../interfaces/Profile.interface";

/**
 * Interactive User Profile view featuring learning metrics, recent quiz activity,
 * and complete data transparency controls.
 */
export function ProfileView() {
  const [data, setData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "user-data">("overview");

  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Clear history state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [actionAlert, setActionAlert] = useState<{ type: "success" | "danger"; message: string } | null>(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/user/profile");
      if (res.ok) {
        const json = await res.json();
        setData(json);
        setNameInput(json.user?.name || "");
      } else {
        setData(null);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateName = async () => {
    setSavingName(true);
    setActionAlert(null);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput }),
      });
      if (res.ok) {
        setIsEditingName(false);
        setActionAlert({ type: "success", message: "Name updated successfully!" });
        await fetchProfile();
      } else {
        setActionAlert({ type: "danger", message: "Failed to update name." });
      }
    } catch {
      setActionAlert({ type: "danger", message: "Network error updating name." });
    } finally {
      setSavingName(false);
    }
  };

  const handleClearHistory = async () => {
    setClearingHistory(true);
    setActionAlert(null);
    try {
      const res = await fetch("/api/user/attempts/clear", {
        method: "POST",
      });
      if (res.ok) {
        setShowClearConfirm(false);
        setActionAlert({ type: "success", message: "Your quiz attempt history has been cleared." });
        await fetchProfile();
      } else {
        setActionAlert({ type: "danger", message: "Failed to clear history." });
      }
    } catch {
      setActionAlert({ type: "danger", message: "Network error while clearing history." });
    } finally {
      setClearingHistory(false);
    }
  };

  const handleExportData = () => {
    window.location.href = "/api/user/export";
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner size="lg" className="text-primary" />
        <span className="text-xs text-muted-foreground">Loading your profile & learning records...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center flex flex-col items-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
          <User className="h-8 w-8" />
        </div>
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-foreground">Sign In to Access Your Profile</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            You must be logged in to view your learning analytics, resume in-progress quizzes, and review what personal data Quizzer records.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/auth/login">
            <Button variant="primary" className="font-semibold px-6 shadow-xs">
              Sign In to Quizzer
            </Button>
          </Link>
          <Link href="/data-privacy">
            <Button variant="outline" className="font-semibold">
              Read Data Transparency Policy
            </Button>
          </Link>
        </div>

        {/* Public explanation of what is recorded upon signup */}
        <div className="mt-8 p-6 bg-card border border-border/80 rounded-2xl text-left w-full shadow-xs">
          <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>What Data Quizzer Records When You Sign In</span>
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            We value your privacy. Here is the exact data saved when you use Quizzer:
          </p>
          <ul className="text-xs text-muted-foreground flex flex-col gap-1.5 p-0 m-0 list-disc list-inside">
            <li><strong>Your Basic Profile:</strong> Name, Email, and OAuth profile ID (used for authentication).</li>
            <li><strong>Quiz Progress:</strong> Question responses, completion status, score percentages, and time spent.</li>
            <li><strong>Zero Trackers:</strong> No marketing cookies, no advertisement networks, and no sale of your data.</li>
          </ul>
        </div>
      </div>
    );
  }

  const { user, stats, recentAttempts, recordedData } = data;
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hoursSpent = Math.floor(stats.totalTimeSec / 3600);
  const minutesSpent = Math.floor((stats.totalTimeSec % 3600) / 60);

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Alert Banner if present */}
      {actionAlert && (
        <Alert variant={actionAlert.type}>
          {actionAlert.message}
        </Alert>
      )}

      {/* Header Profile Card */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl sm:text-2xl border border-primary/20 shrink-0">
            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {isEditingName ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="h-8 text-sm w-48"
                    placeholder="Your name"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="primary"
                    className="h-8 w-8"
                    onClick={handleUpdateName}
                    disabled={savingName}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={() => {
                      setIsEditingName(false);
                      setNameInput(user.name || "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground m-0">
                    {user.name || "Student Learner"}
                  </h1>
                  <button
                    onClick={() => setIsEditingName(true)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title="Edit Name"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
                {user.role}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
              {user.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>{user.email}</span>
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Member since {memberSince}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Data Action */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            className="gap-1.5 text-xs font-semibold w-full md:w-auto"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export My Data</span>
          </Button>
        </div>
      </div>

      {/* Tabs with horizontal scroll support on mobile */}
      <div className="flex items-center gap-2 border-b border-border/80 overflow-x-auto no-scrollbar pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`shrink-0 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "overview"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Trophy className="h-4 w-4 shrink-0" />
          <span>Analytics & Quizzes</span>
        </button>

        <button
          onClick={() => setActiveTab("user-data")}
          className={`shrink-0 px-3.5 sm:px-4 py-2.5 text-xs sm:text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === "user-data"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Database className="h-4 w-4 shrink-0" />
          <span>What We Record From You <span className="hidden sm:inline">(Data Transparency)</span></span>
        </button>
      </div>

      {/* TAB 1: LEARNING OVERVIEW */}
      {activeTab === "overview" && (
        <div className="flex flex-col gap-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Total Quizzes</span>
              <span className="text-2xl sm:text-3xl font-bold text-foreground">{stats.totalAttempts}</span>
              <span className="text-[11px] text-muted-foreground">
                {stats.completedAttempts} completed · {stats.inProgressAttempts} in-progress
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Average Score</span>
              <span className="text-2xl sm:text-3xl font-bold text-primary">{stats.averageScore}%</span>
              <span className="text-[11px] text-muted-foreground">Across all finished quizzes</span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Best Score</span>
              <span className="text-2xl sm:text-3xl font-bold text-success">{stats.bestScore}%</span>
              <span className="text-[11px] text-muted-foreground">Highest recorded attempt</span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col gap-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Time Practicing</span>
              <span className="text-2xl sm:text-3xl font-bold text-info">
                {hoursSpent > 0 ? `${hoursSpent}h ` : ""}{minutesSpent}m
              </span>
              <span className="text-[11px] text-muted-foreground">Total active quiz time</span>
            </div>
          </div>

          {/* Recent Quiz Attempts */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground m-0">Recent Quiz Activity</h2>
              <Link href="/exams">
                <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1 text-primary">
                  <span>Browse More Quizzes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {recentAttempts.length === 0 ? (
              <div className="bg-card border border-border/80 rounded-xl p-8 text-center flex flex-col items-center gap-3">
                <BookOpen className="h-8 w-8 text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground m-0">
                  You haven't attempted any quizzes yet. Choose an exam to test your knowledge!
                </p>
                <Link href="/exams">
                  <Button variant="primary" size="sm" className="font-semibold mt-2">
                    Start a Quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-xs divide-y divide-border/60">
                {recentAttempts.map((attempt) => {
                  const attemptDate = new Date(attempt.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <div
                      key={attempt.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-surface/40 transition-colors"
                    >
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-foreground truncate max-w-full">
                            {attempt.quizTitle}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                              attempt.completed
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {attempt.completed ? "Completed" : "In Progress"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {attemptDate} · Time: {Math.floor(attempt.timeTakenSec / 60)}m {attempt.timeTakenSec % 60}s
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 w-full sm:w-auto shrink-0 border-t sm:border-t-0 border-border/40 pt-2.5 sm:pt-0">
                        {attempt.completed ? (
                          <div className="text-left sm:text-right">
                            <span
                              className={`text-base font-bold ${
                                attempt.scorePercentage >= 80
                                  ? "text-success"
                                  : attempt.scorePercentage >= 50
                                  ? "text-warning"
                                  : "text-danger"
                              }`}
                            >
                              {Math.round(attempt.scorePercentage)}%
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {attempt.correctCount} correct
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            Unfinished
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {attempt.completed ? (
                            <Link href={`/quiz/results/${attempt.id}`}>
                              <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
                                Review AI Breakdown
                              </Button>
                            </Link>
                          ) : (
                            <Link href={`/quiz/${attempt.quizId}`}>
                              <Button variant="primary" size="sm" className="h-8 text-xs font-semibold gap-1">
                                <span>Resume</span>
                                <ArrowRight className="h-3 w-3" />
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: DATA TRANSPARENCY & USER DATA RECORDED */}
      {activeTab === "user-data" && (
        <div className="flex flex-col gap-8">
          {/* Header description */}
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex flex-col gap-2">
            <h2 className="text-lg font-bold text-foreground m-0 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span>Full Data Transparency · What Quizzer Records From You</span>
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed m-0">
              Quizzer is built on a principle of complete transparency. Below is an exhaustive breakdown of every data entity and column currently stored in our PostgreSQL database for your account ({user.id}). We do not track your device across websites, and we never monetize your data.
            </p>
          </div>

          {/* Stored Counts Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Connected Accounts</span>
              <span className="text-2xl font-bold text-foreground">{recordedData.connectedAccounts.length || 1}</span>
              <span className="text-xs text-muted-foreground">
                {recordedData.connectedAccounts.map((a) => a.provider).join(", ") || "Email Credentials"}
              </span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Quiz Attempts Logged</span>
              <span className="text-2xl font-bold text-primary">{recordedData.totalStoredAttempts}</span>
              <span className="text-xs text-muted-foreground">Times you started or finished a test</span>
            </div>

            <div className="bg-card border border-border/80 rounded-xl p-5 shadow-xs flex flex-col gap-1">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Question Responses Saved</span>
              <span className="text-2xl font-bold text-info">{recordedData.totalStoredAnswers}</span>
              <span className="text-xs text-muted-foreground">Individual selected answer choices</span>
            </div>
          </div>

          {/* Database Schema & Purposes Table */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-foreground m-0">
              Data Categories, Recorded Fields, & Why They Are Collected
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recordedData.purposes.map((purpose, idx) => (
                <div key={idx} className="bg-card border border-border/80 rounded-xl p-5 shadow-xs flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                      {purpose.category}
                    </span>
                    <span className="text-[11px] text-muted-foreground">{purpose.retention}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {purpose.fields.map((field) => (
                      <code key={field} className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface border border-border/60 text-foreground">
                        {field}
                      </code>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed m-0 pt-1">
                    {purpose.purpose}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Raw Account Record Inspection */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xs flex flex-col gap-3">
            <h3 className="text-sm font-bold text-foreground m-0 flex items-center gap-2">
              <Database className="h-4 w-4 text-primary" />
              <span>Your Current User Record in Quizzer</span>
            </h3>
            <p className="text-xs text-muted-foreground m-0">
              Direct representation of your record stored in the <code className="font-mono text-primary">User</code> database model:
            </p>
            <pre className="p-4 rounded-xl bg-surface/80 border border-border/60 text-xs font-mono text-foreground overflow-x-auto m-0">
              {JSON.stringify(recordedData.userRecord, null, 2)}
            </pre>
          </div>

          {/* Export and Deletion Controls */}
          <div className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col gap-4">
            <h3 className="text-base font-bold text-foreground m-0">Data Portability & Deletion Rights</h3>
            <p className="text-xs text-muted-foreground leading-relaxed m-0">
              You maintain full sovereignty over your educational data. You can download a complete JSON archive of all your attempts and answers, or permanently purge your attempt history.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="primary"
                onClick={handleExportData}
                className="gap-2 font-semibold text-xs shadow-xs"
              >
                <Download className="h-4 w-4" />
                <span>Export My Data (JSON)</span>
              </Button>

              {!showClearConfirm ? (
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(true)}
                  className="gap-2 font-semibold text-xs text-danger hover:bg-danger/10 border-danger/30"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Clear All Quiz History</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-danger/10 border border-danger/30">
                  <span className="text-xs text-danger font-medium">Are you sure? This action cannot be undone.</span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={handleClearHistory}
                    disabled={clearingHistory}
                    className="h-7 text-xs font-semibold"
                  >
                    {clearingHistory ? <Spinner size="sm" /> : "Confirm Delete"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                    className="h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-border/60 text-xs text-muted-foreground flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-success" />
              <span>Need full account erasure? Review our comprehensive </span>
              <Link href="/data-privacy" className="text-primary hover:underline font-semibold">
                Data Privacy & Erasure Guide
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
