import React, { useState, useEffect, useCallback } from 'react';
import GreetingWidget from '../components/elderly/GreetingWidget.jsx';
import NextMedicationHero from '../components/elderly/NextMedicationHero.jsx';
import MedicationScheduleWidget from '../components/elderly/MedicationScheduleWidget.jsx';
import DoctorAppointmentWidget from '../components/elderly/DoctorAppointmentWidget.jsx';
import WellnessCheckInWidget from '../components/elderly/WellnessCheckInWidget.jsx';
import EmergencyShortcutWidget from '../components/elderly/EmergencyShortcutWidget.jsx';
import RecentActivityWidget from '../components/elderly/RecentActivityWidget.jsx';
import Loader from '../components/feedback/Loader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import * as elderlyService from '../services/elderlyDashboard.service.js';

export const ElderlyDashboard = ({ onOpenEmergencyModal }) => {
  const { success, info } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [isUltraAccessible, setIsUltraAccessible] = useState(() => {
    return localStorage.getItem('carecircle_ultra_accessible') === 'true';
  });

  const loadData = useCallback(async () => {
    try {
      const data = await elderlyService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading elderly dashboard data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleUltraAccessible = () => {
    setIsUltraAccessible((prev) => {
      const next = !prev;
      localStorage.setItem('carecircle_ultra_accessible', String(next));
      return next;
    });
  };

  const handleConfirmTaken = async (medId) => {
    const updated = await elderlyService.confirmMedicationTaken(medId);
    setDashboardData({ ...updated });
    success(
      'Pill Marked as Taken! ⭐',
      `Good job, ${dashboardData?.profile?.preferredName || 'Eleanor'}! Your family circle has been notified.`
    );
  };

  const handleSnooze = async (medId) => {
    const { snoozeStr, med } = await elderlyService.snoozeMedication(medId, 15);
    await loadData();
    info(
      'Reminder Snoozed ⏰',
      `We will remind you again at ${snoozeStr} to take your ${med?.name || 'medication'}.`
    );
  };

  const handleFeelingSelect = async (feeling) => {
    const updatedWellness = await elderlyService.recordWellnessCheckIn(feeling);
    setDashboardData((prev) => ({
      ...prev,
      wellness: updatedWellness,
    }));
  };

  const handleDrinkWater = async () => {
    const glasses = await elderlyService.logWaterIntake();
    setDashboardData((prev) => ({
      ...prev,
      wellness: {
        ...prev.wellness,
        waterGlasses: glasses,
      },
    }));
    success('Hydration Logged! 💧', `Great job! You have logged ${glasses} glasses of water today.`);
  };

  if (loading || !dashboardData) {
    return <Loader size="lg" text="Loading your personal care dashboard..." />;
  }

  // Find currently due medication or the next upcoming one
  const nextMedication =
    dashboardData.medications.find((m) => m.status === 'due') ||
    dashboardData.medications.find((m) => m.status === 'upcoming');

  return (
    <div
      className={`
        max-w-5xl mx-auto space-y-8 pb-16
        ${isUltraAccessible ? 'text-lg' : ''}
      `}
    >
      {/* 1. Greeting & 2. Today's Date & Clock & Audio Briefing */}
      <GreetingWidget
        name={dashboardData.profile.preferredName || dashboardData.profile.name}
        avatar={dashboardData.profile.avatar}
        room={dashboardData.profile.room}
        isUltraAccessible={isUltraAccessible}
        onToggleUltraAccessible={toggleUltraAccessible}
      />

      {/* 3. Next Medication Reminder Hero */}
      <NextMedicationHero
        medication={nextMedication}
        onConfirmTaken={handleConfirmTaken}
        onSnooze={handleSnooze}
        isUltraAccessible={isUltraAccessible}
      />

      {/* 4. Today's Medication Schedule (Pill Box) */}
      <MedicationScheduleWidget
        medications={dashboardData.medications}
        onConfirmTaken={handleConfirmTaken}
        isUltraAccessible={isUltraAccessible}
      />

      {/* 5. Upcoming Doctor Appointment */}
      <DoctorAppointmentWidget
        appointment={dashboardData.upcomingAppointment}
        isUltraAccessible={isUltraAccessible}
      />

      {/* 6. Daily Wellness Check-in */}
      <WellnessCheckInWidget
        wellness={dashboardData.wellness}
        onFeelingSelect={handleFeelingSelect}
        onDrinkWater={handleDrinkWater}
        isUltraAccessible={isUltraAccessible}
      />

      {/* 7. Emergency Contact Shortcut */}
      <EmergencyShortcutWidget
        contacts={dashboardData.emergencyContacts}
        onOpenEmergencyModal={onOpenEmergencyModal}
        isUltraAccessible={isUltraAccessible}
      />

      {/* 8. Recent Care Activity */}
      <RecentActivityWidget
        activities={dashboardData.recentActivities}
        isUltraAccessible={isUltraAccessible}
      />
    </div>
  );
};

export default ElderlyDashboard;
