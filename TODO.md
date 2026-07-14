# Lint Fix Plan (pnpm lint)

## Step 1 — React effect rule fixes (no lint rule disabling)
- [ ] Fix `components/providers/Providers.tsx` (remove `setMounted(true)` inside `useEffect`)
- [ ] Fix `components/ui/QuizManager.tsx` (effect calling `loadQuizDetails` / state sync pattern)
- [ ] Fix `components/ui/TaxonomyManager.tsx` (effect calling `fetchData`, `loadQuizDetails`, and pagination safety effect)
- [ ] Fix `components/ui/TopicList.tsx` (effect calling `setVisibleCount`)

## Step 2 — Strict typing (`@typescript-eslint/no-explicit-any`)
- [ ] Replace `any` with real types or `unknown` + guards in:
  - `components/ui/AdminUsersManager.tsx`
  - `components/ui/GenerateQuizForm.tsx`
  - `components/ui/NavBar.tsx`
  - `components/ui/QuizResults.tsx`
  - `components/ui/QuizWizard.tsx`
  - `components/ui/SignInForm.tsx`
  - `components/ui/TaxonomyManager.tsx` (remaining spots)

## Step 3 — JSX unescaped entities
- [ ] Fix unescaped `"` in:
  - `components/ui/AdminQuizQuestionsManager.tsx`
  - `components/ui/DeepDivesLibrary.tsx`
  - `components/ui/QuizManager.tsx`
  - `components/ui/TaxonomyManager.tsx`

## Step 4 — Verify
- [ ] Run `pnpm lint`
- [ ] Run `pnpm build` (optional but recommended)

