import * as React from 'react';
import { Card } from './common/Card';
import { getShowcaseLocales } from '../config/eac';
import { CarbonProjectType } from '../types';
import { useI18n } from '../config/i18n';

const projectTypeIcons: Record<string, string> = {
  blue_carbon: '🌊',
  conservation: '🦁',
  agroforestry: '🌿',
  reforestation: '🌳',
  renewable_energy: '☀️',
  soil_carbon: '🌱',
  afforestation: '🌲',
  other: '🌍',
};

const showcaseProjects = [
  {
    id: 'showcase-znz-jozani',
    name: 'Uhifadhi wa Msitu wa Jozani',
    location: 'Unguja Kusini, Zanzibar',
    type: 'conservation' as CarbonProjectType,
    areaHectares: 5000,
    rate: 8,
    description: 'Uhifadhi na urejeshaji wa msitu wa mvuli wa Jozani, makazi ya Colobus mwekundu wa Zanzibar.',
    sdg: ['Life on Land', 'Climate Action', 'Biodiversity Conservation'],
  },
  {
    id: 'showcase-znz-mangroves',
    name: 'Urejeshaji wa Mikoko ya Zanzibar',
    location: 'Pemba Kaskazini, Zanzibar',
    type: 'blue_carbon' as CarbonProjectType,
    areaHectares: 12000,
    rate: 7,
    description: 'Mradi mkubwa wa urejeshaji wa mikoko kuzunguka kisiwa cha Pemba na Unguja kwa ajili ya kaboni ya buluu.',
    sdg: ['Life Below Water', 'Climate Action', 'Sustainable Communities'],
  },
  {
    id: 'showcase-znz-seaweed',
    name: 'Kilimo Endelevu cha Mwani',
    location: 'Pemba Kusini, Zanzibar',
    type: 'blue_carbon' as CarbonProjectType,
    areaHectares: 3000,
    rate: 5,
    description: 'Kuwawezesha wanawake katika jamii za pwani kupitia kilimo cha mwani kinachochangia ufyonzaji wa kaboni ya buluu.',
    sdg: ['Gender Equality', 'Life Below Water', 'Climate Action'],
  },
  {
    id: 'showcase-znz-solar',
    name: 'Nishati ya Jua Zanzibar',
    location: 'Mjini Magharibi, Zanzibar',
    type: 'renewable_energy' as CarbonProjectType,
    areaHectares: 500,
    rate: 4,
    description: 'Ufungaji wa paneli za jua katika vijiji vya Zanzibar kupunguza utegemezi wa mkaa na kuokoa misitu.',
    sdg: ['Affordable and Clean Energy', 'Climate Action', 'Innovation'],
  },
];

const showcaseStats = [
  { labelKey: 'zanzibar.stats.forestCover', valueKey: 'zanzibar.stats.forestCover.value', icon: '🌴' },
  { labelKey: 'zanzibar.stats.coralReefs', valueKey: 'zanzibar.stats.coralReefs.value', icon: '🪸' },
  { labelKey: 'zanzibar.stats.marineSpecies', valueKey: 'zanzibar.stats.marineSpecies.value', icon: '🐠' },
  { labelKey: 'zanzibar.stats.carbonPotential', valueKey: 'zanzibar.stats.carbonPotential.value', icon: '🌿' },
];

export const ZanzibarShowcase: React.FC = () => {
  const { t } = useI18n();
  const locales = getShowcaseLocales();

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-green-900 via-brand-green-800 to-blue-900 text-white">
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 800 400" className="w-full h-full">
            <path d="M0 200 Q 200 100 400 200 T 800 200" stroke="white" strokeWidth="2" fill="none" opacity="0.3"/>
            <path d="M0 250 Q 200 150 400 250 T 800 250" stroke="white" strokeWidth="2" fill="none" opacity="0.2"/>
            <circle cx="150" cy="150" r="60" stroke="white" strokeWidth="1" fill="none" opacity="0.1"/>
            <circle cx="650" cy="200" r="80" stroke="white" strokeWidth="1" fill="none" opacity="0.1"/>
          </svg>
        </div>
        <div className="relative p-8 md:p-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-4xl">🇹🇿</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">{t('zanzibar.title')}</h1>
              <p className="text-brand-green-200 text-sm md:text-base mt-1">{t('zanzibar.country')} · East African Community</p>
            </div>
          </div>
          <p className="max-w-3xl text-brand-green-100 text-base md:text-lg leading-relaxed">
            {t('zanzibar.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {showcaseStats.map(stat => (
          <Card key={stat.labelKey}>
            <div className="p-4 text-center">
              <span className="text-3xl block mb-2">{stat.icon}</span>
              <p className="text-2xl font-bold text-brand-green-700">{t(stat.valueKey)}</p>
              <p className="text-xs text-slate-500 mt-1">{t(stat.labelKey)}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Locales Map */}
      <Card>
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">{t('zanzibar.projects')}</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {locales.map(locale => (
              <div key={locale.id} className="p-4 border border-slate-200 rounded-lg bg-slate-50 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">📍</span>
                  <h3 className="font-bold text-slate-700 text-sm">{locale.name}</h3>
                </div>
                {locale.showcaseDescription && (
                  <p className="text-xs text-slate-600 mb-3">{locale.showcaseDescription}</p>
                )}
                <div className="space-y-1 text-xs text-slate-500">
                  <p><span className="font-semibold">Biodiversity:</span> {locale.biodiversityZones?.join(', ')}</p>
                  <p><span className="font-semibold">Carbon types:</span> {locale.carbonProjectTypes?.map(t => projectTypeIcons[t] || '🌍').join(' ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Featured Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showcaseProjects.map(project => (
          <Card key={project.id}>
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl flex-shrink-0">{projectTypeIcons[project.type] || '🌍'}</span>
                <div>
                  <h3 className="font-bold text-slate-800">{project.name}</h3>
                  <p className="text-xs text-slate-500">{project.location}</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 mb-4">{project.description}</p>
              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div>
                  <span className="text-xs text-slate-500">{t('carbon.project.area')}</span>
                  <p className="font-semibold">{project.areaHectares.toLocaleString()} ha</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">{t('carbon.project.rate')}</span>
                  <p className="font-semibold">{project.rate} tCO₂/ha/yr</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Type</span>
                  <p className="font-semibold capitalize">{project.type.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {project.sdg.map(s => (
                  <span key={s} className="px-2 py-0.5 text-xs bg-brand-green-100 text-brand-green-800 rounded-full">{s}</span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center p-8 bg-gradient-to-r from-brand-green-50 to-blue-50 rounded-2xl border border-brand-green-200">
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Jiunge na Uhifadhi wa Zanzibar</h2>
        <p className="text-slate-600 max-w-2xl mx-auto mb-6">
          Zanzibar ina fursa za kipekee za kaboni ya buluu, uhifadhi wa bayoanuwai, na maendeleo endelevu.
          Sajili mradi wako wa kaboni leo na uwe sehemu ya mabadiliko.
        </p>
        <p className="text-sm text-slate-500">
          🇹🇿 Tanzania · 🇰🇪 Kenya · 🇺🇬 Uganda · 🇷🇼 Rwanda · 🇧🇮 Burundi · 🇨🇩 DR Congo · 🇸🇸 South Sudan · 🇸🇴 Somalia
        </p>
      </div>
    </div>
  );
};
