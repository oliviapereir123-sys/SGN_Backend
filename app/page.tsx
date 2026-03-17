import { HeroSection } from "@/components/landing/hero-section"
import { AboutSection } from "@/components/landing/about-section"
import { BenefitsSection } from "@/components/landing/benefits-section"
import { StatsSection } from "@/components/landing/stats-section"
import { CoursesSection } from "@/components/landing/courses-section"
import { CTASection } from "@/components/landing/cta-section"
import { Footer } from "@/components/landing/footer"
import { Header } from "@/components/landing/header"
import { AdminModal } from "@/components/landing/admin-modal"

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <AboutSection />
      <CoursesSection />
      <StatsSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
      <AdminModal />
    </main>
  )
}
