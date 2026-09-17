/**
 * @file StandardCalculator.tsx
 * @description Standard & Scientific Calculator with Memory operations, History Tape,
 * and authentic Ge'ez Numeral conversion mode.
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  History, 
  RotateCcw, 
  Sparkles, 
  Copy, 
  Check, 
  Delete,
  Equal
} from 'lucide-react';
import { triggerHaptic } from '../../utils/haptics';

interface StandardCalculatorProps {
  isDarkMode?: boolean;
}

// Convert standard numbers to Ethiopian Ge'ez Numerals (1 to 999,999)
const toGeezNumber = (n: number): string => {
  if (isNaN(n) || !isFinite(n) || n <= 0) return String(n);
  const intVal = Math.floor(n);
  if (intVal > 999999) return String(n);

  const ones = ['', '፩', '፪', '፫', '፬', '፭', '፮', '፯', '፰', '፱'];
  const tens = ['', '፲', '፳', '፴', '፵', '፶', '፷', '፸', '፹', '፺'];
  const hundreds = '፻';
  const tenThousands = '፼';

  const convert99 = (num: number): string => {
    const t = Math.floor(num / 10);
    const o = num % 10;
    return tens[t] + ones[o];
  };

  const convert9999 = (num: number): string => {
    const h = Math.floor(num / 100);
    const rem = num % 100;
    let res = '';
    if (h > 0) {
      res += (h === 1 ? '' : convert99(h)) + hundreds;
    }
    if (rem > 0) {
      res += convert99(rem);
    }
    return res;
  };

  const tt = Math.floor(intVal / 10000);
  const rem = intVal % 10000;
  let finalRes = '';
  if (tt > 0) {
    finalRes += (tt === 1 ? '' : convert9999(tt)) + tenThousands;
  }
  if (rem > 0) {
    finalRes += convert9999(rem);
  }
  return finalRes || '፩';
};

export const StandardCalculator: React.FC<StandardCalculatorProps> = ({ isDarkMode = true }) => {
  const [display, setDisplay] = useState<string>('0');
  const [prevVal, setPrevVal] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(true);
  const [history, setHistory] = useState<string[]>([]);
  const [isScientific, setIsScientific] = useState<boolean>(false);
  const [useGeez, setUseGeez] = useState<boolean>(false);
  const [memory, setMemory] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    triggerHaptic('light');
    if (overwrite || display === '0') {
      setDisplay(digit);
      setOverwrite(false);
    } else {
      if (display.length < 14) {
        setDisplay(display + digit);
      }
    }
  };

  const handleDecimal = () => {
    triggerHaptic('light');
    if (overwrite) {
      setDisplay('0.');
      setOverwrite(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    triggerHaptic('medium');
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setOverwrite(true);
  };

  const handleBackspace = () => {
    triggerHaptic('light');
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setOverwrite(true);
    }
  };

  const handleOperator = (op: string) => {
    triggerHaptic('selection');
    const current = parseFloat(display);
    if (prevVal !== null && operation && !overwrite) {
      const result = compute(prevVal, current, operation);
      setPrevVal(result);
      setDisplay(String(result));
    } else {
      setPrevVal(current);
    }
    setOperation(op);
    setOverwrite(true);
  };

  const handleEquals = () => {
    triggerHaptic('medium');
    if (prevVal === null || !operation) return;
    const current = parseFloat(display);
    const result = compute(prevVal, current, operation);
    const equation = `${prevVal} ${operation} ${current} = ${result}`;
    setHistory((prev) => [equation, ...prev.slice(0, 11)]);
    setDisplay(String(result));
    setPrevVal(null);
    setOperation(null);
    setOverwrite(true);
  };

  const compute = (a: number, b: number, op: string): number => {
    let res = 0;
    switch (op) {
      case '+': res = a + b; break;
      case '-': res = a - b; break;
      case '×': res = a * b; break;
      case '÷': res = b !== 0 ? a / b : 0; break;
      case '^': res = Math.pow(a, b); break;
      default: res = b;
    }
    return Math.round(res * 100000000) / 100000000;
  };

  const handlePercent = () => {
    triggerHaptic('light');
    const val = parseFloat(display) / 100;
    setDisplay(String(val));
  };

  const handleToggleSign = () => {
    triggerHaptic('light');
    const val = parseFloat(display) * -1;
    setDisplay(String(val));
  };

  const handleSciFunc = (fn: string) => {
    triggerHaptic('selection');
    const val = parseFloat(display);
    let res = val;
    switch (fn) {
      case 'sin': res = Math.sin((val * Math.PI) / 180); break;
      case 'cos': res = Math.cos((val * Math.PI) / 180); break;
      case 'tan': res = Math.tan((val * Math.PI) / 180); break;
      case 'sqrt': res = Math.sqrt(Math.max(0, val)); break;
      case 'ln': res = val > 0 ? Math.log(val) : 0; break;
      case 'log': res = val > 0 ? Math.log10(val) : 0; break;
      case 'pi': res = Math.PI; break;
      case 'e': res = Math.E; break;
      case 'sqr': res = val * val; break;
      case 'inv': res = val !== 0 ? 1 / val : 0; break;
    }
    res = Math.round(res * 1000000) / 1000000;
    setDisplay(String(res));
    setOverwrite(true);
  };

  // Memory operations
  const handleMemory = (action: 'M+' | 'M-' | 'MR' | 'MC') => {
    triggerHaptic('selection');
    const cur = parseFloat(display) || 0;
    if (action === 'M+') setMemory(memory + cur);
    if (action === 'M-') setMemory(memory - cur);
    if (action === 'MR') {
      setDisplay(String(memory));
      setOverwrite(true);
    }
    if (action === 'MC') setMemory(0);
  };

  const displayGeez = useMemo(() => {
    const num = parseFloat(display);
    if (!isNaN(num) && num > 0) {
      return toGeezNumber(num);
    }
    return '';
  }, [display]);

  const handleCopyDisplay = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(display);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-sm mx-auto flex flex-col">
      {/* Top Toggle Bar */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsScientific(!isScientific)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
              isScientific
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : isDarkMode
                  ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            {isScientific ? 'Sci Mode On' : 'Scientific'}
          </button>

          <button
            onClick={() => setUseGeez(!useGeez)}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
              useGeez
                ? 'bg-amber-500 text-stone-950 border-amber-400'
                : isDarkMode
                  ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                  : 'bg-white border-stone-300 text-stone-700'
            }`}
          >
            {useGeez ? 'ግዕዝ ፩፪፫ On' : 'ግዕዝ ፲'}
          </button>
        </div>

        {/* Memory Indicator */}
        {memory !== 0 && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400">
            M = {memory}
          </span>
        )}
      </div>

      {/* Main LCD Screen */}
      <div className={`p-4 rounded-3xl mb-3 text-right flex flex-col justify-end border shadow-inner relative overflow-hidden ${
        isDarkMode ? 'bg-[#14100c] border-stone-800' : 'bg-white border-stone-300'
      }`}>
        <div className="h-5 text-xs text-stone-400 font-mono overflow-hidden flex items-center justify-between">
          <button
            onClick={handleCopyDisplay}
            className="text-[10px] text-stone-500 hover:text-amber-400 flex items-center gap-1 font-sans"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <span>{prevVal !== null && operation && `${prevVal} ${operation}`}</span>
        </div>

        <div className="text-4xl sm:text-5xl font-extralight tracking-tight truncate font-mono text-white mt-1">
          {display}
        </div>

        {useGeez && displayGeez && (
          <div className="text-xs font-bold text-amber-400 font-serif tracking-widest mt-1">
            {displayGeez}
          </div>
        )}
      </div>

      {/* Memory Row */}
      <div className="grid grid-cols-4 gap-1.5 mb-2 text-xs font-mono font-bold">
        {(['MC', 'MR', 'M+', 'M-'] as const).map((m) => (
          <button
            key={m}
            onClick={() => handleMemory(m)}
            className={`py-1.5 rounded-xl border transition-all ${
              isDarkMode ? 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white' : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Scientific Row if enabled */}
      <AnimatePresence>
        {isScientific && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="grid grid-cols-5 gap-1.5 mb-2"
          >
            {['sin', 'cos', 'tan', 'sqrt', 'pi', 'ln', 'log', 'sqr', 'inv', 'e'].map((fn) => (
              <button
                key={fn}
                onClick={() => handleSciFunc(fn)}
                className={`py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  isDarkMode ? 'bg-[#1c1611] text-amber-300 hover:bg-stone-800 border border-stone-800' : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                {fn}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Keypad Grid */}
      <div className="grid grid-cols-4 gap-2">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="py-3.5 rounded-2xl text-base font-bold bg-stone-700 hover:bg-stone-600 text-white active:scale-95 transition-all"
        >
          {display !== '0' || prevVal !== null ? 'C' : 'AC'}
        </button>
        <button
          onClick={handleToggleSign}
          className="py-3.5 rounded-2xl text-base font-bold bg-stone-700 hover:bg-stone-600 text-white active:scale-95 transition-all"
        >
          ±
        </button>
        <button
          onClick={handlePercent}
          className="py-3.5 rounded-2xl text-base font-bold bg-stone-700 hover:bg-stone-600 text-white active:scale-95 transition-all"
        >
          %
        </button>
        <button
          onClick={() => handleOperator('÷')}
          className={`py-3.5 rounded-2xl text-lg font-bold transition-all ${
            operation === '÷' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
          }`}
        >
          ÷
        </button>

        {/* Row 2 */}
        {['7', '8', '9'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className={`py-3.5 rounded-2xl text-lg font-medium transition-all active:scale-95 ${
              isDarkMode ? 'bg-[#1c1611] text-white hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-900 hover:bg-stone-100 shadow-xs border border-stone-200'
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('×')}
          className={`py-3.5 rounded-2xl text-lg font-bold transition-all ${
            operation === '×' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
          }`}
        >
          ×
        </button>

        {/* Row 3 */}
        {['4', '5', '6'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className={`py-3.5 rounded-2xl text-lg font-medium transition-all active:scale-95 ${
              isDarkMode ? 'bg-[#1c1611] text-white hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-900 hover:bg-stone-100 shadow-xs border border-stone-200'
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('-')}
          className={`py-3.5 rounded-2xl text-lg font-bold transition-all ${
            operation === '-' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
          }`}
        >
          −
        </button>

        {/* Row 4 */}
        {['1', '2', '3'].map((d) => (
          <button
            key={d}
            onClick={() => handleDigit(d)}
            className={`py-3.5 rounded-2xl text-lg font-medium transition-all active:scale-95 ${
              isDarkMode ? 'bg-[#1c1611] text-white hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-900 hover:bg-stone-100 shadow-xs border border-stone-200'
            }`}
          >
            {d}
          </button>
        ))}
        <button
          onClick={() => handleOperator('+')}
          className={`py-3.5 rounded-2xl text-lg font-bold transition-all ${
            operation === '+' ? 'bg-white text-amber-500' : 'bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold'
          }`}
        >
          +
        </button>

        {/* Row 5 */}
        <button
          onClick={() => handleDigit('0')}
          className={`py-3.5 rounded-2xl text-lg font-medium transition-all active:scale-95 ${
            isDarkMode ? 'bg-[#1c1611] text-white hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-900 hover:bg-stone-100 shadow-xs border border-stone-200'
          }`}
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className={`py-3.5 rounded-2xl text-lg font-medium transition-all active:scale-95 ${
            isDarkMode ? 'bg-[#1c1611] text-white hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-900 hover:bg-stone-100 shadow-xs border border-stone-200'
          }`}
        >
          .
        </button>
        <button
          onClick={handleBackspace}
          className={`py-3.5 rounded-2xl text-sm font-medium transition-all active:scale-95 flex items-center justify-center ${
            isDarkMode ? 'bg-[#1c1611] text-stone-400 hover:bg-stone-800 border border-stone-800/80' : 'bg-white text-stone-700 hover:bg-stone-100 shadow-xs border border-stone-200'
          }`}
        >
          <Delete className="w-5 h-5" />
        </button>
        <button
          onClick={handleEquals}
          className="py-3.5 rounded-2xl text-lg font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 active:scale-95 transition-all shadow-md"
        >
          =
        </button>
      </div>

      {/* History Tape */}
      {history.length > 0 && (
        <div className="mt-4 p-3 rounded-2xl border text-xs bg-stone-900/60 border-stone-800">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-stone-800">
            <span className="font-semibold text-stone-400 flex items-center gap-1">
              <History className="w-3 h-3" /> Recent History
            </span>
            <button
              onClick={() => setHistory([])}
              className="text-[10px] text-stone-400 hover:text-rose-400"
            >
              Clear
            </button>
          </div>
          <div className="space-y-1 font-mono text-[11px] text-stone-300 max-h-24 overflow-y-auto">
            {history.map((item, i) => (
              <p key={i} className="truncate">{item}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StandardCalculator;
