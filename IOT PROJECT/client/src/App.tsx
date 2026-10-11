import React, { useState, Suspense, lazy } from 'react';
import { HardwareProvider } from './context/HardwareContext';
import { Sidebar, type ViewType } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OfflineBanner } from './components/common/OfflineBanner';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { LoadingSkeleton } from './components/common/LoadingSkeleton';

// Primary immediate page
import { DashboardPage } from './pages/DashboardPage';

// Code-split lazy pages for fast startup and optimized chunking
const LiveTDSMonitorPage = lazy(() => import('./pages/LiveTDSMonitorPage').then(m => ({ default: m.LiveTDSMonitorPage })));
const TDSCheckerPage = lazy(() => import('./pages/TDSCheckerPage').then(m => ({ default: m.TDSCheckerPage })));
const LiveMonitoringPage = lazy(() => import('./pages/LiveMonitoringPage').then(m => ({ default: m.LiveMonitoringPage })));
const WaterAnalysisPage = lazy(() => import('./pages/WaterAnalysisPage').then(m => ({ default: m.WaterAnalysisPage })));
const SensorHistoryPage = lazy(() => import('./pages/SensorHistoryPage').then(m => ({ default: m.SensorHistoryPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })));
const AlertsPage = lazy(() => import('./pages/AlertsPage').then(m => ({ default: m.AlertsPage })));
const HardwarePage = lazy(() => import('./pages/HardwarePage').then(m => ({ default: m.HardwarePage })));
const DevicesPage = lazy(() => import('./pages/DevicesPage').then(m => ({ default: m.DevicesPage })));
const CalibrationPage = lazy(() => import('./pages/CalibrationPage').then(m => ({ default: m.CalibrationPage })));
const DiagnosticsPage = lazy(() => import('./pages/DiagnosticsPage').then(m => ({ default: m.DiagnosticsPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SamplesPage = lazy(() => import('./pages/SamplesPage').then(m => ({ default: m.SamplesPage })));
const AIAnalysisPage = lazy(() => import('./pages/AIAnalysisPage').then(m => ({ default: m.AIAnalysisPage })));
const DataQualityPage = lazy(() => import('./pages/DataQualityPage').then(m => ({ default: m.DataQualityPage })));

const MainContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('tds-checker');

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage onNavigate={(view) => setCurrentView(view)} />;
      case 'live-tds':
        return <LiveTDSMonitorPage />;
      case 'tds-checker':
        return <TDSCheckerPage />;
      case 'live':
        return <LiveMonitoringPage />;
      case 'analysis':
        return <WaterAnalysisPage />;
      case 'history':
        return <SensorHistoryPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'alerts':
        return <AlertsPage />;
      case 'ai-analysis':
        return <AIAnalysisPage />;
      case 'samples':
        return <SamplesPage />;
      case 'data-quality':
        return <DataQualityPage />;
      case 'hardware':
        return <HardwarePage />;
      case 'devices':
        return <DevicesPage />;
      case 'calibration':
        return <CalibrationPage />;
      case 'diagnostics':
        return <DiagnosticsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage onNavigate={(view) => setCurrentView(view)} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-dark-900 text-slate-100 selection:bg-cyan-500 selection:text-dark-900">
      <Sidebar currentView={currentView} onSelectView={(v) => setCurrentView(v)} />
      <div className="flex-1 flex flex-col min-w-0">
        <OfflineBanner />
        <Header />
        <main className="p-6 md:p-8 flex-1 max-w-7xl w-full mx-auto">
          <ErrorBoundary fallbackTitle="Application View Failed to Load">
            <Suspense fallback={<LoadingSkeleton rows={3} height="h-36" className="mt-4" />}>
              {renderView()}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary fallbackTitle="IoT Water Quality Monitoring Platform Encountered an Error">
      <HardwareProvider>
        <MainContent />
      </HardwareProvider>
    </ErrorBoundary>
  );
};

export default App;
