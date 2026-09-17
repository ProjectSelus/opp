import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './pages/HomePage';
import { ProblemsPage } from './pages/ProblemsPage';
import { IssueDetailPage } from './pages/IssueDetailPage';
import { FormalAdhesionPage } from './pages/FormalAdhesionPage';
import { NewIssuePage } from './pages/NewIssuePage';
import { TransparencyPage } from './pages/TransparencyPage';
import { AgenciesPage } from './pages/AgenciesPage';
import { ModerationPage } from './pages/ModerationPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { AboutPage } from './pages/AboutPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/problemas" element={<ProblemsPage />} />
            <Route path="/problemas/:id" element={<IssueDetailPage />} />
            <Route path="/problemas/:id/aderir" element={<FormalAdhesionPage />} />
            <Route path="/registrar-problema" element={<NewIssuePage />} />
            <Route path="/como-funciona" element={<HowItWorksPage />} />
            <Route path="/orgaos" element={<AgenciesPage />} />
            <Route path="/transparencia" element={<TransparencyPage />} />
            <Route path="/moderacao" element={<ModerationPage />} />
            <Route path="/sobre" element={<AboutPage />} />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
};
