import React, { useState } from 'react';
import { Activity, Heart, Droplets, Plus, Check } from 'lucide-react';
import Card from '../components/common/Card.jsx';
import Button from '../components/common/Button.jsx';
import Input from '../components/common/Input.jsx';
import StatusBadge from '../components/feedback/StatusBadge.jsx';
import { mockVitals } from '../services/mockData.js';
import { useToast } from '../context/ToastContext.jsx';

export const VitalsView = () => {
  const { success } = useToast();
  const [systolic, setSystolic] = useState('122');
  const [diastolic, setDiastolic] = useState('78');
  const [heartRate, setHeartRate] = useState('72');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogVital = (e) => {
    e.preventDefault();
    setIsLogging(true);
    setTimeout(() => {
      setIsLogging(false);
      success(
        'Vitals Logged Successfully',
        `Blood Pressure ${systolic}/${diastolic} mmHg & Heart Rate ${heartRate} BPM recorded.`
      );
    }, 400);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Health Biometrics & Vitals</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Continuous tracking of blood pressure, heart rate, and glucose levels
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          title="Blood Pressure"
          subtitle="Target: < 130/80 mmHg"
          icon={Heart}
          badge={<StatusBadge status="healthy" label="Optimal" size="sm" />}
        >
          <div className="py-4 text-center">
            <span className="text-4xl font-extrabold text-slate-900">{systolic}/{diastolic}</span>
            <span className="text-xs text-slate-500 block mt-1">mmHg • Recorded 8:30 AM</span>
          </div>
        </Card>

        <Card
          title="Resting Heart Rate"
          subtitle="Target: 60 - 90 BPM"
          icon={Activity}
          badge={<StatusBadge status="healthy" label="Normal" size="sm" />}
        >
          <div className="py-4 text-center">
            <span className="text-4xl font-extrabold text-slate-900">{heartRate}</span>
            <span className="text-xs text-slate-500 block mt-1">BPM • Recorded 8:30 AM</span>
          </div>
        </Card>

        <Card
          title="Fasting Glucose"
          subtitle="Target: 70 - 130 mg/dL"
          icon={Droplets}
          badge={<StatusBadge status="healthy" label="Normal" size="sm" />}
        >
          <div className="py-4 text-center">
            <span className="text-4xl font-extrabold text-slate-900">{mockVitals.bloodSugar.mgDl}</span>
            <span className="text-xs text-slate-500 block mt-1">mg/dL • Recorded 7:45 AM</span>
          </div>
        </Card>
      </div>

      {/* Manual Reading Entry */}
      <Card
        title="Quick Log Biometric Reading"
        subtitle="Record manual readings from resident cuff or monitor"
      >
        <form onSubmit={handleLogVital} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <Input
            label="Systolic (mmHg)"
            value={systolic}
            onChange={(e) => setSystolic(e.target.value)}
            placeholder="120"
            required
          />
          <Input
            label="Diastolic (mmHg)"
            value={diastolic}
            onChange={(e) => setDiastolic(e.target.value)}
            placeholder="80"
            required
          />
          <Button
            type="submit"
            variant="primary"
            icon={Check}
            isLoading={isLogging}
          >
            Save Reading
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default VitalsView;
