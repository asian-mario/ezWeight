// src/utils/calendarHelpers.js

// 1) Your list of photos
export const sampleImages = [
    { date: '2025-01-01', src: '/api/placeholder/400/400?text=Jan+1' },
    { date: '2025-01-15', src: '/api/placeholder/400/400?text=Jan+15' },
    { date: '2025-02-01', src: '/api/placeholder/400/400?text=Feb+1' },
    { date: '2025-02-15', src: '/api/placeholder/400/400?text=Feb+15' },
    { date: '2025-03-01', src: '/api/placeholder/400/400?text=Mar+1' },
    { date: '2025-03-15', src: '/api/placeholder/400/400?text=Mar+15' },
    { date: '2025-04-01', src: '/api/placeholder/400/400?text=Apr+1' },
    { date: '2025-04-03', src: '/api/placeholder/400/400?text=Apr+3' },
    { date: '2025-04-06', src: '/api/placeholder/400/400?text=Apr+6' },
    { date: '2025-04-09', src: '/api/placeholder/400/400?text=Apr+9' },
    { date: '2025-04-12', src: '/api/placeholder/400/400?text=Apr+12' },
    { date: '2025-04-15', src: '/api/placeholder/400/400?text=Apr+15' },
    { date: '2025-04-18', src: '/api/placeholder/400/400?text=Apr+18' },
    { date: '2025-04-24', src: '/api/placeholder/400/400?text=Apr+24' },
    { date: '2025-04-27', src: '/api/placeholder/400/400?text=Apr+27' },
  ];
  
  const imageDateSet = new Set(sampleImages.map(img => img.date));
  
  const getDateKey = date => date.toISOString().split('T')[0];

  export function dateHasImage(day, monthDate) {
    const year = monthDate.getFullYear();
    const month = String(monthDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return imageDateSet.has(`${year}-${month}-${dayStr}`);
  }

  export function getGlowLevel(day, monthDate) {
    const target = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
    let closest = Infinity;
  
    for (let i = 1; i <= 3; i++) {
      const before = new Date(target); before.setDate(target.getDate() - i);
      const after  = new Date(target); after.setDate(target.getDate() + i);
  
      if (imageDateSet.has(getDateKey(before))) closest = Math.min(closest, i);
      if (imageDateSet.has(getDateKey(after)))  closest = Math.min(closest, i);
    }
  
    return closest === Infinity ? 0 : closest;
  }
  

  export function isMonthlyStreak(monthDate) {
    if (!(monthDate instanceof Date) || isNaN(monthDate)) {
      console.warn('isMonthlyStreak: expected a valid Date, got', monthDate);
      return false;
    }
  
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
  
    for (let day = 1; day <= daysInMonth; day++) {
      if (dateHasImage(day, monthDate)) continue;
      if (getGlowLevel(day, monthDate) > 0) continue;
      return false;
    }
    return true;
  }
  