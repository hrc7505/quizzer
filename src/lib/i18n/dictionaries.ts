/**
 * Multi-language dictionaries for English, Gujarati, and Hindi.
 */

export type SupportedLanguage = "en" | "gu" | "hi";

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeLabel: string;
  glyph: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", label: "English", nativeLabel: "English", glyph: "A" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી", glyph: "અ" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी", glyph: "अ" },
];

export const dictionaries = {
  en: {
    // Navigation & Common
    appName: "Quizzer",
    explore: "Explore",
    exams: "Exams",
    topics: "Topics",
    quizzes: "Quizzes",
    admin: "Admin",
    search: "Search...",
    signIn: "Sign In",
    signOut: "Sign Out",
    language: "Language",
    difficulty: "Difficulty",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    all: "All",

    // Quiz Taker UI
    question: "Question",
    of: "of",
    needHint: "Need a Hint?",
    hideHint: "Hide Hint",
    hintLabel: "Hint:",
    nextQuestion: "Next Question →",
    viewResults: "View Results",
    submitting: "Submitting...",
    completing: "Completing...",
    answerExplanation: "Answer Explanation",
    matchPairs: "Match Pairs",
    statements: "Statements",
    items: "Items",
    matches: "Matches",
    diagram: "Question Diagram",
    enlarge: "Enlarge",

    // Callout & Badges
    correctAnswer: "Correct Answer",
    yourAnswer: "Your Answer",
    explanation: "Explanation",
    correct: "Correct",
    incorrect: "Incorrect",

    // Detailed Review & Accordion
    detailedReview: "Detailed Question Review",
    generateDeepDive: "Generate Deep Dive",
    viewDeepDive: "View Deep Dive",
    openFullPage: "Open Full Page",
    generating: "Generating...",

    // Results & Scorecard
    quizCompleted: "Quiz Completed!",
    score: "Your Score",
    accuracy: "Accuracy",
    timeSpent: "Time Spent",
    retakeQuiz: "Retake Quiz",
    reviewAnswers: "Review Answers",
    backToTopics: "Back to Topics",
    shareResults: "Share Results",
    leaderboard: "Leaderboard",
    rank: "Rank",
    user: "User",
  },

  gu: {
    // Navigation & Common
    appName: "ક્વિઝર",
    explore: "અન્વેષણ",
    exams: "પરીક્ષાઓ",
    topics: "વિષયો",
    quizzes: "ક્વિઝ",
    admin: "એડમિન",
    search: "શોધો...",
    signIn: "સાઇન ઇન",
    signOut: "સાઇન આઉટ",
    language: "ભાષા",
    difficulty: "સ્તર",
    easy: "સરળ",
    medium: "મધ્યમ",
    hard: "કઠિન",
    all: "બધા",

    // Quiz Taker UI
    question: "પ્રશ્ન",
    of: "માંથી",
    needHint: "સંકેત જોઈએ છે?",
    hideHint: "સંકેત છુપાવો",
    hintLabel: "સંકેત:",
    nextQuestion: "આગળનો પ્રશ્ન →",
    viewResults: "પરિણામ જુઓ",
    submitting: "સબમિટ થઈ રહ્યું છે...",
    completing: "પૂર્ણ થઈ રહ્યું છે...",
    answerExplanation: "જવાબની સમજૂતી",
    matchPairs: "જોડકાં જોડો",
    statements: "વિધાનો",
    items: "બાબતો",
    matches: "જોડકાં",
    diagram: "પ્રશ્નની આકૃતિ",
    enlarge: "મોટું કરો",

    // Callout & Badges
    correctAnswer: "સાચો જવાબ",
    yourAnswer: "તમારો જવાબ",
    explanation: "સમજૂતી",
    correct: "સાચું",
    incorrect: "ખોટું",

    // Detailed Review & Accordion
    detailedReview: "પ્રશ્નોની વિગતવાર સમીક્ષા",
    generateDeepDive: "ઊંડાણપૂર્વક સમજૂતી જનરેટ કરો",
    viewDeepDive: "વિગતવાર ઊંડાણપૂર્વક જુઓ",
    openFullPage: "સંપૂર્ણ પૃષ્ઠ ખોલો",
    generating: "જનરેટ થઈ રહ્યું છે...",

    // Results & Scorecard
    quizCompleted: "ક્વિઝ પૂર્ણ થઈ ગઈ!",
    score: "તમારો સ્કોર",
    accuracy: "ચોકસાઈ",
    timeSpent: "લીધેલ સમય",
    retakeQuiz: "ફરીથી ક્વિઝ આપો",
    reviewAnswers: "જવાબોની સમીક્ષા કરો",
    backToTopics: "વિષયો પર પાછા જાઓ",
    shareResults: "પરિણામ શેર કરો",
    leaderboard: "લીડરબોર્ડ",
    rank: "ક્રમ",
    user: "વપરાશકર્તા",
  },

  hi: {
    // Navigation & Common
    appName: "क्विज़र",
    explore: "खोजें",
    exams: "परीक्षाएं",
    topics: "विषय",
    quizzes: "क्विज़",
    admin: "एडमिन",
    search: "खोजें...",
    signIn: "साइन इन",
    signOut: "साइन आउट",
    language: "भाषा",
    difficulty: "कठिनाई स्तर",
    easy: "सरल",
    medium: "मध्यम",
    hard: "कठिन",
    all: "सभी",

    // Quiz Taker UI
    question: "प्रश्न",
    of: "में से",
    needHint: "संकेत चाहिए?",
    hideHint: "संकेत छिपाएं",
    hintLabel: "संकेत:",
    nextQuestion: "अगला प्रश्न →",
    viewResults: "परिणाम देखें",
    submitting: "सबमिट हो रहा है...",
    completing: "पूर्ण हो रहा है...",
    answerExplanation: "उत्तर की व्याख्या",
    matchPairs: "जोड़े मिलाएं",
    statements: "कथन",
    items: "मदें",
    matches: "सुमेल",
    diagram: "प्रश्न का चित्र",
    enlarge: "बड़ा करें",

    // Callout & Badges
    correctAnswer: "सही उत्तर",
    yourAnswer: "आपका उत्तर",
    explanation: "व्याख्या",
    correct: "सही",
    incorrect: "गलत",

    // Detailed Review & Accordion
    detailedReview: "प्रश्नों की विस्तृत समीक्षा",
    generateDeepDive: "विस्तृत व्याख्या तैयार करें",
    viewDeepDive: "विस्तृत व्याख्या देखें",
    openFullPage: "पूरा पेज खोलें",
    generating: "तैयार हो रहा है...",

    // Results & Scorecard
    quizCompleted: "क्विज़ पूरी हो गई!",
    score: "आपका स्कोर",
    accuracy: "सटीकता",
    timeSpent: "लगा समय",
    retakeQuiz: "क्विज़ दोबारा दें",
    reviewAnswers: "उत्तरों की समीक्षा करें",
    backToTopics: "विषयों पर वापस जाएं",
    shareResults: "परिणाम साझा करें",
    leaderboard: "लीडरबोर्ड",
    rank: "रैंक",
    user: "उपयोगकर्ता",
  },
} as const;

export type TranslationKey = keyof typeof dictionaries.en;
