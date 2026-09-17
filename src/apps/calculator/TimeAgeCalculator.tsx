/**
 * @file TimeAgeCalculator.tsx
 * @description Time difference, Age calculator, Live countdown, Ethiopian Ge'ez year converter,
 * Date addition/subtraction, and Timesheet Work Hours Calculator.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  Heart, 
  Wind, 
  PartyPopper, 
  Timer, 
  ArrowRight, 
  Plus, 
  Minus, 
  Briefcase,
  Sun,
  Moon,
  Compass,
  RotateCcw
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface TimeAgeCalculatorProps {
  isDarkMode?: boolean;
}

type TabType = 'age' | 'interval' | 'add_sub' | 'work_hours';

export const TimeAgeCalculator: React.FC<TimeAgeCalculatorProps> = ({ isDarkMode = true }) => {
  const [tab, setTab] = useState<TabType>('age');

  // Age Calculator States
  const [birthDate, setBirthDate] = useState<string>('1998-05-15');
  const [birthTime, setBirthTime] = useState<string>('08:30');
  const [now, setNow] = useState<Date>(new Date());

  // Date Difference States
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [includeEndDay, setIncludeEndDay] = useState<boolean>(true);

  // Date Add/Subtract States
  const [baseDate, setBaseDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [addYears, setAddYears] = useState<number>(0);
  const [addMonths, setAddMonths] = useState<number>(3);
  const [addWeeks, setAddWeeks] = useState<number>(0);
  const [addDays, setAddDays] = useState<number>(15);

  // Work Hours States
  const [workStartTime, setWorkStartTime] = useState<string>('08:30');
  const [workEndTime, setWorkEndTime] = useState<string>('17:30');
  const [lunchBreakMins, setLunchBreakMins] = useState<number>(60);
  const [hourlyWage, setHourlyWage] = useState<number>(250);

  // Live ticking clock for real-time age & countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Compute Detailed Age
  const ageDetails = useMemo(() => {
    const bDate = new Date(`${birthDate}T${birthTime || '00:00'}:00`);
    if (isNaN(bDate.getTime())) return null;

    const diffMs = now.getTime() - bDate.getTime();
    if (diffMs < 0) return null;

    const totalSeconds = Math.floor(diffMs / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalWeeks = Math.floor(totalDays / 7);

    // Exact Years, Months, Days calculation
    let years = now.getFullYear() - bDate.getFullYear();
    let months = now.getMonth() - bDate.getMonth();
    let days = now.getDate() - bDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const hours = now.getHours() - bDate.getHours();
    const minutes = now.getMinutes() - bDate.getMinutes();
    const seconds = now.getSeconds() - bDate.getSeconds();

    // Next Birthday Countdown
    let nextBday = new Date(now.getFullYear(), bDate.getMonth(), bDate.getDate());
    if (nextBday.getTime() < now.getTime()) {
      nextBday = new Date(now.getFullYear() + 1, bDate.getMonth(), bDate.getDate());
    }
    const bdayDiffMs = nextBday.getTime() - now.getTime();
    const nextBdayDays = Math.floor(bdayDiffMs / (1000 * 60 * 60 * 24));
    const nextBdayHours = Math.floor((bdayDiffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const nextBdayMinutes = Math.floor((bdayDiffMs % (1000 * 60 * 60)) / (1000 * 60));
    const nextBdaySeconds = Math.floor((bdayDiffMs % (1000 * 60)) / 1000);

    // Day of the week born
    const daysOfWeekAmharic = ['እሁድ (Sunday)', 'ሰኞ (Monday)', 'ማክሰኞ (Tuesday)', 'እሮብ (Wednesday)', 'ሐሙስ (Thursday)', 'አርብ (Friday)', 'ቅዳሜ (Saturday)'];
    const birthDayOfWeek = daysOfWeekAmharic[bDate.getDay()];

    // Approximate Ethiopian Calendar equivalent (approx 7-8 years difference)
    const ethYear = bDate.getFullYear() - 8;

    // Zodiac sign
    const getZodiac = (m: number, d: number) => {
      const zodiacs = [
        { name: 'Capricorn (ሕፃን/አንበሳ)', m: 1, d: 20 },
        { name: 'Aquarius (ደላዊ)', m: 2, d: 19 },
        { name: 'Pisces (ዓሣ)', m: 3, d: 20 },
        { name: 'Aries (ሐመል)', m: 4, d: 20 },
        { name: 'Taurus (ሰውር)', m: 5, d: 21 },
        { name: 'Gemini (ጀውዛ)', m: 6, d: 21 },
        { name: 'Cancer (ሸርጣን)', m: 7, d: 23 },
        { name: 'Leo (አሰድ)', m: 8, d: 23 },
        { name: 'Virgo (ሰንቡላ)', m: 9, d: 23 },
        { name: 'Libra (ሚዛን)', m: 10, d: 23 },
        { name: 'Scorpio (አቅራብ)', m: 11, d: 22 },
        { name: 'Sagittarius (ቀውስ)', m: 12, d: 22 },
        { name: 'Capricorn (ሕፃን)', m: 12, d: 31 },
      ];
      const match = zodiacs.find(z => m < z.m || (m === z.m && d <= z.d));
      return match ? match.name : 'Capricorn';
    };
    const zodiac = getZodiac(bDate.getMonth() + 1, bDate.getDate());

    return {
      years,
      months,
      days,
      hours: Math.abs(hours),
      minutes: Math.abs(minutes),
      seconds: Math.abs(seconds),
      totalDays,
      totalWeeks,
      totalHours,
      totalMinutes,
      totalSeconds,
      nextBdayDays,
      nextBdayHours,
      nextBdayMinutes,
      nextBdaySeconds,
      birthDayOfWeek,
      ethYear,
      zodiac,
      estimatedHeartbeats: totalMinutes * 72,
      estimatedBreaths: totalMinutes * 16,
    };
  }, [birthDate, birthTime, now]);

  // Compute Date Difference
  const intervalResult = useMemo(() => {
    const d1 = new Date(startDate);
    const d2 = new Date(endDate);
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return null;

    const start = d1 < d2 ? d1 : d2;
    const end = d1 < d2 ? d2 : d1;
    const isReversed = d1 > d2;

    let diffMs = end.getTime() - start.getTime();
    let totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (includeEndDay) totalDays += 1;

    // Calculate working days vs weekends
    let workDays = 0;
    let weekendDays = 0;
    const cur = new Date(start);
    const limit = includeEndDay ? totalDays : totalDays - 1;
    for (let i = 0; i < limit; i++) {
      const dayOfWeek = cur.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        weekendDays++;
      } else {
        workDays++;
      }
      cur.setDate(cur.getDate() + 1);
    }

    const weeks = Math.floor(totalDays / 7);
    const remDays = totalDays % 7;

    return {
      totalDays,
      workDays,
      weekendDays,
      weeks,
      remDays,
      isReversed,
      totalHours: totalDays * 24,
      totalMinutes: totalDays * 24 * 60,
    };
  }, [startDate, endDate, includeEndDay]);

  // Compute Date Add / Subtract
  const addSubResult = useMemo(() => {
    const base = new Date(baseDate);
    if (isNaN(base.getTime())) return null;

    const target = new Date(base);
    const mult = operation === 'add' ? 1 : -1;

    target.setFullYear(target.getFullYear() + (addYears * mult));
    target.setMonth(target.getMonth() + (addMonths * mult));
    target.setDate(target.getDate() + ((addWeeks * 7 + addDays) * mult));

    const dayName = target.toLocaleDateString('en-US', { weekday: 'long' });
    const formatted = target.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      formattedDate: formatted,
      dayName,
      iso: target.toISOString().split('T')[0],
    };
  }, [baseDate, operation, addYears, addMonths, addWeeks, addDays]);

  // Compute Work Hours Timesheet
  const workHoursResult = useMemo(() => {
    const [startH, startM] = (workStartTime || '08:00').split(':').map(Number);
    const [endH, endM] = (workEndTime || '17:00').split(':').map(Number);

    let startTotalMins = startH * 60 + startM;
    let endTotalMins = endH * 60 + endM;

    if (endTotalMins < startTotalMins) {
      endTotalMins += 24 * 60; // Overnight shift
    }

    const grossMins = Math.max(0, endTotalMins - startTotalMins);
    const netMins = Math.max(0, grossMins - (lunchBreakMins || 0));
    const netHours = netMins / 60;
    const earnings = netHours * (hourlyWage || 0);

    const hoursPart = Math.floor(netMins / 60);
    const minsPart = netMins % 60;

    return {
      grossHours: (grossMins / 60).toFixed(2),
      netHours: netHours.toFixed(2),
      hoursPart,
      minsPart,
      earnings: earnings.toFixed(2),
    };
  }, [workStartTime, workEndTime, lunchBreakMins, hourlyWage]);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Top Segmented Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-stone-900/60 border border-stone-800">
        <button
          onClick={() => { triggerHaptic('selection'); setTab('age'); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            tab === 'age' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          <PartyPopper className="w-3.5 h-3.5" />
          <span>የእድሜ ማስያ (Age & Countdown)</span>
        </button>

        <button
          onClick={() => { triggerHaptic('selection'); setTab('interval'); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            tab === 'interval' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>የቀናት ልዩነት (Date Difference)</span>
        </button>

        <button
          onClick={() => { triggerHaptic('selection'); setTab('add_sub'); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            tab === 'add_sub' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Timer className="w-3.5 h-3.5" />
          <span>ቀን መደመር/መቀነስ (Add/Subtract)</span>
        </button>

        <button
          onClick={() => { triggerHaptic('selection'); setTab('work_hours'); }}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            tab === 'work_hours' ? 'bg-amber-500 text-stone-950 font-bold shadow-md' : 'text-stone-400 hover:text-white'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>የስራ ሰዓት (Work Hours)</span>
        </button>
      </div>

      {/* TAB 1: Real-time Age & Milestones */}
      {tab === 'age' && (
        <div className="space-y-6">
          {/* Birth Date Picker Header */}
          <div className={`p-5 rounded-3xl border shadow-lg ${
            isDarkMode ? 'bg-[#14100c] border-amber-500/30' : 'bg-white border-amber-300 shadow-sm'
          }`}>
            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
              የልደት ቀንዎን ያስገቡ • Enter Birth Date & Time
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className={`w-full p-3 rounded-xl text-base font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
              <div>
                <input
                  type="time"
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  className={`w-full p-3 rounded-xl text-base font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {ageDetails && (
            <>
              {/* Primary Live Age Counter */}
              <div className={`p-6 rounded-3xl border shadow-xl text-center relative overflow-hidden ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0a0806] border-amber-500/40 shadow-amber-950/40' 
                  : 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border-amber-400/60 shadow-stone-300'
              }`}>
                <span className="px-3 py-1 rounded-full text-xs font-bold font-mono bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                  ትክክለኛ እድሜዎ • Exact Chronological Age
                </span>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 my-6">
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">{ageDetails.years}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ዓመት (Years)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">{ageDetails.months}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ወር (Months)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-amber-400">{ageDetails.days}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ቀን (Days)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">{ageDetails.hours}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ሰዓት (Hours)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-amber-300">{ageDetails.minutes}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ደቂቃ (Mins)</div>
                  </div>
                  <div className="p-3 rounded-2xl bg-black/40 border border-stone-800">
                    <div className="text-3xl sm:text-4xl font-black font-mono text-emerald-400 animate-pulse">{ageDetails.seconds}</div>
                    <div className="text-[11px] font-semibold text-stone-400 uppercase mt-1">ሰከንድ (Secs)</div>
                  </div>
                </div>

                {/* Next Birthday Banner */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 max-w-xl mx-auto flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PartyPopper className="w-5 h-5 text-amber-500" />
                    <div className="text-left">
                      <span className="text-xs font-bold text-stone-200 block">የሚቀጥለው ልደት (Next Birthday)</span>
                      <span className="text-[11px] text-stone-400 font-mono">
                        {ageDetails.nextBdayDays} days, {ageDetails.nextBdayHours}h {ageDetails.nextBdayMinutes}m left
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-amber-500 text-black font-mono">
                    {ageDetails.nextBdayDays} Days
                  </span>
                </div>
              </div>

              {/* Cultural & Life Milestones Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'}`}>
                  <span className="text-stone-400 text-xs font-bold flex items-center gap-1.5">
                    <Compass className="w-4 h-4 text-amber-500" /> የተወለዱበት ቀን (Birth Day)
                  </span>
                  <div className="text-sm font-bold text-white mt-1.5 font-mono">{ageDetails.birthDayOfWeek}</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'}`}>
                  <span className="text-stone-400 text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> ኮከብ (Zodiac Sign)
                  </span>
                  <div className="text-sm font-bold text-amber-400 mt-1.5 font-mono">{ageDetails.zodiac}</div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'}`}>
                  <span className="text-stone-400 text-xs font-bold flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-500" /> የልብ ምቶች (Heartbeats)
                  </span>
                  <div className="text-sm font-bold text-rose-400 mt-1.5 font-mono">
                    ~{new Intl.NumberFormat().format(ageDetails.estimatedHeartbeats)} beats
                  </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'}`}>
                  <span className="text-stone-400 text-xs font-bold flex items-center gap-1.5">
                    <Wind className="w-4 h-4 text-teal-400" /> የተነፈሱት አየር (Breaths)
                  </span>
                  <div className="text-sm font-bold text-teal-300 mt-1.5 font-mono">
                    ~{new Intl.NumberFormat().format(ageDetails.estimatedBreaths)} breaths
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: Date Difference & Working Days */}
      {tab === 'interval' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border shadow-lg ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4">
              የሁለት ቀኖች ልዩነት • Interval Between Two Dates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">መነሻ ቀን (Start Date)</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">መድረሻ ቀን (End Date)</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between pt-3 border-t border-stone-800">
              <label className="text-xs text-stone-300 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeEndDay}
                  onChange={(e) => setIncludeEndDay(e.target.checked)}
                  className="rounded accent-amber-500"
                />
                <span>የመጨረሻውን ቀን ጨምር (Include End Day)</span>
              </label>

              <button
                onClick={() => setEndDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-amber-400 hover:underline font-mono"
              >
                Set End Date to Today
              </button>
            </div>
          </div>

          {intervalResult && (
            <div className={`p-6 rounded-3xl border shadow-xl ${
              isDarkMode ? 'bg-[#120f0c] border-amber-500/40 text-white' : 'bg-[#fcfaf5] border-amber-400/60 text-stone-900'
            }`}>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-4">
                የልዩነት ውጤት • Calculated Interval
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">ጠቅላላ ቀናት (Total Days)</span>
                  <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                    {intervalResult.totalDays} Days
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">
                    {intervalResult.weeks} weeks {intervalResult.remDays > 0 ? `+ ${intervalResult.remDays} days` : ''}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">የስራ ቀናት (Work Days)</span>
                  <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                    {intervalResult.workDays} Days
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">Excludes Saturday/Sunday</span>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                  <span className="text-[11px] text-stone-400 uppercase font-semibold">የእረፍት ቀናት (Weekends)</span>
                  <div className="text-3xl font-black font-mono text-indigo-400 mt-1">
                    {intervalResult.weekendDays} Days
                  </div>
                  <span className="text-[11px] text-stone-500 font-mono">Weekend count</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Date Add / Subtract */}
      {tab === 'add_sub' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border shadow-lg ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4">
              ቀን መደመር ወይም መቀነስ • Add or Subtract from a Date
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">መነሻ ቀን (Base Date)</label>
                <input
                  type="date"
                  value={baseDate}
                  onChange={(e) => setBaseDate(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">ኦፕሬሽን (Operation)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOperation('add')}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      operation === 'add' ? 'bg-amber-500 text-stone-950 border-amber-400' : 'border-stone-700 text-stone-400'
                    }`}
                  >
                    <Plus className="w-4 h-4" /> ደምር (Add)
                  </button>
                  <button
                    onClick={() => setOperation('subtract')}
                    className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 border transition-all ${
                      operation === 'subtract' ? 'bg-amber-500 text-stone-950 border-amber-400' : 'border-stone-700 text-stone-400'
                    }`}
                  >
                    <Minus className="w-4 h-4" /> ቀንስ (Subtract)
                  </button>
                </div>
              </div>
            </div>

            {/* Input Units */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-stone-800">
              <div>
                <label className="text-[11px] font-semibold text-stone-400">ዓመታት (Years)</label>
                <input
                  type="number"
                  min="0"
                  value={addYears}
                  onChange={(e) => setAddYears(parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 p-2 rounded-xl text-base font-bold font-mono border outline-none ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400">ወራት (Months)</label>
                <input
                  type="number"
                  min="0"
                  value={addMonths}
                  onChange={(e) => setAddMonths(parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 p-2 rounded-xl text-base font-bold font-mono border outline-none ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400">ሳምንታት (Weeks)</label>
                <input
                  type="number"
                  min="0"
                  value={addWeeks}
                  onChange={(e) => setAddWeeks(parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 p-2 rounded-xl text-base font-bold font-mono border outline-none ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-stone-400">ቀናት (Days)</label>
                <input
                  type="number"
                  min="0"
                  value={addDays}
                  onChange={(e) => setAddDays(parseInt(e.target.value) || 0)}
                  className={`w-full mt-1 p-2 rounded-xl text-base font-bold font-mono border outline-none ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
            </div>
          </div>

          {addSubResult && (
            <div className={`p-6 rounded-3xl border shadow-xl text-center ${
              isDarkMode ? 'bg-[#120f0c] border-amber-500/40 text-white' : 'bg-[#fcfaf5] border-amber-400/60 text-stone-900'
            }`}>
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
                የተገኘው ቀን • Target Result Date
              </span>
              <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {addSubResult.formattedDate}
              </div>
              <div className="text-sm font-semibold text-stone-400 mt-1 font-mono">
                {addSubResult.dayName} ({addSubResult.iso})
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Timesheet & Work Hours Calculator */}
      {tab === 'work_hours' && (
        <div className="space-y-6">
          <div className={`p-5 rounded-3xl border shadow-lg ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4">
              የስራ ሰዓት እና ክፍያ ማስያ • Work Hours & Wage Calculator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የመግቢያ ሰዓት (Start Time)</label>
                <input
                  type="time"
                  value={workStartTime}
                  onChange={(e) => setWorkStartTime(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የመውጫ ሰዓት (End Time)</label>
                <input
                  type="time"
                  value={workEndTime}
                  onChange={(e) => setWorkEndTime(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የምሳ እረፍት (Break in Minutes)</label>
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={lunchBreakMins}
                  onChange={(e) => setLunchBreakMins(parseInt(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የአንድ ሰዓት ክፍያ (Hourly Rate)</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={hourlyWage}
                  onChange={(e) => setHourlyWage(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-xl ${
            isDarkMode ? 'bg-[#120f0c] border-amber-500/40 text-white' : 'bg-[#fcfaf5] border-amber-400/60 text-stone-900'
          }`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                <span className="text-xs font-semibold text-stone-400 uppercase">የተሰራ የተጣራ ሰዓት (Net Hours Worked)</span>
                <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                  {workHoursResult.hoursPart} hrs {workHoursResult.minsPart} mins
                </div>
                <span className="text-[11px] text-stone-500 font-mono">({workHoursResult.netHours} total decimal hrs)</span>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                <span className="text-xs font-semibold text-stone-400 uppercase">አጠቃላይ ክፍያ (Total Earnings)</span>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                  ETB {workHoursResult.earnings}
                </div>
                <span className="text-[11px] text-stone-500 font-mono">Rate: ETB {hourlyWage}/hr</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeAgeCalculator;
