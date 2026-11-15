import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const CalendarView = ({
  appointments = [],
  selectedDate,
  onSelectDate,
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate || new Date());

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthDays = new Date(year, month, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (onSelectDate) onSelectDate(today);
  };

  // Group appointments by date string YYYY-MM-DD
  const appointmentsByDate = {};
  for (const appt of appointments) {
    if (!appt.appointmentDate) continue;
    const dateKey = new Date(appt.appointmentDate).toISOString().split('T')[0];
    if (!appointmentsByDate[dateKey]) {
      appointmentsByDate[dateKey] = [];
    }
    appointmentsByDate[dateKey].push(appt);
  }

  const isSameDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  const today = new Date();

  // Generate grid days
  const calendarCells = [];

  // Previous month trailing days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = prevMonthDays - i;
    calendarCells.push({
      date: new Date(year, month - 1, dayNum),
      dayNum,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push({
      date: new Date(year, month, day),
      dayNum: day,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete full grid (multiple of 7)
  const remainingCells = 42 - calendarCells.length;
  for (let day = 1; day <= (remainingCells >= 7 ? remainingCells - 7 : remainingCells); day++) {
    calendarCells.push({
      date: new Date(year, month + 1, day),
      dayNum: day,
      isCurrentMonth: false,
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-teal-700" />
          <h2 className="text-base font-bold text-slate-900">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToday}
            className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Today
          </button>
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors border-l border-slate-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays row */}
      <div className="grid grid-cols-7 text-center text-xs font-semibold text-slate-400 py-1 border-b border-slate-100">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          const isSelected = selectedDate && isSameDay(cell.date, selectedDate);
          const isCurrentToday = isSameDay(cell.date, today);
          const dateKey = cell.date.toISOString().split('T')[0];
          const dayAppts = appointmentsByDate[dateKey] || [];

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate && onSelectDate(cell.date)}
              className={`
                min-h-[64px] p-1.5 rounded-xl flex flex-col justify-between items-start transition-all text-left relative group
                ${
                  isSelected
                    ? 'bg-teal-50 border-2 border-teal-600 ring-2 ring-teal-100'
                    : cell.isCurrentMonth
                    ? 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                    : 'text-slate-300 hover:bg-slate-50/50'
                }
              `}
            >
              <div className="flex items-center justify-between w-full">
                <span
                  className={`
                    w-6 h-6 flex items-center justify-center text-xs rounded-full font-medium
                    ${
                      isCurrentToday
                        ? 'bg-teal-700 text-white font-bold'
                        : isSelected
                        ? 'font-bold text-teal-900'
                        : cell.isCurrentMonth
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }
                  `}
                >
                  {cell.dayNum}
                </span>

                {dayAppts.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-teal-600" />
                )}
              </div>

              {/* Mini appointment tags inside cell */}
              <div className="w-full space-y-0.5 mt-1 overflow-hidden">
                {dayAppts.slice(0, 2).map((appt) => (
                  <div
                    key={appt._id || appt.id}
                    className="truncate text-[10px] font-semibold px-1 py-0.5 rounded bg-teal-100/70 text-teal-800 leading-tight"
                    title={`${appt.doctorName} (${appt.timeStr || appt.appointmentTime})`}
                  >
                    {appt.doctorName.replace('Dr. ', '')}
                  </div>
                ))}
                {dayAppts.length > 2 && (
                  <span className="text-[9px] font-bold text-slate-400 pl-1">
                    +{dayAppts.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarView;
