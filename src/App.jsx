import React, { Suspense, lazy } from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import AppErrorBoundary from '@/components/AppErrorBoundary';
import Footer from '@/components/Footer';
import Header from '@/components/Header';
import PageLoader from '@/components/PageLoader';
import RouteEffects from '@/components/RouteEffects';
import { Toaster } from '@/components/ui/toaster';

const HomePage = lazy(() => import('@/pages/HomePage'));
const SearchResultsPage = lazy(() => import('@/pages/SearchResultsPage'));
const PoliticianProfilePage = lazy(() => import('@/pages/PoliticianProfilePage'));
const SenatorProfilePage = lazy(() => import('@/pages/SenatorProfilePage'));
const DnaPoliticoPage = lazy(() => import('@/pages/DnaPoliticoPage'));
const AboutPage = lazy(() => import('@/pages/AboutPage'));
const RoadmapPage = lazy(() => import('@/pages/RoadmapPage'));
const SupportPage = lazy(() => import('@/pages/SupportPage'));
const DeputadosPage = lazy(() => import('@/pages/DeputadosPage'));
const ComparisonPage = lazy(() => import('@/pages/ComparisonPage'));
const SenadoresPage = lazy(() => import('@/pages/SenadoresPage'));
const AnalyticsPage = lazy(() => import('@/pages/AnalyticsPage'));
const CorrectionPage = lazy(() => import('@/pages/CorrectionPage'));
const AdminCorrectionsPage = lazy(() => import('@/pages/AdminCorrectionsPage'));
const ValidatedMetricsPage = lazy(() => import('@/pages/ValidatedMetricsPage'));
const RankingsPage = lazy(() => import('@/pages/RankingsPage'));
const AttentionPointsPage = lazy(() => import('@/pages/AttentionPointsPage'));
const MajorAgendasPage = lazy(() => import('@/pages/MajorAgendasPage'));
const AgendaDetailPage = lazy(() => import('@/pages/AgendaDetailPage'));
const SystemHealthPage = lazy(() => import('@/pages/SystemHealthPage'));
const SourceDetailPage = lazy(() => import('@/pages/SourceDetailPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchResultsPage />} />
      <Route path="/politico/:id" element={<PoliticianProfilePage />} />
      <Route path="/senador/:id" element={<SenatorProfilePage />} />
      <Route path="/deputados" element={<DeputadosPage />} />
      <Route path="/senadores" element={<SenadoresPage />} />
      <Route path="/estatisticas" element={<AnalyticsPage />} />
      <Route path="/analytics" element={<AnalyticsPage />} />
      <Route path="/rankings" element={<RankingsPage />} />
      <Route path="/alertas" element={<AttentionPointsPage />} />
      <Route path="/pautas" element={<MajorAgendasPage />} />
      <Route path="/pauta/:slug" element={<AgendaDetailPage />} />
      <Route path="/pautas/:slug" element={<AgendaDetailPage />} />
      <Route path="/pautas/proposicao/:slug" element={<AgendaDetailPage />} />
      <Route path="/pautas/:type/:number/:year" element={<AgendaDetailPage />} />
      <Route path="/meu-roteiro" element={<DnaPoliticoPage />} />
      <Route path="/meu-dna" element={<DnaPoliticoPage />} />
      <Route path="/sobre" element={<AboutPage />} />
      <Route path="/roadmap" element={<RoadmapPage />} />
      <Route path="/apoie" element={<SupportPage />} />
      <Route path="/apoiar" element={<SupportPage />} />
      <Route path="/comparar" element={<ComparisonPage />} />
      <Route path="/corrigir" element={<CorrectionPage />} />
      <Route path="/dados-validados" element={<ValidatedMetricsPage />} />
      <Route path="/admin" element={<AdminCorrectionsPage />} />
      <Route path="/saude" element={<SystemHealthPage />} />
      <Route path="/status" element={<SystemHealthPage />} />
      <Route path="/fonte/deputado/:deputyId/:dataset/:year" element={<SourceDetailPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
);

function App() {
  return (
    <AppErrorBoundary>
      <Router>
        <div className="flex min-h-screen flex-col bg-gray-50">
          <Helmet>
            <title>FISCALIZA - Transparência Política</title>
            <meta name="description" content="Fiscalização parlamentar com dados oficiais, fonte visível e linguagem simples." />
          </Helmet>

          <a href="#conteudo-principal" className="sr-only z-[100] bg-yellow-400 px-4 py-3 font-bold text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
            Ir para o conteúdo
          </a>
          <RouteEffects />
          <Header />
          <main id="conteudo-principal" tabIndex="-1" className="flex-grow outline-none">
            <AppRoutes />
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </AppErrorBoundary>
  );
}

export default App;
