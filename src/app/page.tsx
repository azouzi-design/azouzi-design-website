import { AboutSection } from "@/components/sections/about-section";
import { ContactSection } from "@/components/sections/contact-section";
import { ProjectsSection } from "@/components/sections/projects-section";
import { ServicesSection } from "@/components/sections/services-section";
import { GlobalNav } from "@/components/global-nav";
import { ProjectSelectionProvider } from "@/lib/project-selection";

export default function Home() {
  return (
    <ProjectSelectionProvider>
      <GlobalNav />
      <main className="h-svh snap-y snap-mandatory overflow-y-auto">
        <AboutSection />
        <ProjectsSection />
        <ServicesSection />
        <ContactSection />
      </main>
    </ProjectSelectionProvider>
  );
}
