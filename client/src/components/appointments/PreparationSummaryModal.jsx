import React, { useState, useEffect } from 'react';
import {
  Printer,
  FileText,
  Calendar,
  Clock,
  MapPin,
  Pill,
  Activity,
  HelpCircle,
  Phone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  X,
} from 'lucide-react';
import Modal from '../common/Modal.jsx';
import Button from '../common/Button.jsx';
import { getPreparationSummary } from '../../services/appointment.service.js';

export const PreparationSummaryModal = ({ isOpen, onClose, appointmentId }) => {
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState(null);

  useEffect(() => {
    if (isOpen && appointmentId) {
      loadSummary();
    }
  }, [isOpen, appointmentId]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await getPreparationSummary(appointmentId);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load preparation summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const appt = summaryData?.appointment || {};
  const resident = summaryData?.resident || {};
  const meds = summaryData?.activeMedications || [];
  const vitals = summaryData?.recentObservations || [];
  const questions = appt?.questionsForDoctor || [];
  const contacts = summaryData?.careContacts || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Doctor Visit Preparation Summary"
      maxWidth="max-w-3xl"
    >
      {/* Print CSS styles to guarantee clean printable PDF output */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-prep-summary, #printable-prep-summary * {
            visibility: visible;
          }
          #printable-prep-summary {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 24px;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 text-teal-700 animate-spin" />
          <span>Generating clinical preparation summary...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Action Toolbar (Hidden during printing) */}
          <div className="no-print flex items-center justify-between p-3 rounded-2xl bg-teal-50 border border-teal-200 text-xs">
            <div className="flex items-center gap-2 text-teal-900 font-medium">
              <ShieldCheck className="w-4 h-4 text-teal-700" />
              <span>
                Authorized preparation brief ready for medical consultation.
              </span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 shadow-sm bg-teal-700 hover:bg-teal-800"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </Button>
          </div>

          {/* Printable Document Container */}
          <div
            id="printable-prep-summary"
            className="p-6 bg-white rounded-2xl border border-slate-200 space-y-6 text-slate-800 text-xs"
          >
            {/* Document Header */}
            <div className="flex items-start justify-between pb-4 border-b-2 border-teal-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-lg bg-teal-700 text-white flex items-center justify-center font-bold text-sm">
                    CC
                  </span>
                  <h1 className="text-xl font-bold tracking-tight text-slate-900">
                    CareCircle Clinical Visit Summary
                  </h1>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Comprehensive patient preparation brief for attending physician
                </p>
              </div>

              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">{resident.name || 'Elderly Resident'}</p>
                <p className="text-[11px] text-slate-500">
                  Room/Suite: {resident.roomNumber || 'Private Suite'}
                </p>
                <p className="text-[10px] text-slate-400">
                  Brief Generated: {new Date(summaryData?.generatedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Section 1: Appointment & Consultation Details */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-teal-700" />
                Consultation Details
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Physician</span>
                  <p className="font-bold text-slate-900">{appt.doctorName}</p>
                  <p className="text-slate-500">{appt.specialty}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Location</span>
                  <p className="font-bold text-slate-900">{appt.hospitalName || appt.clinicName}</p>
                  <p className="text-slate-500">{appt.location || 'Main Clinic'}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Date & Time</span>
                  <p className="font-bold text-slate-900">
                    {new Date(appt.appointmentDate).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-500">
                    {appt.timeStr || appt.appointmentTime} ({appt.durationMinutes} mins)
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase">Format</span>
                  <p className="font-bold text-teal-800">
                    {appt.isTelehealth ? 'Online Telehealth Video' : 'In-Person Consultation'}
                  </p>
                </div>
              </div>

              {appt.reason && (
                <div className="pt-2 border-t border-slate-200/60">
                  <span className="font-bold text-slate-700">Primary Goal / Reason: </span>
                  <span className="text-slate-600">{appt.reason}</span>
                </div>
              )}
            </div>

            {/* Section 2: Active Authorized Prescriptions */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-700" />
                Active Authorized Medications ({meds.length})
              </h2>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold">
                      <th className="p-2.5">Medication</th>
                      <th className="p-2.5">Dosage</th>
                      <th className="p-2.5">Frequency</th>
                      <th className="p-2.5">Scheduled Times</th>
                      <th className="p-2.5">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {meds.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 font-bold text-slate-900">{med.medicineName}</td>
                        <td className="p-2.5 text-slate-700">{med.dosage}</td>
                        <td className="p-2.5 text-slate-600 capitalize">{med.frequency}</td>
                        <td className="p-2.5 text-slate-600">
                          {med.scheduledTimes?.join(', ') || 'As needed'}
                        </td>
                        <td className="p-2.5 text-slate-500 italic">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Recent Health Observations & Vitals */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-teal-700" />
                Recent Health Vitals (Last 14 Days)
              </h2>

              {vitals.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {vitals.slice(0, 6).map((obs, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{obs.title}</span>
                        <span className="text-[10px] font-bold uppercase text-emerald-700">
                          {obs.severity}
                        </span>
                      </div>
                      <p className="text-base font-bold text-slate-900">
                        {obs.value} <span className="text-xs font-normal text-slate-500">{obs.unit}</span>
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(obs.recordedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        • By {obs.recordedBy?.name || 'Caregiver'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-3 rounded-xl bg-slate-50 text-slate-500 italic">
                  No vital logs recorded during the last 14 days.
                </p>
              )}
            </div>

            {/* Section 4: Family-Provided Questions for Physician */}
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-teal-700" />
                Family & Care Circle Questions for Doctor ({questions.length})
              </h2>

              {questions.length > 0 ? (
                <div className="space-y-2">
                  {questions.map((q, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-teal-50/50 border border-teal-200/80 flex items-start gap-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-bold text-slate-900 text-xs">{q.question}</p>
                        <p className="text-[11px] text-slate-400">
                          Contributed by {q.addedByName || 'Family Member'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="p-3 rounded-xl bg-slate-50 text-slate-500 italic">
                  No questions prepared by family members.
                </p>
              )}
            </div>

            {/* Section 5: Care Circle Emergency Contacts */}
            <div className="pt-3 border-t border-slate-200 text-slate-500 text-[11px] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-slate-700">Care Contacts:</span>
                {contacts.map((c, idx) => (
                  <span key={idx}>
                    {c.name} ({c.relationship}): {c.phone}
                  </span>
                ))}
              </div>
              <div>CareCircle Platform Verified Brief</div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default PreparationSummaryModal;
