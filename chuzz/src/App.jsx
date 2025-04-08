import React, { useState, useEffect, useRef } from 'react';
import { Camera, Play, ChevronLeft, ChevronRight, Plus, Pause } from 'lucide-react';

const ProgressTracker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isPlayingTimelapse, setIsPlayingTimelapse] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);
  
  // Sample data for the charts
  const weightData = [
    { date: '2025-01-01', weight: 185 },
    { date: '2025-01-15', weight: 182 },
    { date: '2025-02-01', weight: 180 },
    { date: '2025-02-15', weight: 178 },
    { date: '2025-03-01', weight: 176 },
    { date: '2025-03-15', weight: 174 },
    { date: '2025-04-01', weight: 172 },
  ];
  
  const bodyFatData = [
    { date: '2025-01-01', bodyFat: 22 },
    { date: '2025-01-15', bodyFat: 21 },
    { date: '2025-02-01', bodyFat: 20 },
    { date: '2025-02-15', bodyFat: 19 },
    { date: '2025-03-01', bodyFat: 18.5 },
    { date: '2025-03-15', bodyFat: 17.5 },
    { date: '2025-04-01', bodyFat: 16.5 },
  ];
  
  // Sample gallery images with dates
  const sampleImages = [
    { date: '2025-01-01', src: '/api/placeholder/400/400?text=Jan+1' },
    { date: '2025-01-15', src: '/api/placeholder/400/400?text=Jan+15' },
    { date: '2025-02-01', src: '/api/placeholder/400/400?text=Feb+1' },
    { date: '2025-02-15', src: '/api/placeholder/400/400?text=Feb+15' },
    { date: '2025-03-01', src: '/api/placeholder/400/400?text=Mar+1' },
    { date: '2025-03-15', src: '/api/placeholder/400/400?text=Mar+15' },
    { date: '2025-04-01', src: '/api/placeholder/400/400?text=Apr+1' },
  ];

  // Auto-advance images when playing timelapse
  useEffect(() => {
    let interval;
    if (isPlayingTimelapse) {
      interval = setInterval(() => {
        setCurrentImageIndex(prev => {
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

  // Toggle timelapse play/pause
  const toggleTimelapse = () => {
    if (!isCalendarExpanded) {
      setIsPlayingTimelapse(!isPlayingTimelapse);
    } else {
      // First collapse the calendar, then start the timelapse
      setIsCalendarExpanded(false);
      setTimeout(() => setIsPlayingTimelapse(true), 500);
    }
  };

  // Reset to normal calendar view
  const resetCalendarView = () => {
    setIsPlayingTimelapse(false);
    setIsCalendarExpanded(true);
    setCurrentImageIndex(0);
  };

  // Modal component
  const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full max-h-full overflow-auto">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
            </div>
          </div>
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    );
  };

  // Calendar component with photo backgrounds
  const CalendarWithPhotos = () => {
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1).getDay();
    const month = selectedDate.toLocaleString('default', { month: 'long' });
    const year = selectedDate.getFullYear();
    
    // Days of the week header
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Check if date has an image
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

    // If we're in timelapse mode, show the carousel
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
              <img 
                src={currentImage.src} 
                alt={`Progress photo from ${currentImage.date}`} 
                className="max-w-full max-h-full"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white p-2 text-center">
                {currentImageIndex > 0 && (
                  <div className="text-sm">
                    <span className="font-bold">Weight:</span> {weightData[currentImageIndex].weight} kg
                    &nbsp;&nbsp;
                    <span className="font-bold">Body Fat:</span> {bodyFatData[currentImageIndex].bodyFat}%
                  </div>
                )}
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
    
    // Regular calendar view
    return (
      <div className="w-full bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <h2 className="text-xl font-bold">{month} {year}</h2>
            <button 
              className="ml-2 p-1 rounded-full hover:bg-gray-100" 
              onClick={toggleTimelapse}
              title="Play timelapse of progress photos"
            >
              <Play size={16} className="text-blue-600" />
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              className="p-1 rounded border border-gray-200 hover:bg-gray-100" 
              onClick={previousMonth}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button 
              className="p-1 rounded border border-gray-200 hover:bg-gray-100" 
              onClick={nextMonth}
            >
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
          
          {/* Empty cells for days before the first day of month */}
          {Array.from({ length: firstDayOfMonth }, (_, i) => (
            <div key={`empty-${i}`} className="aspect-square"></div>
          ))}
          
          {/* Calendar days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const hasImage = dateHasImage(day);
            
            return (
              <button
                key={`day-${day}`}
                className={`aspect-square rounded-lg relative overflow-hidden border ${
                  hasImage ? 'border-blue-500' : 'border-gray-200'
                } hover:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                onClick={() => {
                  // Handle day selection
                }}
              >
                {hasImage && (
                  <div className="absolute inset-0 bg-cover bg-center">
                    <img src="/api/placeholder/100/100" alt="" className="w-full h-full object-cover opacity-75" />
                  </div>
                )}
                <div className={`absolute inset-0 flex items-center justify-center ${
                  hasImage ? 'text-white font-bold shadow-sm' : 'text-gray-700'
                }`}>
                  {day}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Simple line chart component
  const SimpleLineChart = ({ data, dataKey, color }) => {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
    const [animate, setAnimate] = useState(false);
    const [pathLength, setPathLength] = useState(0);
  
    const containerRef = useRef(null);
    const pointRefs = useRef([]);
    const pathRef = useRef(null);
  
    const values = data.map((item) => item[dataKey]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const chartPadding = 5;
  
    const circleCoords = data.map((item, index) => {
      const x = chartPadding + (index / (data.length - 1)) * (100 - chartPadding * 2);
      const normalizedValue = (item[dataKey] - min) / range;
      const y = 90 - normalizedValue * 80;
      return { x, y };
    });
  
    const generatePath = (coords) => {
      if (coords.length < 2) return "";
      let d = `M ${coords[0].x},${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const prev = coords[i - 1];
        const curr = coords[i];
        const cx = (prev.x + curr.x) / 2;
        d += ` Q ${prev.x},${prev.y} ${cx},${(prev.y + curr.y) / 2}`;
      }
      d += ` T ${coords[coords.length - 1].x},${coords[coords.length - 1].y}`;
      return d;
    };
  
    // Tooltip positioning
    useEffect(() => {
      if (hoveredIndex === null) return;
      const circle = pointRefs.current[hoveredIndex];
      const container = containerRef.current;
  
      if (circle && container) {
        const circleBox = circle.getBoundingClientRect();
        const containerBox = container.getBoundingClientRect();
        setTooltipPos({
          x: circleBox.left - containerBox.left + circleBox.width / 2,
          y: circleBox.top - containerBox.top,
        });
      }
    }, [hoveredIndex]);
  
    // Get total path length
    useEffect(() => {
      if (pathRef.current) {
        const length = pathRef.current.getTotalLength();
        setPathLength(length);
      }
    }, [data]);
  
    // 🔥 NEW INTERSECTION OBSERVER FIX: Detect if already visible too
    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
  
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            // trigger animation
            setAnimate(false);
            requestAnimationFrame(() => {
              requestAnimationFrame(() => setAnimate(true));
            });
          } else {
            // reset animation if it leaves view
            setAnimate(false);
          }
        },
        {
          threshold: 0.4,
        }
      );
  
      observer.observe(el);
  
      // 💡 Check manually in case it's already in view on load
      if (el.getBoundingClientRect().top < window.innerHeight) {
        setAnimate(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setAnimate(true));
        });
      }
  
      return () => observer.disconnect();
    }, []);
  
    return (
      <div
        className="w-full h-60 bg-white p-4 rounded border border-gray-200 relative"
        ref={containerRef}
      >
        {/* Y-axis */}
        <div className="absolute left-2 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-400 pointer-events-none z-10">
          <span>{max}</span>
          <span>{((max + min) / 2).toFixed(1)}</span>
          <span>{min}</span>
        </div>
  
        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-20 text-xs bg-white px-2 py-1 rounded shadow border border-gray-300 pointer-events-none transition-opacity duration-200"
            style={{
              left: `${tooltipPos.x}px`,
              top: `${tooltipPos.y}px`,
              transform: "translate(-50%, -100%)",
              whiteSpace: "nowrap",
            }}
          >
            <span className="font-medium">{data[hoveredIndex].date}</span>
            <br />
            <span className="text-gray-600">
              {data[hoveredIndex][dataKey]}
              {dataKey === "bodyFat" ? "%" : " kg"}
            </span>
          </div>
        )}
  
        {/* SVG chart */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full aspect-[2/1]"
        >
          <defs>
            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={color} />
              <stop offset="100%" stopColor="#000000" />
            </linearGradient>
          </defs>
  
          {/* Grid lines */}
          {[20, 40, 60, 80].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="#f1f1f1" strokeWidth="1" />
          ))}
  
          {/* Animated path line */}
          <path
            ref={pathRef}
            d={generatePath(circleCoords)}
            fill="none"
            stroke={`url(#gradient-${dataKey})`}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: pathLength,
              strokeDashoffset: animate ? 0 : pathLength,
              transition: "stroke-dashoffset 1s ease-out",
            }}
          />
  
          {/* Data points */}
          {circleCoords.map((point, i) => (
            <circle
              key={i}
              ref={(el) => (pointRefs.current[i] = el)}
              cx={point.x}
              cy={point.y}
              r="2.5"
              fill="white"
              stroke={color}
              strokeWidth="1.5"
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          ))}
        </svg>
  
        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{data[0].date}</span>
          <span>{data[data.length - 1].date}</span>
        </div>
      </div>
    );
  };
  
  
  

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4">
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Progress Tracker</h1>
          <p className="text-gray-500">Track your fitness journey</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2"
          onClick={() => setIsDialogOpen(true)}
        >
          <Plus size={16} />
          <span>Add Photo</span>
        </button>
      </header>
      
      {/* Main content */}
      <div className="flex-1 pb-16">
        <div className="space-y-6">
          <CalendarWithPhotos />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Weight Progress</h3>
              <SimpleLineChart data={weightData} dataKey="weight" color="#3b82f6" />
              
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Starting</p>
                  <p className="text-lg font-bold">185 kg</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold">172 kg</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Lost</p>
                  <p className="text-lg font-bold text-green-600">-13 kg</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-2">Body Fat Progress</h3>
              <SimpleLineChart data={bodyFatData} dataKey="bodyFat" color="#8b5cf6" />
              
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Starting</p>
                  <p className="text-lg font-bold">22%</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Current</p>
                  <p className="text-lg font-bold">16.5%</p>
                </div>
                <div className="bg-gray-50 p-2 rounded">
                  <p className="text-xs text-gray-500">Change</p>
                  <p className="text-lg font-bold text-green-600">-5.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Photo upload modal */}
      <Modal 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title="Upload Progress Photo"
      >
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
            <Camera size={40} className="text-gray-400 mb-4" />
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">Drag and drop your photo here, or click to browse</p>
              <button className="bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-sm">Choose File</button>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" className="w-full p-2 border rounded-md" placeholder="0.0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Body Fat %</label>
              <input type="number" className="w-full p-2 border rounded-md" placeholder="0.0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" className="w-full p-2 border rounded-md" defaultValue="2025-04-06" />
            </div>
          </div>
          
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4">
            Upload Progress Photo
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ProgressTracker;