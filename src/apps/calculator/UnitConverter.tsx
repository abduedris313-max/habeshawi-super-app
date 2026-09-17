/**
 * @file UnitConverter.tsx
 * @description Multi-category Unit & Currency Converter with Ethiopian measurements (Quintal, Hectare, Birr)
 * and Fuel/Trip cost calculation.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  ArrowLeftRight, 
  Coins, 
  Ruler, 
  Scale, 
  Thermometer, 
  Maximize2, 
  HardDrive, 
  Gauge, 
  Fuel, 
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface UnitConverterProps {
  isDarkMode?: boolean;
}

type UnitCategory = 'currency' | 'length' | 'weight' | 'area' | 'temperature' | 'digital' | 'speed' | 'fuel';

export const UnitConverter: React.FC<UnitConverterProps> = ({ isDarkMode = true }) => {
  const [category, setCategory] = useState<UnitCategory>('currency');
  const [inputValue, setInputValue] = useState<string>('100');
  const [fromUnit, setFromUnit] = useState<string>('USD');
  const [toUnit, setToUnit] = useState<string>('ETB');

  // Fuel Trip Calculator States
  const [tripDistance, setTripDistance] = useState<number>(450); // Addis to Hawassa approx ~275km or Bahir Dar ~500km
  const [fuelEconomy, setFuelEconomy] = useState<number>(8.5); // Liters per 100km
  const [fuelPricePerLiter, setFuelPricePerLiter] = useState<number>(108.5); // ETB per liter
  const [passengers, setPassengers] = useState<number>(3);

  // Conversion definitions
  const unitsMap: Record<UnitCategory, { name: string; units: { code: string; label: string; toBase: (v: number) => number; fromBase: (v: number) => number }[] }> = {
    currency: {
      name: 'የገንዘብ ምንዛሪ (Currency)',
      units: [
        { code: 'USD', label: 'USD - US Dollar ($)', toBase: v => v, fromBase: v => v },
        { code: 'ETB', label: 'ETB - Ethiopian Birr (ብር)', toBase: v => v * 0.0076, fromBase: v => v / 0.0076 },
        { code: 'EUR', label: 'EUR - Euro (€)', toBase: v => v * 1.08, fromBase: v => v / 1.08 },
        { code: 'GBP', label: 'GBP - British Pound (£)', toBase: v => v * 1.29, fromBase: v => v / 1.29 },
        { code: 'AED', label: 'AED - UAE Dirham (د.إ)', toBase: v => v * 0.272, fromBase: v => v / 0.272 },
        { code: 'SAR', label: 'SAR - Saudi Riyal (﷼)', toBase: v => v * 0.266, fromBase: v => v / 0.266 },
        { code: 'CAD', label: 'CAD - Canadian Dollar (C$)', toBase: v => v * 0.73, fromBase: v => v / 0.73 },
        { code: 'KES', label: 'KES - Kenyan Shilling (KSh)', toBase: v => v * 0.0077, fromBase: v => v / 0.0077 },
      ],
    },
    length: {
      name: 'ርዝመት (Length)',
      units: [
        { code: 'm', label: 'Meters (m)', toBase: v => v, fromBase: v => v },
        { code: 'km', label: 'Kilometers (km)', toBase: v => v * 1000, fromBase: v => v / 1000 },
        { code: 'cm', label: 'Centimeters (cm)', toBase: v => v / 100, fromBase: v => v * 100 },
        { code: 'mm', label: 'Millimeters (mm)', toBase: v => v / 1000, fromBase: v => v * 1000 },
        { code: 'mi', label: 'Miles (mi)', toBase: v => v * 1609.344, fromBase: v => v / 1609.344 },
        { code: 'yd', label: 'Yards (yd)', toBase: v => v * 0.9144, fromBase: v => v / 0.9144 },
        { code: 'ft', label: 'Feet (ft)', toBase: v => v * 0.3048, fromBase: v => v / 0.3048 },
        { code: 'in', label: 'Inches (in)', toBase: v => v * 0.0254, fromBase: v => v / 0.0254 },
      ],
    },
    weight: {
      name: 'ክብደት (Weight & Mass)',
      units: [
        { code: 'kg', label: 'Kilograms (kg)', toBase: v => v, fromBase: v => v },
        { code: 'g', label: 'Grams (g)', toBase: v => v / 1000, fromBase: v => v * 1000 },
        { code: 'quintal', label: 'ኩንታል (Quintal = 100kg)', toBase: v => v * 100, fromBase: v => v / 100 },
        { code: 'ton', label: 'Metric Ton (t)', toBase: v => v * 1000, fromBase: v => v / 1000 },
        { code: 'lb', label: 'Pounds (lbs)', toBase: v => v * 0.45359237, fromBase: v => v / 0.45359237 },
        { code: 'oz', label: 'Ounces (oz)', toBase: v => v * 0.0283495, fromBase: v => v / 0.0283495 },
      ],
    },
    area: {
      name: 'ስፋት (Area)',
      units: [
        { code: 'sqm', label: 'Square Meters (m²)', toBase: v => v, fromBase: v => v },
        { code: 'hectare', label: 'ሄክታር (Hectare)', toBase: v => v * 10000, fromBase: v => v / 10000 },
        { code: 'acre', label: 'Acres (ac)', toBase: v => v * 4046.86, fromBase: v => v / 4046.86 },
        { code: 'sqkm', label: 'Square Kilometers (km²)', toBase: v => v * 1000000, fromBase: v => v / 1000000 },
        { code: 'sqft', label: 'Square Feet (ft²)', toBase: v => v * 0.092903, fromBase: v => v / 0.092903 },
      ],
    },
    temperature: {
      name: 'ሙቀት (Temperature)',
      units: [
        { code: 'C', label: 'Celsius (°C)', toBase: v => v, fromBase: v => v },
        { code: 'F', label: 'Fahrenheit (°F)', toBase: v => (v - 32) * (5/9), fromBase: v => (v * (9/5)) + 32 },
        { code: 'K', label: 'Kelvin (K)', toBase: v => v - 273.15, fromBase: v => v + 273.15 },
      ],
    },
    digital: {
      name: 'ዲጂታል ማከማቻ (Digital Data)',
      units: [
        { code: 'MB', label: 'Megabytes (MB)', toBase: v => v, fromBase: v => v },
        { code: 'KB', label: 'Kilobytes (KB)', toBase: v => v / 1024, fromBase: v => v * 1024 },
        { code: 'GB', label: 'Gigabytes (GB)', toBase: v => v * 1024, fromBase: v => v / 1024 },
        { code: 'TB', label: 'Terabytes (TB)', toBase: v => v * 1024 * 1024, fromBase: v => v / (1024 * 1024) },
      ],
    },
    speed: {
      name: 'ፍጥነት (Speed)',
      units: [
        { code: 'kmh', label: 'km/h (Kilometers per hour)', toBase: v => v, fromBase: v => v },
        { code: 'mph', label: 'mph (Miles per hour)', toBase: v => v * 1.60934, fromBase: v => v / 1.60934 },
        { code: 'ms', label: 'm/s (Meters per second)', toBase: v => v * 3.6, fromBase: v => v / 3.6 },
        { code: 'knot', label: 'Knots (kn)', toBase: v => v * 1.852, fromBase: v => v / 1.852 },
      ],
    },
    fuel: {
      name: 'የነዳጅ እና የጉዞ ወጪ (Fuel & Trip)',
      units: [],
    },
  };

  // Switch category
  const handleCategoryChange = (cat: UnitCategory) => {
    triggerHaptic('selection');
    setCategory(cat);
    if (cat !== 'fuel') {
      const units = unitsMap[cat].units;
      setFromUnit(units[0].code);
      setToUnit(units[1] ? units[1].code : units[0].code);
    }
  };

  // Convert
  const convertedResult = useMemo(() => {
    if (category === 'fuel') return '';
    const num = parseFloat(inputValue) || 0;
    const catData = unitsMap[category];
    const fromDef = catData.units.find(u => u.code === fromUnit);
    const toDef = catData.units.find(u => u.code === toUnit);

    if (!fromDef || !toDef) return '0';

    const baseVal = fromDef.toBase(num);
    const finalVal = toDef.fromBase(baseVal);

    if (Math.abs(finalVal) < 0.0001 && finalVal !== 0) {
      return finalVal.toExponential(4);
    }
    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 4,
    }).format(finalVal);
  }, [category, inputValue, fromUnit, toUnit]);

  // Fuel Trip Result
  const fuelResult = useMemo(() => {
    const dist = Math.max(0, tripDistance);
    const econ = Math.max(0.1, fuelEconomy);
    const price = Math.max(0, fuelPricePerLiter);
    const people = Math.max(1, passengers);

    const litersNeeded = (dist / 100) * econ;
    const totalCost = litersNeeded * price;
    const costPerPerson = totalCost / people;

    return {
      litersNeeded: litersNeeded.toFixed(2),
      totalCost: totalCost.toFixed(2),
      costPerPerson: costPerPerson.toFixed(2),
    };
  }, [tripDistance, fuelEconomy, fuelPricePerLiter, passengers]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Category Grid Switcher */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(Object.keys(unitsMap) as UnitCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`p-3 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
              category === cat
                ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md font-bold'
                : isDarkMode
                  ? 'bg-[#14100c] border-stone-800 text-stone-300 hover:bg-stone-800'
                  : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 shadow-xs'
            }`}
          >
            {cat === 'currency' && <Coins className="w-4 h-4" />}
            {cat === 'length' && <Ruler className="w-4 h-4" />}
            {cat === 'weight' && <Scale className="w-4 h-4" />}
            {cat === 'area' && <Maximize2 className="w-4 h-4" />}
            {cat === 'temperature' && <Thermometer className="w-4 h-4" />}
            {cat === 'digital' && <HardDrive className="w-4 h-4" />}
            {cat === 'speed' && <Gauge className="w-4 h-4" />}
            {cat === 'fuel' && <Fuel className="w-4 h-4" />}
            <span className="truncate">{unitsMap[cat].name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {category !== 'fuel' ? (
        /* Standard Unit Converter Box */
        <div className={`p-6 rounded-3xl border shadow-xl space-y-5 ${
          isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
        }`}>
          {/* From Unit */}
          <div>
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-1">
              መነሻ እሴት • From
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className={`flex-1 p-3 rounded-xl text-xl font-bold font-mono outline-none border ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                }`}
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                className={`p-3 rounded-xl text-xs font-bold font-mono outline-none border cursor-pointer ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-amber-300' : 'bg-stone-50 border-stone-300'
                }`}
              >
                {unitsMap[category].units.map((u) => (
                  <option key={u.code} value={u.code}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Swap Button */}
          <div className="flex justify-center">
            <button
              onClick={() => {
                triggerHaptic('light');
                const temp = fromUnit;
                setFromUnit(toUnit);
                setToUnit(temp);
              }}
              className="p-3 rounded-full bg-amber-500/20 text-amber-400 hover:bg-amber-500 hover:text-stone-950 transition-all border border-amber-500/30"
              title="Swap Units"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* To Unit Result */}
          <div>
            <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-1">
              የተቀየረ ውጤት • Converted To
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className={`flex-1 p-3 rounded-xl text-2xl font-black font-mono border flex items-center ${
                isDarkMode ? 'bg-[#1c1611] border-stone-700 text-emerald-400' : 'bg-stone-50 border-stone-300 text-emerald-600'
              }`}>
                {convertedResult}
              </div>
              <select
                value={toUnit}
                onChange={(e) => setToUnit(e.target.value)}
                className={`p-3 rounded-xl text-xs font-bold font-mono outline-none border cursor-pointer ${
                  isDarkMode ? 'bg-[#1c1611] border-stone-700 text-amber-300' : 'bg-stone-50 border-stone-300'
                }`}
              >
                {unitsMap[category].units.map((u) => (
                  <option key={u.code} value={u.code}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* Fuel & Travel Cost Calculator */
        <div className="space-y-6">
          <div className={`p-6 rounded-3xl border shadow-xl ${
            isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
          }`}>
            <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Fuel className="w-4 h-4" /> የነዳጅ እና የጉዞ ወጪ ማስያ (Fuel Trip Cost)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የጉዞ ርቀት (Distance in km)</label>
                <input
                  type="number"
                  min="1"
                  value={tripDistance}
                  onChange={(e) => setTripDistance(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የነዳጅ ፍጆታ (Liters per 100km)</label>
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={fuelEconomy}
                  onChange={(e) => setFuelEconomy(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የአንድ ሊትር ዋጋ (ETB/Liter)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={fuelPricePerLiter}
                  onChange={(e) => setFuelPricePerLiter(parseFloat(e.target.value) || 0)}
                  className={`w-full p-2.5 rounded-xl text-base font-bold font-mono outline-none border ${
                    isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
                  }`}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-400 block mb-1">የተሳፋሪ ብዛት (Passengers)</label>
                <input
                  type="number"
                  min="1"
                  value={passengers}
                  onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                <span className="text-xs font-semibold text-stone-400 uppercase">የሚያስፈልግ ነዳጅ (Fuel Required)</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  {fuelResult.litersNeeded} L
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-stone-800">
                <span className="text-xs font-semibold text-stone-400 uppercase">አጠቃላይ የነዳጅ ወጪ (Total Cost)</span>
                <div className="text-2xl font-black font-mono text-amber-400 mt-1">
                  ETB {fuelResult.totalCost}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/50 to-teal-900/30 border border-emerald-500/40">
                <span className="text-xs font-bold text-emerald-400 uppercase">የአንድ ሰው ድርሻ (Cost Per Person)</span>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
                  ETB {fuelResult.costPerPerson}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnitConverter;
