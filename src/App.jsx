import React from 'react';
import { Helmet } from 'react-helmet';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import HomePage from '@/pages/HomePage';
import SearchResultsPage from '@/pages/SearchResultsPage';
import PoliticianProfilePage from '@/pages/PoliticianProfilePage';
import DnaPoliticoPage from '@/pages/DnaPoliticoPage';
import AboutPage from '@/pages/AboutPage';
import RoadmapPage from '@/pages/RoadmapPage';
import DeputadosPage from '@/pages/DeputadosPage';
import SenadoresPage from '@/pages/SenadoresPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Helmet>
          <title>Fiscaliza, MBL! - Transparência Política</title>
          <meta name="description" content="Plataforma de transparência política do MBL para monitoramento de deputados e senadores brasileiros. Análise de desempenho, gastos e votações." />
          <meta name="keywords" content="mbl, política, transparência, deputados, senadores, brasil, congresso, fiscalização" />
          <meta property="og:title" content="Fiscaliza, MBL! - Transparência Política" />
          <meta property="og:description" content="Monitore as atividades dos políticos federais brasileiros com a ferramenta de fiscalização do MBL." />
          <meta property="og:type" content="website" />
          <meta name="twitter:card" content="summary_large_image" />
        </Helmet>
        
        <Header />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/politico/:id" element={<PoliticianProfilePage />} />
            <Route path="/deputados" element={<DeputadosPage />} />
            <Route path="/senadores" element={<SenadoresPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/meu-dna" element={<DnaPoliticoPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="/roadmap" element={<RoadmapPage />} />
          </Routes>
        </main>
        
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;