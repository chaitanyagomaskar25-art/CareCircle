import React, { useState, useEffect } from 'react';
import {
  Pill,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Edit2,
  Eye,
  Trash2,
  Filter,
  History,
  Award,
  Layers,
} from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import EmptyState from '../components/feedback/EmptyState.jsx';
import MedicationModal from '../components/medications/MedicationModal.jsx';
import MedicationDetailsModal from '../components/medications/MedicationDetailsModal.jsx';
import AdherenceStatsCard from '../components/medications/AdherenceStatsCard.jsx';
import {
  getMedications,
  deleteMedication,
  getMedicationHistory,
} from '../services/medication.service.js';
import { useToast } from '../context/ToastContext.jsx';

export const MedicationsView = ({ onOpenLogModal }) => {
  const { success, warning, error: toastError } = useToast();

  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'history' | 'adherence'
  const [meds, setMeds] = useState([]);
  const [historyDoses, setHistoryDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'low_stock' | 'discontinued'
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [detailsMed, setDetailsMed] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [medsList, histData] = await Promise.all([
        getMedications('user-elderly'),
        getMedicationHistory('user-elderly'),
      ]);
      setMeds(medsList || []);
      setHistoryDoses(histData?.doses || []);
    } catch (err) {
      console.warn('Failed loading medications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAdd = () => {
    setEditingMed(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setIsModalOpen(true);
  };

  const handleOpenDetails = (med) => {
    setDetailsMed(med);
  };

  const handleDiscontinue = async (med) => {
    const medId = med._id || med.id;
    const name = med.medicineName || med.name;
    if (window.confirm(`Are you sure you want to discontinue ${name}? Historical logs will remain preserved.`)) {
      try {
        await deleteMedication(medId);
        warning('Prescription Discontinued', `${name} marked as discontinued.`);
        setDetailsMed(null);
        loadData();
      } catch (err) {
        toastError('Failed', err.message || 'Could not discontinue prescription.');
      }
    }
  };

  const filteredMeds = meds.filter((m) => {
    const name = (m.medicineName || m.name || '').toLowerCase();
    const purpose = (m.purpose || m.description || '').toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = name.includes(query) || purpose.includes(query);

    const isLowStock =
      (m.remainingInventory ?? m.remainingPills ?? 30) <= (m.refillThreshold ?? 7);

    if (!matchesSearch) return false;
    if (statusFilter === 'active') return m.status === 'active';
    if (statusFilter === 'low_stock') return isLowStock && m.status !== 'discontinued';
    if (statusFilter === 'discontinued') return m.status === 'discontinued';
    return true;
  });

  const filteredHistory = historyDoses.filter((d) => {
    if (historyStatusFilter === 'all') return true;
    return d.status === historyStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Medication Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Prescriptions, daily administration history, refill alerts, and compliance tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" icon={Plus} onClick={handleOpenAdd}>
            Add Prescription
          </Button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('prescriptions')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'prescriptions'
              ? 'border-primary-700 text-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Active Prescriptions ({meds.filter((m) => m.status !== 'discontinued').length})
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-primary-700 text-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Dose History Log ({historyDoses.length})
        </button>
        <button
          onClick={() => setActiveTab('adherence')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'adherence'
              ? 'border-primary-700 text-primary-800'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          Adherence Analytics
        </button>
      </div>

      {/* Tab 1: Prescriptions List */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-5">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:max-w-md">
              <Input
                placeholder="Search prescription or purpose (e.g. Lisinopril, Blood Pressure)..."
                icon={Search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'active', label: 'Active' },
                  { id: 'low_stock', label: 'Low Refill Alert' },
                  { id: 'discontinued', label: 'Discontinued' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setStatusFilter(f.id)}
                    className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                      statusFilter === f.id
                        ? 'bg-white text-primary-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Cards Grid */}
          {filteredMeds.length === 0 ? (
            <EmptyState
              title="No medications match your filter"
              description="Try adjusting your search criteria or add a new prescription."
              actionLabel="Add Prescription"
              onAction={handleOpenAdd}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMeds.map((med) => {
                const medId = med._id || med.id;
                const name = med.medicineName || med.name;
                const remaining = med.remainingInventory ?? med.remainingPills ?? 30;
                const threshold = med.refillThreshold ?? 7;
                const isLow = remaining <= threshold && med.status !== 'discontinued';

                return (
                  <Card
                    key={medId}
                    title={name}
                    subtitle={`${med.dosage} • ${med.purpose || med.description || 'Prescription'}`}
                    icon={Pill}
                    badge={
                      <div className="flex items-center gap-1.5">
                        {isLow && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600" />
                            Refill Soon
                          </span>
                        )}
                        <StatusBadge
                          status={med.status === 'discontinued' ? 'inactive' : 'success'}
                          label={med.status === 'discontinued' ? 'Discontinued' : 'Active'}
                          size="sm"
                        />
                      </div>
                    }
                  >
                    <div className="space-y-3.5 text-sm">
                      {/* Instructions */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                        <span className="font-bold text-slate-800">Directions:</span>
                        <p className="text-slate-600 leading-relaxed">{med.instructions}</p>
                      </div>

                      {/* Pill appearance & Times */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-warm-50 rounded-lg">
                          <span className="text-slate-500 block font-medium">Appearance</span>
                          <span className="font-bold text-slate-800 truncate block">
                            {med.pillAppearance || 'Pill / Tablet'}
                          </span>
                        </div>
                        <div className="p-2.5 bg-warm-50 rounded-lg">
                          <span className="text-slate-500 block font-medium">Scheduled Times</span>
                          <span className="font-bold text-primary-800 font-mono">
                            {(med.scheduledTimes || [med.scheduledTime || '08:00']).join(', ')}
                          </span>
                        </div>
                      </div>

                      {/* Inventory Count Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="text-slate-500">Remaining Inventory:</span>
                        <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                          {remaining} pills {isLow && `(Threshold: ${threshold})`}
                        </span>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Eye}
                          onClick={() => handleOpenDetails(med)}
                        >
                          Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={Edit2}
                          onClick={() => handleOpenEdit(med)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Historical Doses Log */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-slate-700">Filter History By Status:</span>
            <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/60 text-xs">
              {[
                { id: 'all', label: 'All Doses' },
                { id: 'taken', label: 'Taken' },
                { id: 'skipped', label: 'Skipped' },
                { id: 'pending', label: 'Pending' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setHistoryStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    historyStatusFilter === f.id
                      ? 'bg-white text-primary-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden shadow-sm">
            {filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No medication dose records found for this criteria.
              </div>
            ) : (
              filteredHistory.map((item, idx) => {
                const med = item.medicationId || {};
                const name = med.medicineName || med.name || 'Prescription Dose';
                const dosage = med.dosage || '';

                return (
                  <div
                    key={item._id || item.id || idx}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          item.status === 'taken'
                            ? 'bg-emerald-100 text-emerald-700'
                            : item.status === 'skipped'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Pill className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{name}</h4>
                          <span className="text-xs text-slate-500 font-medium">{dosage}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          Scheduled: {item.scheduledTimeStr || '08:00'}
                          {item.confirmedAt && (
                            <span className="text-slate-400">
                              • Confirmed at {new Date(item.confirmedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic bg-warm-50 px-2 py-0.5 rounded border border-slate-100 inline-block">
                            "{item.notes}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <StatusBadge
                        status={
                          item.status === 'taken'
                            ? 'success'
                            : item.status === 'skipped'
                            ? 'warning'
                            : 'scheduled'
                        }
                        label={
                          item.status === 'taken'
                            ? 'Taken'
                            : item.status === 'skipped'
                            ? 'Skipped'
                            : 'Pending'
                        }
                        size="sm"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Adherence Analytics */}
      {activeTab === 'adherence' && (
        <div className="space-y-4">
          <AdherenceStatsCard elderlyUserId="user-elderly" />
        </div>
      )}

      {/* Modals */}
      <MedicationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        medication={editingMed}
        onSaved={loadData}
      />

      <MedicationDetailsModal
        isOpen={Boolean(detailsMed)}
        onClose={() => setDetailsMed(null)}
        medication={detailsMed}
        onEdit={(m) => {
          setDetailsMed(null);
          handleOpenEdit(m);
        }}
        onDiscontinue={handleDiscontinue}
      />
    </div>
  );
};

export default MedicationsView;
