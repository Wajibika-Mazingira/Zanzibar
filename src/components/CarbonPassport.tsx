import * as React from 'react';
import { Card } from './common/Card';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useToasts } from '../hooks/useToasts';
import { useI18n } from '../config/i18n';
import {
  CarbonPassport, SensorType, CarbonProject,
} from '../types';

const sensorLabels: Record<SensorType, { icon: string; label: string; unit: string }> = {
  acoustic: { icon: '🎤', label: 'Acoustic', unit: 'dB' },
  visual: { icon: '📷', label: 'Visual', unit: 'index' },
  salinity: { icon: '🧂', label: 'Salinity', unit: 'ppt' },
  water_level: { icon: '📏', label: 'Water Level', unit: 'm' },
  biomass: { icon: '🌿', label: 'Biomass', unit: 'kg/m²' },
  weather: { icon: '🌤️', label: 'Weather', unit: '°C' },
  gps: { icon: '📍', label: 'GPS', unit: 'coord' },
  water_quality: { icon: '💧', label: 'Water Quality', unit: 'pH' },
};

const statusColor: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  archived: 'bg-slate-100 text-slate-600',
  calibrated: 'bg-green-100 text-green-800',
  expired: 'bg-red-100 text-red-800',
  verified: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
};

const eventIcons: Record<string, string> = {
  restoration: '🌱',
  degradation: '⚠️',
  monitoring: '📡',
  verification: '✅',
  intervention: '🛠️',
};

function generateMockPassport(projects: CarbonProject[]): CarbonPassport | null {
  if (projects.length === 0) return null;
  const project = projects[0];
  return {
    id: `CP-${Date.now().toString(36).toUpperCase()}`,
    projectId: project.id,
    projectName: project.name,
    ecosystemLocation: project.location,
    boundary: [
      { latitude: -1.2921, longitude: 36.8219 },
      { latitude: -1.3021, longitude: 36.8319 },
      { latitude: -1.3121, longitude: 36.8119 },
      { latitude: -1.2821, longitude: 36.8019 },
    ],
    device: {
      id: 'VS-001',
      name: 'VEIN Sense Station Alpha',
      firmwareVersion: '2.4.1',
      calibrationStatus: 'calibrated',
      lastCalibration: new Date(Date.now() - 7 * 86400000).toISOString(),
      sensors: ['acoustic', 'visual', 'salinity', 'water_level', 'biomass', 'weather', 'water_quality'],
      location: { latitude: -1.2971, longitude: 36.8169 },
      installedAt: new Date(Date.now() - 90 * 86400000).toISOString(),
      batteryLevel: 87,
    },
    observations: Array.from({ length: 12 }, (_, i) => ({
      id: `obs-${i}`,
      deviceId: 'VS-001',
      sensorType: ['acoustic', 'visual', 'salinity', 'water_level', 'biomass', 'weather'][i % 6] as SensorType,
      timestamp: new Date(Date.now() - (11 - i) * 3600000).toISOString(),
      value: Math.round((20 + Math.random() * 80) * 100) / 100,
      unit: sensorLabels[['acoustic', 'visual', 'salinity', 'water_level', 'biomass', 'weather'][i % 6] as SensorType].unit,
      signature: `sig_${Date.now().toString(36)}_${i}`,
      minAnchoredAt: new Date(Date.now() - (11 - i) * 3600000 + 5000).toISOString(),
      minTxId: `tx_${Date.now().toString(36)}_${i}`,
    })),
    edgeAiOutputs: [
      {
        id: 'ai-1', deviceId: 'VS-001', modelName: 'bioacoustic-classifier-v3',
        inferenceTimestamp: new Date(Date.now() - 3600000).toISOString(),
        result: 'Species detected: 12 bird species, biodiversity index: 0.78',
        confidence: 0.89, metrics: { species_count: 12, biodiversity_index: 0.78, signal_quality: 0.92 },
      },
      {
        id: 'ai-2', deviceId: 'VS-001', modelName: 'biomass-estimator-v2',
        inferenceTimestamp: new Date(Date.now() - 7200000).toISOString(),
        result: 'Above-ground biomass: 45.3 t/ha, Carbon stock: 22.6 tC/ha',
        confidence: 0.85, metrics: { biomass_tpha: 45.3, carbon_tpha: 22.6, canopy_cover: 0.67 },
      },
    ],
    totalSequestered: project.totalTonnesSequestered,
    lastUpdated: new Date().toISOString(),
    events: [
      {
        id: 'evt-1', type: 'monitoring', timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: 'Routine environmental monitoring completed. All sensors operational.',
        actor: 'VEIN Sense Station Alpha', evidenceRefs: ['obs-0', 'obs-1'], minTxId: `tx_${Date.now().toString(36)}_evt1`,
      },
      {
        id: 'evt-2', type: 'verification', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        description: 'Community verification conducted. 5 members verified ecosystem state.',
        actor: 'Kijiji Conservation Group', evidenceRefs: [], minTxId: `tx_${Date.now().toString(36)}_evt2`,
      },
    ],
    verifications: [
      {
        id: 'ver-1', passportId: 'CP-001', verifier: 'Maria Mwangi',
        verifierRole: 'Community Elder', timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        status: 'verified', notes: 'Forest boundary intact. No signs of encroachment.',
        signature: `ver_sig_${Date.now().toString(36)}`,
      },
    ],
    auditTrail: [
      { timestamp: new Date(Date.now() - 90 * 86400000).toISOString(), action: 'Device Installed', actor: 'VEIN Sense Technician', minTxId: `tx_${Date.now().toString(36)}_a0`, details: 'Station Alpha deployed at Kijiji Forest.' },
      { timestamp: new Date(Date.now() - 7 * 86400000).toISOString(), action: 'Calibration', actor: 'System', minTxId: `tx_${Date.now().toString(36)}_a1`, details: 'All sensors calibrated successfully.' },
      { timestamp: new Date(Date.now() - 86400000).toISOString(), action: 'Observation Batch Anchored', actor: 'VEIN Sense Station Alpha', minTxId: `tx_${Date.now().toString(36)}_a2`, details: '12 observations signed and anchored to Minima.' },
    ],
    status: 'active',
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  };
}

