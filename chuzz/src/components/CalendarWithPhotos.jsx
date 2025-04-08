import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

const sampleImages = [
  { date: '2025-01-01', src: '/api/placeholder/400/400?text=Jan+1' },
  { date: '2025-01-15', src: '/api/placeholder/400/400?text=Jan+15' },
  { date: '2025-02-01', src: '/api/placeholder/400/400?text=Feb+1' },
  { date: '2025-02-15', src: '/api/placeholder/400/400?text=Feb+15' },
  { date: '2025-03-01', src: '/api/placeholder/400/400?text=Mar+1' },
  { date: '2025-03-15', src: '/api/placeholder/400/400?text=Mar+15' },
  { date: '2025-04-01', src: '/api/placeholder/400/400?text=Apr+1' },
];

const CalendarWithPhotos = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  const weightData = [185, 182, 180, 178, 176, 174, 172];
  const bodyFatData = [22, 21, 20, 19, 18.5, 17.5, 16.5];

  useEffect(() => {
    let interval;
    if (isPlayingTimelapse) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => {
          if (prev >= sampleImages.length - 1) {
            setIsPlayingTimelapse(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlayingTimelapse]);

  const toggleTimelapse = () => {
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
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sampleImages.some(img => img.date === dateStr);
  };

  const previousMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1));
  };

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const month = selectedDate.toLocaleString('default', { month: 'long' });
  const year = selectedDate.getFullYear();

  if (!isCalendarExpanded) {
    const currentImage = sampleImages[currentImageIndex];
    const currentDate = new Date(currentImage.date);
    const displayMonth = currentDate.toLocaleString('default', { month: 'long' });
    const displayYear = currentDate.getFullYear();
    const displayDay = currentDate.getDate();

    return (
      <div className="w-full bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Progress Timelapse</h2>
          <button className="p-1 rounded border border-gray-200 hover:bg-gray-100" onClick={resetCalendarView}>
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">Back</span>
          </button>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-100"
              disabled={currentImageIndex === 0}
              onClick={() => {
                setIsPlayingTimelapse(false);
                setCurrentImageIndex(prev => Math.max(0, prev - 1));
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <span className="font-medium">{displayMonth} {displayDay}, {displayYear}</span>

            <button
              className="p-1 rounded border border-gray-200 hover:bg-gray-100"
              disabled={currentImageIndex === sampleImages.length - 1}
              onClick={() => {
                setIsPlayingTimelapse(false);
                setCurrentImageIndex(prev => Math.min(sampleImages.length - 1, prev + 1));
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
            <img src={currentImage.src} alt={`Progress photo from ${currentImage.date}`} className="max-w-full max-h-full" />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2 text-center">
              <div className="text-sm">
                <span className="font-bold">Weight:</span> {weightData[currentImageIndex]} kg&nbsp;&nbsp;
                <span className="font-bold">Body Fat:</span> {bodyFatData[currentImageIndex]}%
              </div>
            </div>
          </div>
        </div>

        <div className="w-full">
          <input
            type="range"
            min="0"
            max={sampleImages.length - 1}
            value={currentImageIndex}
            onChange={(e) => {
              setIsPlayingTimelapse(false);
              setCurrentImageIndex(parseInt(e.target.value));
            }}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{sampleImages[0].date}</span>
            <span>{sampleImages[sampleImages.length - 1].date}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-bold">{month} {year}</h2>
          <button className="ml-2 p-1 rounded-full hover:bg-gray-100" onClick={toggleTimelapse} title="Play timelapse of progress photos">
            <Play size={16} className="text-blue-600" />
          </button>
        </div>
        <div className="flex gap-2">
          <button className="p-1 rounded border border-gray-200 hover:bg-gray-100" onClick={previousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button className="p-1 rounded border border-gray-200 hover:bg-gray-100" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }, (_, i) => (
          <div key={`empty-${i}`} className="aspect-square"></div>
        ))}

        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const hasImage = dateHasImage(day);

          return (
            <button
              key={`day-${day}`}
              className={`aspect-square rounded-lg relative overflow-hidden border ${hasImage ? 'border-blue-500' : 'border-gray-200'} hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {hasImage && (
                <div className="absolute inset-0 bg-cover bg-center">
                  <img src="/api/placeholder/100/100" alt="" className="w-full h-full object-cover opacity-75" />
                </div>
              )}
              <div className={`absolute inset-0 flex items-center justify-center ${hasImage ? 'text-white font-bold shadow-sm' : 'text-gray-700'}`}>
                {day}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarWithPhotos;
