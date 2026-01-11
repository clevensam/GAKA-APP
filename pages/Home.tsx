import React from 'react';
import { Hero } from '../components/Hero';
import { RecentFilesSection } from '../components/RecentFilesSection';
import { Services } from '../components/Services';
import { AcademicFile } from '../types';

interface HomeProps {
  recentFiles: (AcademicFile & { moduleCode: string; moduleId: string })[];
  onNavigate: (page: string, params?: any) => void;
}

const HomePage: React.FC<HomeProps> = ({ recentFiles, onNavigate }) => {
  return (
    <div className="animate-fade-in flex flex-col items-center">
      <Hero onNavigate={onNavigate} />
      <RecentFilesSection files={recentFiles} onNavigate={onNavigate} />
      <Services />
    </div>
  );
};

export default HomePage;