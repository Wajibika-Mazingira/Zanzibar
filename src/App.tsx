import * as React from 'react';
import { Header } from './components/Header';
import { LoadingSpinner } from './components/common/LoadingSpinner';
// Lazy-load page components to reduce initial bundle size
const CarbonPassportComponent = React.lazy(() => import('./components/CarbonPassport').then(m => ({ default: m.CarbonPassportComponent })));
const AssessmentGenerator = React.lazy(() => import('./components/AssessmentGenerator').then(m => ({ default: m.AssessmentGenerator })));
const CommunityChat = React.lazy(() => import('./components/CommunityChat').then(m => ({ default: m.CommunityChat })));
const EvidenceLocker = React.lazy(() => import('./components/EvidenceLocker').then(m => ({ default: m.EvidenceLocker })));
const CarbonDashboard = React.lazy(() => import('./components/CarbonDashboard').then(m => ({ default: m.CarbonDashboard })));
const CarbonMarket = React.lazy(() => import('./components/CarbonMarket').then(m => ({ default: m.CarbonMarket })));
const GovernancePortal = React.lazy(() => import('./components/GovernancePortal').then(m => ({ default: m.GovernancePortal })));
const ZanzibarShowcase = React.lazy(() => import('./components/ZanzibarShowcase').then(m => ({ default: m.ZanzibarShowcase })));
import { Footer } from './components/Footer';
import { Page } from './types';
import { ToastsProvider } from './hooks/useToasts';
import { ToastContainer } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { PiAuthProvider } from './contexts/PiAuthContext';
import { AiProviderContext } from './contexts/AiProviderContext';
import { I18nProvider } from './config/i18n';

const pageComponents: Record<Page, React.ComponentType<any>> = {
  passport: CarbonPassportComponent,
  assessment: AssessmentGenerator,
  chat: CommunityChat,
  locker: EvidenceLocker,
  carbon: CarbonDashboard,
  market: CarbonMarket,
  governance: GovernancePortal,
  zanzibar: ZanzibarShowcase,
};

function App() {
  const [activePage, setActivePage] = React.useState<Page>('assessment');
  const PageComponent = pageComponents[activePage];

  return (
    <PiAuthProvider>
      <AiProviderContext>
      <ToastsProvider>
      <I18nProvider>
          <div className="bg-slate-100 min-h-screen font-sans text-slate-800 flex flex-col">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-brand-green-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
              Skip to main content
            </a>
            <Header activePage={activePage} setActivePage={setActivePage} />
            <main id="main-content" className="flex-1 container mx-auto p-4 sm:p-6 lg:p-8">
              <ErrorBoundary key={activePage}>
                <React.Suspense fallback={<LoadingSpinner />}> 
                  <PageComponent />
                </React.Suspense>
              </ErrorBoundary>
            </main>
            <Footer />
            <ToastContainer />
          </div>
      </I18nProvider>
      </ToastsProvider>
      </AiProviderContext>
    </PiAuthProvider>
  );
}

export default App;
