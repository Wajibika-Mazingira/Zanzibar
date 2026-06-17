import * as React from 'react';
import { useI18n } from '../config/i18n';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 flex-shrink-0">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-slate-500">
        <p>
          &copy; {currentYear} Wajibika Mazingira &mdash; minima PiNet OS {t('footer.by')}{' '}
          <a
            href="https://github.com/WilliamMajanja"
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-green-600 hover:text-brand-green-800 font-medium"
          >
            William Majanja
          </a>
        </p>
        <p className="text-xs text-slate-400">
          {t('footer.tagline')}
        </p>
      </div>
    </footer>
  );
};
