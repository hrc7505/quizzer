import { PageLayout } from "@/components/layouts/PageLayout";
import { Container } from "@/components/layouts/Container";
import { ProfileView } from "@/features/profile/components/ProfileView";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "User Profile & Recorded Data Transparency · Quizzer",
  description: "View your personal quiz analytics, completed attempts, and inspect the exact user data points Quizzer records from your account.",
};

/**
 * User Profile page providing learning stats, recent quiz history,
 * and comprehensive transparency into recorded user data with export controls.
 */
export default function ProfilePage() {
  return (
    <PageLayout contained={false}>
      <Container className="py-8 sm:py-12">
        <ProfileView />
      </Container>
    </PageLayout>
  );
}
