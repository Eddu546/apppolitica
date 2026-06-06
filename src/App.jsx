import React from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import SearchResultsPage from '@/pages/SearchResultsPage';
import PoliticianProfilePage from '@/pages/PoliticianProfilePage';
import SenatorProfilePage from '@/pages/SenatorProfilePage';
import DnaPoliticoPage from '@/pages/DnaPoliticoPage';
import AboutPage from '@/pages/AboutPage';
import RoadmapPage from '@/pages/RoadmapPage';
import DeputadosPage from '@/pages/DeputadosPage';
import ComparisonPage from '@/pages/ComparisonPage';
import SenadoresPage from '@/pages/SenadoresPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import CorrectionPage from '@/pages/CorrectionPage';
import AdminCorrectionsPage from '@/pages/AdminCorrectionsPage';
import ValidatedMetricsPage from '@/pages/ValidatedMetricsPage';
import RankingsPage from '@/pages/RankingsPage';
import AttentionPointsPage from '@/pages/AttentionPointsPage';
import MajorAgendasPage from '@/pages/MajorAgendasPage';
import AgendaDetailPage from '@/pages/AgendaDetailPage';

function App() {
  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-gray-50">
        <Helmet>
          <title>FISCALIZA - Transparência Política</title>
          <meta name="description" content="Plataforma de transparência política." />
        </Helmet>

        <Header />

        <main className="flex-grow">
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
            <Route path="/comparar" element={<ComparisonPage />} />
            <Route path="/corrigir" element={<CorrectionPage />} />
            <Route path="/dados-validados" element={<ValidatedMetricsPage />} />
            <Route path="/admin" element={<AdminCorrectionsPage />} />
          </Routes>
        </main>

        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
