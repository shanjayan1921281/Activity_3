import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
        <GraduationCap className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">404 - Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-sm">
        The requested placement portal resource does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </Link>
    </div>
  );
};
