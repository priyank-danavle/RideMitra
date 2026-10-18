import React from 'react';
import { Hero } from '../components/Hero';
import { FeatureHighlights } from '../components/FeatureHighlights';
import { CommuteSections } from '../components/CommuteSections';
import { HowItWorks } from '../components/HowItWorks';
import { SafetyBanner } from '../components/SafetyBanner';

export const HomePage: React.FC = () => {
  return (
    <main id="main-content">
      <Hero />
      <FeatureHighlights />
      <CommuteSections />
      <HowItWorks />
      <SafetyBanner />
    </main>
  );
};
