import React, { useState, useMemo } from 'react';
import { Award } from 'lucide-react';
import Modal from './Modal';
import { isMonthlyStreak } from '../utils/calendarHelpers.js';

/**
 * StreakBadge
 * Renders a badge for a full-month streak, and shows earned badges in a styled modal.
 */
const StreakBadge = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hasStreak = useMemo(() => isMonthlyStreak(new Date()), []);

  if (!hasStreak) return null;

  return (
    <>
      {/* Badge + See Awards button */}
      <div className="flex items-center justify-between bg-green-100 text-green-800 px-4 py-2 rounded-lg mb-4">
        <div
          className="flex items-center cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          <Award className="w-6 h-6 mr-2" />
          <span className="font-medium">🎉 Monthly Streak Badge Earned! 🎉</span>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="text-sm font-medium underline cursor-pointer hover:text-green-700"
        >
          See Awards
        </button>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Your Badges"
      >
        <div className="space-y-4">
          <p className="text-gray-600">Congrats! Here are the badges you've earned:</p>
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm">
              <Award className="w-6 h-6 text-green-600" />
              <div>
                <p className="font-semibold">Monthly Streak Badge</p>
                <p className="text-xs text-gray-500">Earned April 2025</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200 shadow-sm">
              <Award className="w-6 h-6 text-purple-600" />
              <div>
                <p className="font-semibold">Half‑Month Consistency</p>
                <p className="text-xs text-gray-500">Earned March 2025</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
              <Award className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-semibold">First Photo Upload</p>
                <p className="text-xs text-gray-500">Earned January 2025</p>
              </div>
            </div>

          </div>
        </div>
      </Modal>
    </>
  );
};

export default StreakBadge;
