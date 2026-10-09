import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './i18n/LanguageContext';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';

// Public Sections
import { HeroSection } from './components/public/HeroSection';
import { GlobalNetworkFlow } from './components/public/GlobalNetworkFlow';
import { WhyLifexSection } from './components/public/WhyLifexSection';
import { ServicesGrid } from './components/public/ServicesGrid';
import { AiIntelligenceSection } from './components/public/AiIntelligenceSection';
import { DevicesOverviewSection } from './components/public/DevicesOverviewSection';
import { EmergencySection } from './components/public/EmergencySection';
import { FaqSection } from './components/public/FaqSection';
import { ContactSection } from './components/public/ContactSection';

// Portals
import { PatientPortal } from './components/portals/PatientPortal';
import { DoctorPortal } from './components/portals/DoctorPortal';
import { HospitalPortal } from './components/portals/HospitalPortal';
import { LaboratoryPortal } from './components/portals/LaboratoryPortal';
import { PharmacyPortal } from './components/portals/PharmacyPortal';
import { PrivacyCenterPortal } from './components/portals/PrivacyCenterPortal';
import { AdminPortal } from './components/portals/AdminPortal';
import { GlobalSearchModal } from './components/portals/GlobalSearchModal';
import { AuthModal } from './components/portals/AuthModal';

// Preserved Existing Specialized Modules
import OrganizationsUnit from './components/OrganizationsUnit';
import WomenHealthUnit from './components/WomenHealthUnit';
import { authService } from './services/authService';

const AppContent: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [session, setSession] = useState(authService.getSession());

  useEffect(() => {
    return authService.subscribe((s) => setSession(s));
  }, []);

  const handlePortalSelect = (portalId: string) => {
    if (portalId === 'homecare' || portalId === 'rehab' || portalId === 'mental_health' || portalId === 'nutrition' || portalId === 'preventive' || portalId === 'hie') {
      setActiveView('patient');
    } else {
      setActiveView(portalId);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        activeView={activeView}
        setActiveView={(v) => {
          setActiveView(v);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main View Router */}
      <main className="min-h-[calc(100vh-250px)]">
        {activeView === 'home' && (
          <div className="space-y-4">
            <HeroSection
              onStart={() => handlePortalSelect('patient')}
              onExplore={() => {
                const el = document.getElementById('network');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onLogin={() => setIsAuthOpen(true)}
              onServices={() => {
                const el = document.getElementById('services');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onEmergency={() => handlePortalSelect('emergency')}
            />

            <GlobalNetworkFlow />
            <WhyLifexSection />
            <ServicesGrid onSelectPortal={handlePortalSelect} />
            <AiIntelligenceSection />
            <DevicesOverviewSection />
            <EmergencySection />
            <FaqSection />
            <ContactSection />
          </div>
        )}

        {/* Individual Portal Views */}
        {activeView !== 'home' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            {/* Quick Breadcrumb back to Home */}
            <div className="mb-6 flex items-center justify-between">
              <button
                onClick={() => setActiveView('home')}
                className="text-xs font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition cursor-pointer"
              >
                <span>← العودة إلى الصفحة الرئيسية</span>
              </button>

              <span className="text-xs text-slate-400 font-mono">
                Active Context: {activeView.toUpperCase()}
              </span>
            </div>

            {activeView === 'network' && <GlobalNetworkFlow />}
            {activeView === 'ai' && <AiIntelligenceSection />}
            {activeView === 'devices' && <DevicesOverviewSection />}
            {activeView === 'emergency' && <EmergencySection />}
            {activeView === 'patient' && <PatientPortal />}
            {activeView === 'doctor' && <DoctorPortal />}
            {activeView === 'hospital' && <HospitalPortal />}
            {activeView === 'lab' && <LaboratoryPortal />}
            {activeView === 'pharmacy' && <PharmacyPortal />}
            {activeView === 'privacy' && <PrivacyCenterPortal />}
            {activeView === 'admin' && <AdminPortal />}

            {/* Preserved Units */}
            {activeView === 'organizations' && <OrganizationsUnit />}
            {activeView === 'women_health' && <WomenHealthUnit />}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectResult={(cat) => handlePortalSelect(cat)}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={() => {
          // Keep current view or switch to patient
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
