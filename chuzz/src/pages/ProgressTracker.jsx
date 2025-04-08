import React, { useState, useEffect } from 'react';
import { Plus, Camera } from 'lucide-react';
import CalendarWithPhotos from '../components/CalendarWithPhotos';
import SimpleLineChart from '../components/Chart';
import Modal from '../components/Modal';
import StatsSummary from '../components/StatsSummary';


const ProgressTracker = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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

  return (
    <>
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

      <div className="space-y-6 pb-16">
        <CalendarWithPhotos />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatsSummary title="Weight Progress" data={weightData} dataKey="weight" color="#3b82f6" unit="kg" />
          <StatsSummary title="Body Fat Progress" data={bodyFatData} dataKey="bodyFat" color="#8b5cf6" unit="%" />
        </div>
      </div>

      <Modal isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} title="Upload Progress Photo">
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
    </>
  );
};

export default ProgressTracker;
