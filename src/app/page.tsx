import type { Metadata } from "next";
import { LandingNav } from "@/components/landing/Nav";
import { Hero } from "@/components/landing/Hero";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LandingFooter } from "@/components/landing/Footer";
import { TimelineVisual, FocusVisual, SyncVisual } from "@/components/landing/Visuals";

export const metadata: Metadata = {
  title: "Flow — Your time, beautifully organized.",
  description: "Calm, all-in-one time management. Calendar, notes, and focus in one app.",
};

export default function LandingPage() {
  return (
    <>
      {/* Preload the very first frame so it paints before JS runs */}
      <link rel="preload" as="image" href="/frames/frame_01.jpg" />
      <main className="relative bg-bg-primary">
        <LandingNav />
        <Hero />

        <div id="features" className="relative">
          <FeatureSection
            label="TIMELINE"
            heading="Everything on one timeline."
            body="See your day unfold. Drag to reschedule. Tap to focus. Your time, in view."
            visual={<TimelineVisual />}
          />
          <Divider />
          <FeatureSection
            label="FOCUS"
            heading="Deep work, protected."
            body="Start a session. The world fades. Only what matters remains."
            visual={<FocusVisual />}
            reverse
          />
          <Divider />
          <FeatureSection
            label="SYNCED"
            heading="Wherever you are."
            body="Write on your laptop. See it on your phone. Instantly."
            visual={<SyncVisual />}
          />
        </div>

        <FinalCTA />
        <LandingFooter />
      </main>
    </>
  );
}

function Divider() {
  return (
    <div className="flex justify-center py-4" aria-hidden>
      <div className="h-px w-32" style={{ background: "var(--separator)", opacity: 0.4 }} />
    </div>
  );
}
