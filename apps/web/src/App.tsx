import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FeatureHighlights } from './components/FeatureHighlights';
import { CommuteSections } from './components/CommuteSections';
import { HowItWorks } from './components/HowItWorks';
import { SafetyBanner } from './components/SafetyBanner';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main id="main-content">
        <Hero />
        <FeatureHighlights />
        <CommuteSections />
        <HowItWorks />
        <SafetyBanner />
      </main>
      <Footer />
    </div>
  );
};

export default App;
