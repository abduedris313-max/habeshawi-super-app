/**
 * @file DiscountVatCalculator.tsx
 * @description Discount and Ethiopian 15% VAT (ተጨማሪ እሴት ታክስ) / Sales Tax Calculator.
 * Supports VAT inclusive/exclusive calculation, fixed/percentage discounts, and breakdown.
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Tag, 
  Percent, 
  Sparkles, 
  RotateCcw, 
  Copy, 
  Check, 
  Receipt,
  HelpCircle
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface DiscountVatCalculatorProps {
  isDarkMode?: boolean;
}

export const DiscountVatCalculator: React.FC<DiscountVatCalculatorProps> = ({ isDarkMode = true }) => {
  const [originalPrice, setOriginalPrice] = useState<number>(4500);
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [vatRate, setVatRate] = useState<number>(15); // Ethiopian default 15%
  const [vatMode, setVatMode] = useState<'add' | 'included'>('add');
  const [copied, setCopied] = useState<boolean>(false);

  const result = useMemo(() => {
    const rawPrice = Math.max(0, originalPrice);
    
    // Calculate Discount
    let discountAmount = 0;
    if (discountType === 'percent') {
      discountAmount = (rawPrice * Math.min(100, Math.max(0, discountValue))) / 100;
    } else {
      discountAmount = Math.min(rawPrice, Math.max(0, discountValue));
    }

    const priceAfterDiscount = Math.max(0, rawPrice - discountAmount);

    let finalPrice = 0;
    let vatAmount = 0;
    let netBeforeVat = 0;

    if (vatMode === 'add') {
      // VAT is added on top of discounted price
      netBeforeVat = priceAfterDiscount;
      vatAmount = (netBeforeVat * vatRate) / 100;
      finalPrice = netBeforeVat + vatAmount;
    } else {
      // VAT is already included inside discounted price (extract VAT)
      finalPrice = priceAfterDiscount;
      netBeforeVat = finalPrice / (1 + vatRate / 100);
      vatAmount = finalPrice - netBeforeVat;
    }

    return {
      originalPrice: rawPrice,
      discountAmount,
      priceAfterDiscount,
      netBeforeVat,
      vatAmount,
      finalPrice,
      totalSaved: discountAmount,
    };
  }, [originalPrice, discountType, discountValue, vatRate, vatMode]);

  const handleCopy = () => {
    triggerHaptic('light');
    const text = `
HABESHAWI DISCOUNT & VAT RECEIPT
---------------------------------
Original Price: ETB ${result.originalPrice.toFixed(2)}
Discount: -ETB ${result.discountAmount.toFixed(2)} (${discountType === 'percent' ? `${discountValue}%` : 'Fixed'})
Price Before VAT: ETB ${result.netBeforeVat.toFixed(2)}
15% VAT (ተጨማሪ እሴት ታክስ): +ETB ${result.vatAmount.toFixed(2)}
---------------------------------
FINAL TOTAL: ETB ${result.finalPrice.toFixed(2)}
Total Saved: ETB ${result.totalSaved.toFixed(2)}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Top Banner Card */}
      <div className={`p-6 rounded-3xl border shadow-xl text-center relative overflow-hidden ${
        isDarkMode 
          ? 'bg-gradient-to-br from-[#1c1611] via-[#14100c] to-[#0a0806] border-amber-500/40 shadow-amber-950/40' 
          : 'bg-gradient-to-br from-amber-50 via-white to-amber-100 border-amber-400/60 shadow-stone-300'
      }`}>
        <span className="text-[11px] font-bold text-amber-500 uppercase tracking-widest block font-mono">
          የመጨረሻ የሚከፈል ዋጋ • FINAL PAYABLE PRICE
        </span>

        <div className="text-4xl sm:text-5xl font-black font-mono text-amber-400 my-2">
          <span className="text-xl font-normal mr-1">ETB</span>
          {result.finalPrice.toFixed(2)}
        </div>

        <div className="flex justify-center items-center gap-4 text-xs font-mono text-emerald-400 font-bold pt-2 border-t border-amber-500/20 max-w-sm mx-auto">
          <span>You Save: ETB {result.totalSaved.toFixed(2)}</span>
          <span>•</span>
          <span>VAT (15%): ETB {result.vatAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Form Controls */}
      <div className={`p-6 rounded-3xl border space-y-5 ${
        isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-200'
      }`}>
        {/* Original Price */}
        <div>
          <label className="text-xs font-bold text-amber-500 uppercase tracking-wider block mb-2">
            ዋና ዋጋ • Original Price (ETB)
          </label>
          <input
            type="number"
            min="0"
            step="100"
            value={originalPrice || ''}
            onChange={(e) => setOriginalPrice(parseFloat(e.target.value) || 0)}
            className={`w-full p-3 rounded-2xl text-xl font-bold font-mono outline-none border focus:ring-2 focus:ring-amber-500 ${
              isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
            }`}
            placeholder="4500"
          />
        </div>

        {/* Discount Controls */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">
              የቅናሽ መጠን • Discount
            </label>
            <div className="flex rounded-lg border border-stone-700 overflow-hidden text-xs">
              <button
                onClick={() => setDiscountType('percent')}
                className={`px-2.5 py-1 font-bold ${discountType === 'percent' ? 'bg-amber-500 text-black' : 'text-stone-400'}`}
              >
                % Percent
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`px-2.5 py-1 font-bold ${discountType === 'fixed' ? 'bg-amber-500 text-black' : 'text-stone-400'}`}
              >
                Fixed ETB
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <input
              type="number"
              min="0"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className={`w-full p-2.5 rounded-xl text-lg font-bold font-mono border outline-none ${
                isDarkMode ? 'bg-[#1c1611] border-stone-700 text-white' : 'bg-stone-50 border-stone-300'
              }`}
            />
            {discountType === 'percent' && (
              <div className="flex gap-1.5">
                {[5, 10, 15, 20, 25, 50].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDiscountValue(d)}
                    className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold border ${
                      discountValue === d ? 'bg-amber-500 text-black border-amber-400' : 'text-stone-400 border-stone-700'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VAT (ተጨማሪ እሴት ታክስ) Controls */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
              <Receipt className="w-3.5 h-3.5 text-amber-500" /> ቫት / ተጨማሪ እሴት ታክስ • VAT Rate
            </label>
            <div className="flex rounded-lg border border-stone-700 overflow-hidden text-xs">
              <button
                onClick={() => setVatMode('add')}
                className={`px-2.5 py-1 font-bold ${vatMode === 'add' ? 'bg-amber-500 text-black' : 'text-stone-400'}`}
              >
                + Add VAT
              </button>
              <button
                onClick={() => setVatMode('included')}
                className={`px-2.5 py-1 font-bold ${vatMode === 'included' ? 'bg-amber-500 text-black' : 'text-stone-400'}`}
              >
                VAT Included
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {[0, 5, 10, 15, 18].map((v) => (
              <button
                key={v}
                onClick={() => setVatRate(v)}
                className={`px-3 py-2 rounded-xl text-xs font-mono font-bold border transition-all ${
                  vatRate === v ? 'bg-amber-500 text-stone-950 border-amber-400' : 'text-stone-400 border-stone-700'
                }`}
              >
                {v === 15 ? '15% (ኢትዮጵያ)' : `${v}%`}
              </button>
            ))}
          </div>
        </div>

        {/* Breakdown Receipt Summary */}
        <div className="p-4 rounded-2xl bg-black/40 border border-stone-800 space-y-2 text-xs font-mono">
          <div className="flex justify-between text-stone-400">
            <span>ዋና ዋጋ (Original Price):</span>
            <span>ETB {result.originalPrice.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-400">
            <span>የተቀነሰው ቅናሽ (Discount Saved):</span>
            <span>-ETB {result.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-stone-400">
            <span>ከቫት በፊት (Net before VAT):</span>
            <span>ETB {result.netBeforeVat.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-rose-400">
            <span>ተጨማሪ እሴት ታክስ ({vatRate}% VAT):</span>
            <span>+ETB {result.vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-amber-400 pt-2 border-t border-stone-700">
            <span>ጠቅላላ ክፍያ (Total Payable):</span>
            <span>ETB {result.finalPrice.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="w-full py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-md"
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copied Receipt!' : 'Copy Receipt Summary'}</span>
        </button>
      </div>
    </div>
  );
};

export default DiscountVatCalculator;
