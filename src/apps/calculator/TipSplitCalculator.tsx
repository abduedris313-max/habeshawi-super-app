/**
 * @file TipSplitCalculator.tsx
 * @description Tip & Bill Splitting Calculator with person breakdown and round-up options.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Receipt, 
  Users, 
  Percent, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Coins, 
  Plus, 
  Minus 
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface TipSplitCalculatorProps {
  isDarkMode?: boolean;
}

export const TipSplitCalculator: React.FC<TipSplitCalculatorProps> = ({ isDarkMode = true }) => {
  const [billAmount, setBillAmount] = useState<number>(1850);
  const [tipPercent, setTipPercent] = useState<number>(10);
  const [customTip, setCustomTip] = useState<string>('');
  const [peopleCount, setPeopleCount] = useState<number>(4);
  const [roundUp, setRoundUp] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const activeTip = customTip !== '' ? parseFloat(customTip) || 0 : tipPercent;

  const result = useMemo(() => {
    const bill = Math.max(0, billAmount);
    const people = Math.max(1, peopleCount);
    const tipAmt = (bill * activeTip) / 100;
    let total = bill + tipAmt;

    if (roundUp) {
      total = Math.ceil(total);
    }

    const perPersonTotal = total / people;
    const perPersonBill = bill / people;
    const perPersonTip = (total - bill) / people;

    return {
      bill,
      tipAmt: total - bill,
      total,
      perPersonTotal,
      perPersonBill,
      perPersonTip,
      people,
    };
  }, [billAmount, activeTip, peopleCount, roundUp]);

  const handleCopy = () => {
    triggerHaptic('light');
    const text = `
HABESHAWI BILL & TIP SPLIT
---------------------------
Bill Amount: ETB ${result.bill.toFixed(2)}
Tip (${activeTip}%): ETB ${result.tipAmt.toFixed(2)}
Total Amount: ETB ${result.total.toFixed(2)}
Split between: ${result.people} people
---------------------------
PER PERSON SHARE: ETB ${result.perPersonTotal.toFixed(2)}
(Meal: ETB ${result.perPersonBill.toFixed(2)} + Tip: ETB ${result.perPersonTip.toFixed(2)})
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Result Hero Header */}
      <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden text-center ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0a0806] border-amber-500/40 shadow-amber-950/40' 
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border-amber-400/60 shadow-stone-300'
      }`}>
        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest block font-mono">
          የአንድ ሰው ድርሻ • AMOUNT PER PERSON
        </span>

        <div className="text-4xl sm:text-5xl font-black font-mono text-emerald-400 my-2">
          <span className="text-xl font-normal mr-1">ETB</span>
          {result.perPersonTotal.toFixed(2)}
        </div>

        <div className="flex justify-center items-center gap-4 text-xs font-mono text-stone-400 pt-2 border-t border-amber-500/20 max-w-sm mx-auto">
          <span>Meal: ETB {result.perPersonBill.toFixed(2)}</span>
          <span>•</span>
          <span>Tip: ETB {result.perPersonTip.toFixed(2)}</span>
        </div>
      </div>

      {/* Inputs Form */}
      <div className={`p-6 rounded-3xl border space-y-5 ${
        isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
      }`}>
        {/* Bill Amount */}
        <div>
          <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
            የሂሳብ መጠን • Total Bill Amount (ETB)
          </label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="50"
              value={billAmount || ''}
              onChange={(e) => setBillAmount(parseFloat(e.target.value) || 0)}
              className={`w-full p-3 pl-4 rounded-2xl text-xl font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 ${
                isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
              }`}
              placeholder="1850"
            />
          </div>
        </div>

        {/* Tip Percentage Select */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
            ቲፕ • Tip Percentage
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {[0, 5, 10, 15, 20].map((t) => (
              <button
                key={t}
                onClick={() => {
                  triggerHaptic('light');
                  setCustomTip('');
                  setTipPercent(t);
                }}
                className={`py-2.5 rounded-xl text-xs font-bold font-mono border transition-all ${
                  customTip === '' && tipPercent === t
                    ? 'bg-amber-500 text-stone-950 border-amber-400'
                    : isDarkMode
                      ? 'bg-stone-900 border-stone-700 text-stone-300 hover:bg-stone-800'
                      : 'bg-stone-100 border-stone-300 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {t}%
              </button>
            ))}
            <input
              type="number"
              min="0"
              max="100"
              placeholder="Custom"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              className={`py-2 px-2 text-center rounded-xl text-xs font-bold font-mono border outline-none ${
                customTip !== ''
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : isDarkMode ? 'bg-stone-900 border-stone-700 text-stone-400' : 'bg-stone-100 border-stone-300'
              }`}
            />
          </div>
        </div>

        {/* Number of People */}
        <div>
          <label className="text-xs font-bold text-stone-400 uppercase tracking-wider block mb-2">
            የሰው ብዛት • Split Between (People)
          </label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                triggerHaptic('light');
                setPeopleCount(Math.max(1, peopleCount - 1));
              }}
              className="p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className={`flex-1 p-2.5 rounded-xl text-center font-mono font-bold text-xl border ${
              isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
            }`}>
              {peopleCount} People
            </div>

            <button
              onClick={() => {
                triggerHaptic('light');
                setPeopleCount(peopleCount + 1);
              }}
              className="p-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-bold"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Round-up Toggle & Copy */}
        <div className="flex items-center justify-between pt-3 border-t border-stone-800">
          <label className="text-xs text-stone-300 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={roundUp}
              onChange={(e) => setRoundUp(e.target.checked)}
              className="rounded accent-amber-500"
            />
            <span>Round Up to Nearest Integer</span>
          </label>

          <button
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Bill'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TipSplitCalculator;
