import React from 'react';
import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <span>CareCircle Platform</span>
          <span>•</span>
          <span>Production Foundation Established</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Architected with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>for Senior Care, Caregivers & Doctors</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
