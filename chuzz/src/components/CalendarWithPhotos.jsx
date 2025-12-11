import React, { useState, useEffect, useCallback } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, Trash2, ImageOff } from "lucide-react";

import Modal from "./Modal";
import { useBodyProgress } from "../context/BodyProgressProvider";

const CalendarWithPhotos = ({ onDataChange, onDayClick }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  const [activePhoto, setActivePhoto] = useState(null);
  const [entriesByDay, setEntriesByDay] = useState({});
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { isReady, getProgressEntriesMonth, getAllEntries, deleteProgressEntry } = useBodyProgress();

  // Load month entries
  const loadMonthEntries = useCallback(async () => {
    if (!isReady) return;
    
    setLoading(true);
    try {
      const entries = await getProgressEntriesMonth(selectedDate);
      setEntriesByDay(entries);
    } catch (err) {
      console.error("Error loading month entries:", err);
      setEntriesByDay({});
    } finally {
      setLoading(false);
    }
  }, [isReady, selectedDate, getProgressEntriesMonth]);

  // Load all entries for timelapse
  const loadAllEntries = useCallback(async () => {
    if (!isReady) return;
    
    try {
      const entries = await getAllEntries();
      setAllEntries(entries);
    } catch (err) {
      console.error("Error loading all entries:", err);
      setAllEntries([]);
    }
  }, [isReady, getAllEntries]);

  useEffect(() => {
    loadMonthEntries();
  }, [loadMonthEntries]);

  useEffect(() => {
    loadAllEntries();
  }, [loadAllEntries]);

  const getDateKey = (date) => date.toISOString().split("T")[0];
  const imageDates = new Set(allEntries.map((entry) => entry.date));

  // Timelapse effect
  useEffect(() => {
    let interval;
    if (isPlayingTimelapse && allEntries.length > 0) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => {
          if (prev >= allEntries.length - 1) {
            setIsPlayingTimelapse(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimelapse, allEntries.length]);

  const toggleTimelapse = () => {
    if (allEntries.length === 0) return;
    
    if (!isCalendarExpanded) {
      setIsPlayingTimelapse(!isPlayingTimelapse);
    } else {
      setIsCalendarExpanded(false);
      setTimeout(() => setIsPlayingTimelapse(true), 500);
    }
  };

  const resetCalendarView = () => {
    setIsPlayingTimelapse(false);
    setIsCalendarExpanded(true);
    setCurrentImageIndex(0);
  };

  const dateHasImage = (day) => {
    return !!entriesByDay[day];
  };

  // Updated logic to ensure the adjacent days both before and after are considered
  const getGlowLevel = (day) => {
    const target = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    let closest = Infinity;

    for (let i = 1; i <= 3; i++) {
      const before = new Date(target);
      before.setDate(target.getDate() - i);
      const after = new Date(target);
      after.setDate(target.getDate() + i);

      if (imageDates.has(getDateKey(before))) closest = Math.min(closest, i);
      if (imageDates.has(getDateKey(after))) closest = Math.min(closest, i);
    }

    return closest === Infinity ? 0 : closest;
  };

  const handleDayClick = (day) => {
    const entry = entriesByDay[day];
    if (entry) {
      setActivePhoto(entry);
    } else {
      // Empty slot - open add dialog with this date
      if (onDayClick) {
        const dateStr = `${selectedDate.getFullYear()}-${String(
          selectedDate.getMonth() + 1
        ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        onDayClick(dateStr);
      }
    }
  };

  const handleDelete = async (date) => {
    try {
      await deleteProgressEntry(date);
      setDeleteConfirm(null);
      setActivePhoto(null);
      // Reload data
      await loadMonthEntries();
      await loadAllEntries();
      // Notify parent of data change
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error("Error deleting entry:", err);
      alert("Failed to delete entry. Please try again.");
    }
  };

  const previousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();
  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const month = selectedDate.toLocaleString("default", { month: "long" });
  const year = selectedDate.getFullYear();

  // Timelapse View
  if (!isCalendarExpanded && allEntries.length > 0) {
    const currentEntry = allEntries[currentImageIndex];
    const currentDate = new Date(currentEntry.date);
    const displayMonth = currentDate.toLocaleString("default", {
      month: "long",
    });
    const displayYear = currentDate.getFullYear();
    const displayDay = currentDate.getDate();

    return (
      <div className="w-full bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Progress Timelapse</h2>
          <button
            className="p-1 rounded border border-gray-200 hover:bg-gray-100"
            onClick={resetCalendarView}
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              disabled={currentImageIndex === 0}
              onClick={() => {
                setIsPlayingTimelapse(false);
                setCurrentImageIndex((prev) => Math.max(0, prev - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="font-medium">
              {displayMonth} {displayDay}, {displayYear}
            </span>

            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
              disabled={currentImageIndex === allEntries.length - 1}
              onClick={() => {
                setIsPlayingTimelapse(false);
                setCurrentImageIndex((prev) =>
                  Math.min(allEntries.length - 1, prev + 1)
                );
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm"
            onClick={() => setIsPlayingTimelapse(!isPlayingTimelapse)}
          >
            {isPlayingTimelapse ? (
              <>
                <Pause size={14} />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Play</span>
              </>
            )}
          </button>
        </div>

        <div className="flex justify-center mb-4">
          <div className="relative w-full max-w-lg aspect-square bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
            <img
              src={currentEntry.image}
              alt={`Progress photo from ${currentEntry.date}`}
              className="max-w-full max-h-full object-contain"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2 text-center">
              <div className="text-sm">
                <span className="font-bold">Weight:</span>{" "}
                {currentEntry.weight} kg&nbsp;&nbsp;
                <span className="font-bold">Body Fat:</span>{" "}
                {currentEntry.bodyFat}%
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <input
            type="range"
            min="0"
            max={allEntries.length - 1}
            value={currentImageIndex}
            onChange={(e) => {
              setIsPlayingTimelapse(false);
              setCurrentImageIndex(parseInt(e.target.value));
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{allEntries[0]?.date}</span>
            <span>{allEntries[allEntries.length - 1]?.date}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">
              {month} {year}
            </h2>
            <button
              aria-label={
                isPlayingTimelapse ? "Pause timelapse" : "Play timelapse"
              }
              className={`ml-2 p-1 rounded-full hover:bg-gray-100 ${allEntries.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={toggleTimelapse}
              title={allEntries.length === 0 ? "Add photos to enable timelapse" : "Play timelapse of progress photos"}
              disabled={allEntries.length === 0}
            >
              <Play size={16} className="text-blue-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <button
              aria-label="Previous Month"
              className="p-1 rounded border border-gray-200 hover:bg-gray-100"
              onClick={previousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Next Month"
              className="p-1 rounded border border-gray-200 hover:bg-gray-100"
              onClick={nextMonth}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-2">
            {daysOfWeek.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 p-2"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: firstDayOfMonth }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}

            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const hasImage = dateHasImage(day);
              const glowLevel = getGlowLevel(day);
              const entry = entriesByDay[day];

              let glowClass = "";
              if (hasImage) glowClass = "bg-blue-200";
              else if (glowLevel === 1) glowClass = "bg-blue-200/60";
              else if (glowLevel === 2) glowClass = "bg-blue-200/40";
              else if (glowLevel === 3) glowClass = "bg-blue-200/20";

              return (
                <button
                  key={`day-${day}`}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square rounded-lg relative overflow-hidden border ${
                    hasImage ? "border-blue-500" : "border-gray-200"
                  } ${glowClass} hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  {hasImage && entry && (
                    <div className="absolute inset-0 bg-cover bg-center">
                      <img
                        src={entry.image}
                        alt=""
                        className="w-full h-full object-cover opacity-75"
                      />
                    </div>
                  )}
                  <div
                    className={`absolute inset-0 flex items-center justify-center ${
                      hasImage
                        ? "text-white font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                        : "text-gray-700"
                    }`}
                  >
                    {day}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!loading && Object.keys(entriesByDay).length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <ImageOff size={48} className="mb-2 opacity-50" />
            <p>No photos this month</p>
            <p className="text-sm">Click &quot;Add Photo&quot; to get started!</p>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      <Modal
        isOpen={!!activePhoto}
        onClose={() => setActivePhoto(null)}
        title="Progress Details"
      >
        {activePhoto && (
          <div className="space-y-4">
            <img
              src={activePhoto.image}
              alt="Progress"
              className="w-full rounded-lg"
            />
            <div className="text-sm text-gray-700 space-y-1">
              <div>
                <strong>Date:</strong> {activePhoto.date}
              </div>
              <div>
                <strong>Weight:</strong> {activePhoto.weight} kg
              </div>
              <div>
                <strong>Body Fat:</strong> {activePhoto.bodyFat}%
              </div>
            </div>
            
            {/* Delete button */}
            {deleteConfirm === activePhoto.date ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(activePhoto.date)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded flex items-center justify-center gap-2"
                >
                  <Trash2 size={16} />
                  Confirm Delete
                </button>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(activePhoto.date)}
                className="w-full bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                Delete Entry
              </button>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default CalendarWithPhotos;
