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
import ScrollToTop from '@/components/ScrollToTop'; // <-- ADICIONE ESTA LINHA DE IMPORTAÇÃO

function App() {
  return (
    <Router>
      <ScrollToTop /> {/* <-- ADICIONE O COMPONENTE AQUI */}
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Helmet>
          <title>Fiscaliza, MBL! - Transparência Política</title>
          {/* ... (o resto das suas tags meta) ... */}
        </Helmet>
        
        <Header />
        
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/search" element={<SearchResultsPage />} />
            <Route path="/politico/:tipo/:id" element={<PoliticianProfilePage />} />
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