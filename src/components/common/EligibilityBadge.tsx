import React from 'react';
import { CheckCircle, XCircle, AlertCircle, HelpCircle } from 'lucide-react';
import { EligibilityResult } from '../../types';

interface EligibilityBadgeProps {
  eligibility?: EligibilityResult | null;
  showDetailsButton?: boolean;
  onOpenDetails?: () => void;
}

export const EligibilityBadge: React.FC<EligibilityBadgeProps> = ({
  eligibility,
  showDetailsButton = true,
  onOpenDetails,
}) => {
  if (!eligibility) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <HelpCircle className="w-3.5 h-3.5" />
        Check Status
      </span>
    );
  }

  const { isEligible } = eligibility;

  return (
    <div className="inline-flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wide ${
          isEligible
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
        }`}
      >
        {isEligible ? (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Eligible
          </>
        ) : (
          <>
            <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Not Eligible
          </>
        )}
      </span>

      {showDetailsButton && onOpenDetails && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="text-xs font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline underline-offset-2 flex items-center gap-1"
        >
          <AlertCircle className="w-3 h-3" />
          Criteria
        </button>
      )}
    </div>
  );
};