export const CarbonPassportComponent: React.FC = () => {
  const [projects] = useLocalStorage<CarbonProject[]>('carbonProjects', []);
  const [passports, setPassports] = useLocalStorage<CarbonPassport[]>('carbonPassports', []);
  const [activePassportId, setActivePassportId] = React.useState<string | null>(null);
  const [showDeviceDetail, setShowDeviceDetail] = React.useState(false);
  const { addToast } = useToasts();
  const { t, language } = useI18n();

  const passport = React.useMemo(() => {
    if (activePassportId) return passports.find(p => p.id === activePassportId) || null;
    return passports[0] || null;
  }, [passports, activePassportId]);

  const handleCreatePassport = () => {
    const mock = generateMockPassport(projects);
    if (!mock) {
      addToast({ type: 'error', message: language === 'sw' ? 'Sajili mradi kwanza.' : 'Register a carbon project first.' });
      return;
    }
    const exists = passports.some(p => p.projectId === mock.projectId);
    if (exists) {
      addToast({ type: 'info', message: language === 'sw' ? 'Pasipoti ipo tayari.' : 'Passport already exists for this project.' });
      return;
    }
    setPassports([mock, ...passports]);
    setActivePassportId(mock.id);
    addToast({ type: 'success', message: language === 'sw' ? 'Pasipoti ya kaboni imeundwa.' : 'Carbon Passport created.' });
  };

  const handleExportPassport = () => {
    if (!passport) return;
    const data = JSON.stringify(passport, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carbon-passport-${passport.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'info', message: language === 'sw' ? 'Pasipoti imesafirishwa.' : 'Passport exported.' });
  };

  const SensorBadge: React.FC<{ type: SensorType }> = ({ type }) => {
    const info = sensorLabels[type];
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
        <span>{info.icon}</span>
        <span>{info.label}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('passport.title')}</h2>
          <p className="text-sm text-slate-500">{t('passport.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleCreatePassport}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-brand-green-600 text-white hover:bg-brand-green-700 focus:outline-none focus:ring-2 focus:ring-brand-green-500">
            {t('passport.create')}
          </button>
          {passport && (
            <button onClick={handleExportPassport}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400">
              {t('passport.export')}
            </button>
          )}
        </div>
      </div>

      {!passport ? (
        <Card>
          <div className="p-12 text-center text-slate-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
            <p className="font-semibold text-lg mb-2">{t('passport.empty.title')}</p>
            <p className="text-sm">{t('passport.empty.desc')}</p>
          </div>
        </Card>
      ) : (
        <>
          {/* Passport Overview */}
          <Card>
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-bold text-slate-800">{passport.projectName}</h3>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[passport.status]}`}>{passport.status}</span>
              </div>
              <span className="text-xs text-slate-400">{t('passport.updated')}: {new Date(passport.lastUpdated).toLocaleDateString()}</span>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.location')}</p>
                <p className="font-semibold text-slate-700">{passport.ecosystemLocation}</p>
                <p className="text-xs text-slate-400">{passport.boundary.length} {t('passport.boundary')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.sequestered')}</p>
                <p className="text-2xl font-bold text-brand-green-700">{Math.round(passport.totalSequestered)} tCO₂</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">{t('passport.created')}</p>
                <p className="font-semibold text-slate-700">{new Date(passport.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          {/* VEIN Sense Device */}
          <Card>
            <button 
              onClick={() => setShowDeviceDetail(!showDeviceDetail)} 
              className="w-full p-4 border-b border-slate-200 flex justify-between items-center hover:bg-slate-50 transition-colors"
              aria-expanded={showDeviceDetail}
              aria-controls="device-details-content"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔬</span>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800">{passport.device.name}</h3>
                  <p className="text-xs text-slate-500">{t('passport.deviceId')}: {passport.device.id} · FW {passport.device.firmwareVersion}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[passport.device.calibrationStatus]}`}>{passport.device.calibrationStatus}</span>
                <svg className={`h-5 w-5 text-slate-400 transition-transform ${showDeviceDetail ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
              </div>
            </button>
            {showDeviceDetail && (
              <div id="device-details-content" className="p-4 space-y-4" role="region" aria-labelledby="device-details-title">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.battery')}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full">
                        <div className={`h-2 rounded-full ${passport.device.batteryLevel > 50 ? 'bg-green-500' : passport.device.batteryLevel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${passport.device.batteryLevel}%` }} />
                      </div>
                      <span className="text-sm font-semibold">{passport.device.batteryLevel}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.installed')}</p>
                    <p className="text-sm font-semibold">{new Date(passport.device.installedAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.lastCalibration')}</p>
                    <p className="text-sm font-semibold">{new Date(passport.device.lastCalibration).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{t('passport.coordinates')}</p>
                    <p className="text-sm font-semibold text-xs">{passport.device.location.latitude.toFixed(4)}, {passport.device.location.longitude.toFixed(4)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{t('passport.sensors')}</p>
                  <div className="flex flex-wrap gap-2">
                    {passport.device.sensors.map(s => <SensorBadge key={s} type={s} />)}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Observations */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.observations')}</h3>
              <p className="text-xs text-slate-500">{passport.observations.length} {t('passport.signedReadings')}</p>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
              {passport.observations.slice().reverse().map(obs => {
                const info = sensorLabels[obs.sensorType];
                return (
                  <div key={obs.id} className="p-3 flex justify-between items-center hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{info.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{info.label}</p>
                        <p className="text-xs text-slate-400">{new Date(obs.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{obs.value} {obs.unit}</p>
                      {obs.minTxId && <p className="text-[10px] text-brand-green-600 font-mono">✓ {t('passport.anchored')}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Edge AI Outputs */}
          {passport.edgeAiOutputs.length > 0 && (
            <Card>
              <div className="p-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-800">{t('passport.edgeAi')}</h3>
              </div>
              <div className="divide-y divide-slate-100">
                {passport.edgeAiOutputs.map(ai => (
                  <div key={ai.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-slate-700 text-sm">{ai.modelName}</p>
                        <p className="text-xs text-slate-400">{new Date(ai.inferenceTimestamp).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">{(ai.confidence * 100).toFixed(0)}%</span>
                    </div>
                    <p className="text-sm text-slate-600">{ai.result}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {Object.entries(ai.metrics).map(([k, v]) => (
                        <span key={k} className="text-xs bg-slate-50 px-2 py-0.5 rounded text-slate-600">{k}: {typeof v === 'number' ? v.toFixed(2) : v}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Event Log */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.events')}</h3>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {passport.events.slice().reverse().map(evt => (
                <div key={evt.id} className="p-3 flex items-start gap-3">
                  <span className="text-lg flex-shrink-0 mt-0.5">{eventIcons[evt.type] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-slate-700">{evt.description}</p>
                      <span className="text-xs text-slate-400 flex-shrink-0 ml-2">{new Date(evt.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-slate-500">{evt.actor}</p>
                    {evt.minTxId && <p className="text-[10px] text-brand-green-600 font-mono">✓ {evt.minTxId}</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Community Verification */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.verifications')}</h3>
            </div>
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100">
              {passport.verifications.length === 0 ? (
                <p className="p-4 text-sm text-slate-400 italic">{t('passport.noVerifications')}</p>
              ) : passport.verifications.map(v => (
                <div key={v.id} className="p-3">
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="text-sm font-semibold text-slate-700">{v.verifier}</p>
                      <p className="text-xs text-slate-500">{v.verifierRole}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor[v.status]}`}>{v.status}</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{v.notes}</p>
                  <p className="text-xs text-slate-400 mt-1">{new Date(v.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Audit Trail */}
          <Card>
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800">{t('passport.auditTrail')}</h3>
            </div>
            <div className="max-h-48 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                  <tr>
                    <th className="p-2 text-left">{t('passport.date')}</th>
                    <th className="p-2 text-left">{t('passport.action')}</th>
                    <th className="p-2 text-left">{t('passport.actor')}</th>
                    <th className="p-2 text-left hidden md:table-cell">{t('passport.details')}</th>
                    <th className="p-2 text-left">Tx</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {passport.auditTrail.slice().reverse().map((entry, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="p-2 text-xs text-slate-500 whitespace-nowrap">{new Date(entry.timestamp).toLocaleDateString()}</td>
                      <td className="p-2 font-medium text-slate-700">{entry.action}</td>
                      <td className="p-2 text-xs text-slate-500">{entry.actor}</td>
                      <td className="p-2 text-xs text-slate-500 hidden md:table-cell">{entry.details}</td>
                      <td className="p-2"><span className="text-[10px] text-brand-green-600 font-mono">✓</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
