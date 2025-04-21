import React, { useState } from 'react';
import { Plus, Camera } from 'lucide-react';
import CalendarWithPhotos from '../components/CalendarWithPhotos';
import Modal from '../components/Modal';
import StatsSummary from '../components/StatsSummary';
import StreakBadge from '../components/StreakBadge'
import { useBodyProgress } from '../context/BodyProgressProvider';

const ProgressTracker = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "",
    bodyFat: "",
    date: "",
    photo: null,
  });

  const { saveProgressEntry } = useBodyProgress();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData({ photo: file });
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      formData.photo &&
      formData.weight &&
      formData.bodyFat &&
      formData.date
    ) {
      saveProgressEntry(
        formData.date,
        formData.photo,
        formData.weight,
        formData.bodyFat
      );
      setIsDialogOpen(false);
      setFormData({ weight: "", bodyFat: "", date: "", photo: null });
    } else {
      alert("Please fill out all fields and upload a photo.");
    }
  };

  const weightData = [
    { date: '2025-01-01', weight: 185 },
    { date: '2025-01-15', weight: 182 },
    { date: '2025-02-01', weight: 180 },
    { date: '2025-02-15', weight: 178 },
    { date: '2025-03-01', weight: 176 },
    { date: '2025-03-15', weight: 174 },
    { date: '2025-04-01', weight: 172 },
    { date: '2025-04-03', weight: 171 },
    { date: '2025-04-06', weight: 170 },
    { date: '2025-04-09', weight: 169 },
    { date: '2025-04-12', weight: 168 },
    { date: '2025-04-15', weight: 167.5 },
    { date: '2025-04-18', weight: 167 },
    { date: '2025-04-24', weight: 166 },
    { date: '2025-04-27', weight: 165.5 },
  ];

  const bodyFatData = [
    { date: '2025-01-01', bodyFat: 22 },
    { date: '2025-01-15', bodyFat: 21 },
    { date: '2025-02-01', bodyFat: 20 },
    { date: '2025-02-15', bodyFat: 19 },
    { date: '2025-03-01', bodyFat: 18.5 },
    { date: '2025-03-15', bodyFat: 17.5 },
    { date: '2025-04-01', bodyFat: 16.5 },
    { date: '2025-04-03', bodyFat: 16.4 },
    { date: '2025-04-06', bodyFat: 16.2 },
    { date: '2025-04-09', bodyFat: 16.0 },
    { date: '2025-04-12', bodyFat: 15.8 },
    { date: '2025-04-15', bodyFat: 15.6 },
    { date: '2025-04-18', bodyFat: 15.4 },
    { date: '2025-04-24', bodyFat: 15.0 },
    { date: '2025-04-27', bodyFat: 14.8 },
  ];

  return (
    <>
      <header className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ezWeight</h1>
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
        <StreakBadge />
        <CalendarWithPhotos />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <StatsSummary
            title="Weight Progress"
            data={weightData}
            dataKey="weight"
            color="#3b82f6"
            unit="kg"
          />
          <StatsSummary
            title="Body Fat Progress"
            data={bodyFatData}
            dataKey="bodyFat"
            color="#8b5cf6"
            unit="%"
          />
        </div>
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title="Upload Progress Photo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <label
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            htmlFor="fileInput"
            className="flex flex-col cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50"
          >
            <Camera size={40} className="text-gray-400 mb-4" />
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-500">
                Drag and drop your photo here, or click to browse
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="fileInput"
              />
              {formData.photo && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {formData.photo.name}
                </p>
              )}
            </div>
          </label>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Body Fat %
              </label>
              <input
                type="number"
                name="bodyFat"
                value={formData.bodyFat}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
                placeholder="0.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4"
          >
            Upload Progress Photo
          </button>
        </form>
      </Modal>
    </>
  );
};

export default ProgressTracker;
