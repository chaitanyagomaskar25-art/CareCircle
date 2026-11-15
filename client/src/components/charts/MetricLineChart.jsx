import React, { useState } from 'react';

/**
 * Reusable SVG Line & Trend Chart for Health Biometrics.
 *
 * Compliance:
 * - Plots only genuine recorded measurements; does NOT invent missing measurements.
 * - Clearly renders points with verification badges (manual vs verified medical).
 */
export const MetricLineChart = ({
  measurements = [],
  metricType = 'blood_pressure',
  unit = '',
  height = 240,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState(null);

  if (!measurements || measurements.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center p-8 bg-slate-50/70 border border-dashed border-slate-200 rounded-2xl text-slate-400"
        style={{ height }}
      >
        <p className="text-sm font-medium">No recorded measurements for this time period.</p>
        <p className="text-xs text-slate-400 mt-1">
          Measurements are never artificially invented or guessed.
        </p>
      </div>
    );
  }

  const isBloodPressure = metricType === 'blood_pressure';

  // Extract dates and values
  const parsedPoints = measurements
    .map((m) => {
      const time = new Date(m.recordedAt).getTime();
      return {
        ...m,
        time,
        systolic: m.systolic ?? (isBloodPressure ? m.numericValue : null),
        diastolic: m.diastolic ?? null,
        val: typeof m.numericValue === 'number' ? m.numericValue : parseFloat(m.value),
      };
    })
    .filter((m) => !isNaN(m.time))
    .sort((a, b) => a.time - b.time);

  if (parsedPoints.length === 0) {
    return (
      <div
        className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl text-slate-400"
        style={{ height }}
      >
        <p className="text-sm">No valid numeric measurements found.</p>
      </div>
    );
  }

  // Dimensions
  const padding = { top: 25, right: 35, bottom: 35, left: 45 };
  const width = 640;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Domain calculations
  const minTime = parsedPoints[0].time;
  const maxTime = parsedPoints[parsedPoints.length - 1].time;
  const timeSpan = maxTime === minTime ? 1 : maxTime - minTime;

  let minY = 0;
  let maxY = 100;

  if (isBloodPressure) {
    const allVals = parsedPoints.flatMap((p) => [p.systolic, p.diastolic]).filter((v) => v !== null && !isNaN(v));
    const rawMin = Math.min(...allVals, 60);
    const rawMax = Math.max(...allVals, 140);
    minY = Math.max(0, Math.floor(rawMin - 10));
    maxY = Math.ceil(rawMax + 10);
  } else {
    const allVals = parsedPoints.map((p) => p.val).filter((v) => !isNaN(v));
    const rawMin = Math.min(...allVals);
    const rawMax = Math.max(...allVals);
    const pad = (rawMax - rawMin) * 0.15 || 5;
    minY = Math.max(0, Math.floor(rawMin - pad));
    maxY = Math.ceil(rawMax + pad);
  }

  const ySpan = maxY === minY ? 1 : maxY - minY;

  const getX = (time) => {
    if (parsedPoints.length === 1) return padding.left + innerWidth / 2;
    return padding.left + ((time - minTime) / timeSpan) * innerWidth;
  };

  const getY = (val) => {
    return padding.top + innerHeight - ((val - minY) / ySpan) * innerHeight;
  };

  // Generate paths
  const formatPath = (points, key) => {
    const valid = points.filter((p) => p[key] !== null && !isNaN(p[key]));
    if (valid.length === 0) return '';
    return valid.reduce((acc, p, i) => {
      const x = getX(p.time);
      const y = getY(p[key]);
      return `${acc} ${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }, '');
  };

  const pathSys = isBloodPressure ? formatPath(parsedPoints, 'systolic') : '';
  const pathDia = isBloodPressure ? formatPath(parsedPoints, 'diastolic') : '';
  const pathSingle = !isBloodPressure ? formatPath(parsedPoints, 'val') : '';

  // Y-axis grid ticks
  const tickCount = 4;
  const yTicks = Array.from({ length: tickCount + 1 }).map((_, i) => {
    return Math.round(minY + (i / tickCount) * ySpan);
  });

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible font-sans"
      >
        <defs>
          <linearGradient id="sysGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="singleGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {yTicks.map((val) => {
          const y = getY(val);
          return (
            <g key={`ytick-${val}`}>
              <line
                x1={padding.left}
                y1={y}
                x2={padding.left + innerWidth}
                y2={y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={padding.left - 8}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-medium"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {parsedPoints.map((p, idx) => {
          // Avoid overlapping labels
          if (parsedPoints.length > 8 && idx % 2 !== 0 && idx !== parsedPoints.length - 1) {
            return null;
          }
          const x = getX(p.time);
          const dateStr = new Date(p.time).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          });
          return (
            <text
              key={`x-${p._id || idx}`}
              x={x}
              y={height - 10}
              textAnchor="middle"
              className="text-[10px] fill-slate-500 font-medium"
            >
              {dateStr}
            </text>
          );
        })}

        {/* Paths */}
        {isBloodPressure ? (
          <>
            {/* Systolic Line */}
            <path
              d={pathSys}
              fill="none"
              stroke="#6366f1"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Diastolic Line */}
            <path
              d={pathDia}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        ) : (
          <path
            d={pathSingle}
            fill="none"
            stroke="#0284c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Point Markers */}
        {parsedPoints.map((p) => {
          const x = getX(p.time);
          const isManual = p.recordSource === 'manual';

          if (isBloodPressure) {
            const ySys = getY(p.systolic);
            const yDia = getY(p.diastolic);
            return (
              <g key={`pt-${p._id}`}>
                {/* Connecting bar between systolic and diastolic for this reading */}
                <line
                  x1={x}
                  y1={ySys}
                  x2={x}
                  y2={yDia}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {/* Systolic Circle */}
                <circle
                  cx={x}
                  cy={ySys}
                  r={hoveredPoint?._id === p._id ? 6 : 4}
                  fill={isManual ? '#6366f1' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                {/* Diastolic Circle */}
                <circle
                  cx={x}
                  cy={yDia}
                  r={hoveredPoint?._id === p._id ? 6 : 4}
                  fill={isManual ? '#06b6d4' : '#10b981'}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              </g>
            );
          }

          const y = getY(p.val);
          return (
            <g key={`pt-${p._id}`}>
              <circle
                cx={x}
                cy={y}
                r={hoveredPoint?._id === p._id ? 6 : 4.5}
                fill={isManual ? '#0284c7' : '#10b981'}
                stroke="#ffffff"
                strokeWidth="2"
                className="cursor-pointer transition-all"
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Interactive Tooltip Card */}
      {hoveredPoint && (
        <div className="absolute top-2 right-4 bg-white/95 backdrop-blur-sm border border-slate-200 shadow-lg rounded-xl p-3 text-xs pointer-events-none transition-all z-10 space-y-1 max-w-xs">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-slate-900 text-sm">
              {hoveredPoint.value} {hoveredPoint.unit || unit}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                hoveredPoint.recordSource === 'verified_medical'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {hoveredPoint.recordSource === 'verified_medical'
                ? '✓ Verified Medical'
                : '✍ Manually Recorded'}
            </span>
          </div>
          <p className="text-slate-500 text-[11px]">
            {new Date(hoveredPoint.recordedAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="text-slate-600 text-[11px]">
            Recorded by: <span className="font-semibold text-slate-800">{hoveredPoint.recordedBy?.name || 'Caregiver'}</span>
          </p>
          {hoveredPoint.notes && (
            <p className="text-slate-500 italic text-[11px] pt-1 border-t border-slate-100">
              "{hoveredPoint.notes}"
            </p>
          )}
        </div>
      )}

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 px-2 text-xs text-slate-500 border-t border-slate-100">
        <div className="flex items-center gap-4">
          {isBloodPressure ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="font-medium text-slate-700">Systolic (Top)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="font-medium text-slate-700">Diastolic (Bottom)</span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-600" />
              <span className="font-medium text-slate-700">{metricType.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Manual Record</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Verified Medical</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricLineChart;
