import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Camera, Upload, Download, X } from 'lucide-react';
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
  const [weightData, setWeightData] = useState([]);
  const [bodyFatData, setBodyFatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const { isReady, saveProgressEntry, getAllMetrics, exportAllData, importData } = useBodyProgress();

  // Load metrics from OPFS
  const loadMetrics = useCallback(async () => {
    if (!isReady) return;
    
    setLoading(true);
    try {
      const metrics = await getAllMetrics();
      
      if (metrics.length > 0) {
        // Transform data for charts
        const weightArr = metrics.map(m => ({ date: m.date, weight: m.weight }));
        const bodyFatArr = metrics.map(m => ({ date: m.date, bodyFat: m.bodyFat }));
        
        setWeightData(weightArr);
        setBodyFatData(bodyFatArr);
      } else {
        setWeightData([]);
        setBodyFatData([]);
      }
    } catch (err) {
      console.error("Error loading metrics:", err);
      setWeightData([]);
      setBodyFatData([]);
    } finally {
      setLoading(false);
    }
  }, [isReady, getAllMetrics]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics, refreshKey]);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
    setCameraMode(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setFormData((prev) => ({ ...prev, photo: file }));
      setCameraMode(false);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Camera functions
  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setCameraMode(true);
      
      // Wait for next tick to ensure videoRef is available
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setCameraMode(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        setFormData((prev) => ({ ...prev, photo: file }));
        stopCamera();
      }
    }, 'image/jpeg', 0.9);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      formData.photo &&
      formData.weight &&
      formData.bodyFat &&
      formData.date
    ) {
      try {
        await saveProgressEntry(
          formData.date,
          formData.photo,
          formData.weight,
          formData.bodyFat
        );
        setIsDialogOpen(false);
        setFormData({ weight: "", bodyFat: "", date: "", photo: null });
        stopCamera();
        // Refresh data
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        console.error("Error saving entry:", err);
        alert("Failed to save entry. Please try again.");
      }
    } else {
      alert("Please fill out all fields and upload a photo.");
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({ weight: "", bodyFat: "", date: "", photo: null });
    stopCamera();
  };

  // Export functionality
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ezweight-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export error:", err);
      alert("Failed to export data. Please try again.");
    }
  };

  // Import functionality
  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!Array.isArray(data)) {
        throw new Error("Invalid backup format");
      }
      
      await importData(data);
      setRefreshKey(prev => prev + 1);
      alert("Data imported successfully!");
    } catch (err) {
      console.error("Import error:", err);
      alert("Failed to import data. Please ensure the file is a valid backup.");
    }
    
    // Reset file input
    e.target.value = '';
  };

  const handleDataChange = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      <header className="mb-6 flex justify-between items-center flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ezWeight</h1>
          <p className="text-gray-500">Track your fitness journey</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Export/Import buttons */}
          <button
            className="p-2 rounded border border-gray-200 hover:bg-gray-100"
            onClick={handleExport}
            title="Export Data"
          >
            <Download size={16} />
          </button>
          <label
            className="p-2 rounded border border-gray-200 hover:bg-gray-100 cursor-pointer"
            title="Import Data"
          >
            <Upload size={16} />
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus size={16} />
            <span>Add Photo</span>
          </button>
        </div>
      </header>

      <div className="space-y-6 pb-16">
        <StreakBadge />
        <CalendarWithPhotos onDataChange={handleDataChange} key={refreshKey} />
        
        {/* Charts - only show if we have data */}
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : weightData.length > 0 && bodyFatData.length > 0 ? (
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
        ) : (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            <p className="text-lg mb-2">No progress data yet</p>
            <p className="text-sm">Add your first photo to start tracking your progress!</p>
          </div>
        )}
      </div>

      <Modal
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        title="Upload Progress Photo"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Camera/Upload toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                setCameraMode(false);
              }}
              className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${
                !cameraMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Upload size={16} />
              Upload
            </button>
            <button
              type="button"
              onClick={startCamera}
              className={`flex-1 py-2 px-4 rounded flex items-center justify-center gap-2 ${
                cameraMode ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              <Camera size={16} />
              Camera
            </button>
          </div>

          {/* Camera view */}
          {cameraMode && (
            <div className="relative">
              {cameraError ? (
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-red-300 rounded-lg p-8 bg-red-50">
                  <p className="text-red-600 text-center">{cameraError}</p>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="mt-4 text-sm text-gray-600 underline"
                  >
                    Switch to upload
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full rounded-lg bg-black"
                  />
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-4 shadow-lg hover:bg-gray-100"
                  >
                    <Camera size={24} className="text-blue-600" />
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}

          {/* File upload area */}
          {!cameraMode && (
            <label
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              htmlFor="fileInput"
              className="flex flex-col cursor-pointer items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 hover:bg-gray-100"
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
                  <p className="text-sm text-green-600 mt-2">
                    ✓ {formData.photo.name}
                  </p>
                )}
              </div>
            </label>
          )}

          {/* Show captured photo preview */}
          {formData.photo && !cameraMode && (
            <div className="relative">
              <img
                src={URL.createObjectURL(formData.photo)}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, photo: null }))}
                className="absolute top-2 right-2 bg-white rounded-full p-1 shadow"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                name="weight"
                step="0.1"
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
                step="0.1"
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
