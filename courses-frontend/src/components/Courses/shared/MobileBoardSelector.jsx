import React from 'react';
import { motion } from 'framer-motion';

/**
 * Mobile-only Board/State selector UI
 * Props:
 * - availableBoards: Array<{ id: string, name: string, fullName?: string, available?: boolean }>
 * - availableStates: Array<{ id: string, name: string, fullName?: string }>
 * - checkingAvailability: boolean
 * - checkingStates: boolean
 * - isBoardSelection: boolean
 * - isStateSelection: boolean
 * - onSelectBoard: (id: string) => void
 * - onSelectState: (id: string) => void
 * - onBack: () => void
 */
const MobileBoardSelector = ({
  availableBoards = [],
  availableStates = [],
  checkingAvailability = false,
  checkingStates = false,
  isBoardSelection = false,
  isStateSelection = false,
  onSelectBoard,
  onSelectState,
  onBack,
}) => {
  // Render nothing when not in selection modes
  if (!isBoardSelection && !isStateSelection) return null;
  return (
    <div className="md:hidden">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 pt-[max(env(safe-area-inset-top),0.5rem)] pb-3 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            aria-label="Back"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-200 text-gray-700 bg-white shadow-sm active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900">
            {isStateSelection ? 'Select Your State' : 'Select Your Board'}
          </h1>
          <div className="w-9" />
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {!isStateSelection && (
          <p className="text-xs text-gray-500 px-0.5">Choose your education board to get the right courses.</p>
        )}
        {/* Board selection grid */}
        {isBoardSelection && (
          <div className="grid grid-cols-1 gap-3">
            {checkingAvailability ? (
              <div className="flex justify-center my-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            ) : (
              availableBoards.filter(b => b.available !== false).map((board, idx) => (
                <motion.button
                  key={board.id}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-2xl p-4 text-left bg-white shadow-sm active:shadow border border-gray-200/80 hover:border-indigo-300 transition-all relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  onClick={() => onSelectBoard?.(board.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50 to-purple-50 opacity-70" />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-base font-semibold text-gray-900">{board.name}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Tap to choose</span>
                    </div>
                    {board.fullName && (
                      <p className="text-xs text-gray-600">{board.fullName}</p>
                    )}
                  </div>
                </motion.button>
              ))
            )}
          </div>
        )}

        {/* State selection grid */}
        {isStateSelection && (
          checkingStates ? (
            <div className="flex justify-center my-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {availableStates.map((state) => (
                <motion.button
                  key={state.id}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-2xl p-4 text-left bg-white shadow-sm active:shadow border border-gray-200/80 hover:border-indigo-300 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-300"
                  onClick={() => onSelectState?.(state.id)}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">{state.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Tap to choose</span>
                  </div>
                  {state.fullName && (
                    <p className="text-xs text-gray-600">{state.fullName}</p>
                  )}
                </motion.button>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MobileBoardSelector;
