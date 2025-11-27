import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

import imageCompression from "browser-image-compression";

// Create context
const BodyProgressContext = createContext();

// 1MB max image size
const MAX_IMAGE_SIZE = 1024 * 1024;

export const BodyProgressProvider = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [directoryHandle, setDirectoryHandle] = useState(null);

  // Init OPFS
  useEffect(() => {
    const initOPFS = async () => {
      try {
        const root = await navigator.storage.getDirectory();

        const dirHandle = await root.getDirectoryHandle("progress-tracker", {
          create: true,
        });

        setDirectoryHandle(dirHandle);
        setIsReady(true);
      } catch (err) {
        console.error("Error initializing OPFS:", err);
        throw err;
      }
    };

    initOPFS();
  }, []);

  // image compression helper
  const compressImage = useCallback(async (file) => {
    const options = {
      maxSizeMB: 1,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (err) {
      console.error("Error compressing image:", err);
      throw err;
    }
  }, []);

  // save progress entry
  const saveProgressEntry = useCallback(
    async (date, image, weight, bodyFat) => {
      if (!isReady || !directoryHandle) {
        throw new Error("OPFS is not ready");
      }

      try {
        // create date directory
        const formattedDate = new Date(date).toISOString().split("T")[0];
        const dateDir = await directoryHandle.getDirectoryHandle(
          formattedDate,
          { create: true }
        );

        // save metrics
        const metricsFile = await dateDir.getFileHandle("metrics.json", {
          create: true,
        });
        const writer = await metricsFile.createWritable();
        await writer.write(JSON.stringify({ weight, bodyFat }, null, 2));
        await writer.close();

        // process image
        const compressedImage = await compressImage(image);
        if (compressedImage.size > MAX_IMAGE_SIZE) {
          throw new Error("Compressed image exceeds maximum size of 1MB");
        }

        const imageFileHandle = await dateDir.getFileHandle("image.jpg", {
          create: true,
        });
        const imageWriter = await imageFileHandle.createWritable();
        await imageWriter.write(compressedImage);
        await imageWriter.close();

        return formattedDate;
      } catch (err) {
        console.error("Error saving progress entry:", err);
        throw err;
      }
    },
    [compressImage, directoryHandle, isReady]
  );

  const deleteProgressEntry = useCallback(
    async (date) => {
      if (!isReady || !directoryHandle) {
        throw new Error("OPFS is not ready");
      }

      try {
        const formattedDate = new Date(date).toISOString().split("T")[0];

        directoryHandle.removeEntry(formattedDate, { recursive: true });
        return true;
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotFoundError") {
          return true; // don't care
        }

        console.error("Error deleting progress entry:", err);
        throw err;
      }
    },
    [directoryHandle, isReady]
  );

  const getProgressEntry = useCallback(
    async (date) => {
      if (!isReady || !directoryHandle) {
        throw new Error("OPFS is not ready");
      }

      try {
        const formattedDate = new Date(date).toISOString().split("T")[0];
        const dateDir = await directoryHandle.getDirectoryHandle(formattedDate);

        const metricsFile = await dateDir.getFileHandle("metrics.json");
        const metricsReader = await metricsFile.getFile();
        const metricsData = await metricsReader.text();
        const { weight, bodyFat } = JSON.parse(metricsData);

        const imageFile = await dateDir.getFileHandle("image.jpg");
        const imageReader = await imageFile.getFile();
        const imageBlob = URL.createObjectURL(imageReader);

        return { weight, bodyFat, image: imageBlob };
      } catch (err) {
        if (err instanceof DOMException && err.name === "NotFoundError") {
          // doesn't exist
          return null;
        }

        console.error("Error getting progress entry:", err);
        throw err;
      }
    },
    [directoryHandle, isReady]
  );

  const getProgressEntriesMonth = useCallback(
    async (monthDate) => {
      if (!isReady || !directoryHandle) {
        throw new Error("OPFS is not ready");
      }

      try {
        const year = monthDate.getFullYear();
        const month = monthDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const formattedMonth = `${year}-${String(month + 1).padStart(2, "0")}`;

        // Create entries map by day
        const entriesByDay = {};
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${formattedMonth}-${String(day).padStart(2, "0")}`;
          const entry = await getProgressEntry(dateStr);
          if (entry) {
            entriesByDay[day] = { ...entry, date: dateStr };
          }
        }

        return entriesByDay;
      } catch (err) {
        console.error("Error getting progress entries:", err);
        throw err;
      }
    },
    [directoryHandle, getProgressEntry, isReady]
  );

  const getAllMetrics = useCallback(async () => {
    if (!isReady || !directoryHandle) {
      throw new Error("OPFS is not ready");
    }

    try {
      const metrics = [];

      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === "directory") {
          try {
            const metricsFile = await handle.getFileHandle("metrics.json");
            const metricsReader = await metricsFile.getFile();
            const metricsData = await metricsReader.text();
            const { weight, bodyFat } = JSON.parse(metricsData);
            metrics.push({ date: name, weight: parseFloat(weight), bodyFat: parseFloat(bodyFat) });
          } catch {
            // Skip entries without metrics
          }
        }
      }

      // Sort by date
      metrics.sort((a, b) => new Date(a.date) - new Date(b.date));
      return metrics;
    } catch (err) {
      console.error("Error getting all metrics:", err);
      throw err;
    }
  }, [directoryHandle, isReady]);

  // Get all entries with images (for timelapse/gallery)
  const getAllEntries = useCallback(async () => {
    if (!isReady || !directoryHandle) {
      throw new Error("OPFS is not ready");
    }

    try {
      const entries = [];

      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === "directory") {
          try {
            const metricsFile = await handle.getFileHandle("metrics.json");
            const metricsReader = await metricsFile.getFile();
            const metricsData = await metricsReader.text();
            const { weight, bodyFat } = JSON.parse(metricsData);

            const imageFile = await handle.getFileHandle("image.jpg");
            const imageReader = await imageFile.getFile();
            const imageBlob = URL.createObjectURL(imageReader);

            entries.push({
              date: name,
              weight: parseFloat(weight),
              bodyFat: parseFloat(bodyFat),
              image: imageBlob,
            });
          } catch {
            // Skip entries without complete data
          }
        }
      }

      // Sort by date
      entries.sort((a, b) => new Date(a.date) - new Date(b.date));
      return entries;
    } catch (err) {
      console.error("Error getting all entries:", err);
      throw err;
    }
  }, [directoryHandle, isReady]);

  // Export all data as JSON with base64 images
  const exportAllData = useCallback(async () => {
    if (!isReady || !directoryHandle) {
      throw new Error("OPFS is not ready");
    }

    try {
      const exportData = [];

      for await (const [name, handle] of directoryHandle.entries()) {
        if (handle.kind === "directory") {
          try {
            const metricsFile = await handle.getFileHandle("metrics.json");
            const metricsReader = await metricsFile.getFile();
            const metricsData = await metricsReader.text();
            const { weight, bodyFat } = JSON.parse(metricsData);

            const imageFile = await handle.getFileHandle("image.jpg");
            const imageReader = await imageFile.getFile();
            const arrayBuffer = await imageReader.arrayBuffer();
            const base64 = btoa(
              new Uint8Array(arrayBuffer).reduce(
                (data, byte) => data + String.fromCharCode(byte),
                ""
              )
            );

            exportData.push({
              date: name,
              weight: parseFloat(weight),
              bodyFat: parseFloat(bodyFat),
              imageBase64: base64,
            });
          } catch {
            // Skip incomplete entries
          }
        }
      }

      exportData.sort((a, b) => new Date(a.date) - new Date(b.date));
      return exportData;
    } catch (err) {
      console.error("Error exporting data:", err);
      throw err;
    }
  }, [directoryHandle, isReady]);

  // Import data from JSON backup
  const importData = useCallback(
    async (importedData) => {
      if (!isReady || !directoryHandle) {
        throw new Error("OPFS is not ready");
      }

      try {
        for (const entry of importedData) {
          const { date, weight, bodyFat, imageBase64 } = entry;
          
          // Create date directory
          const dateDir = await directoryHandle.getDirectoryHandle(date, {
            create: true,
          });

          // Save metrics
          const metricsFile = await dateDir.getFileHandle("metrics.json", {
            create: true,
          });
          const writer = await metricsFile.createWritable();
          await writer.write(JSON.stringify({ weight, bodyFat }, null, 2));
          await writer.close();

          // Convert base64 to blob and save image
          const binaryStr = atob(imageBase64);
          const bytes = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            bytes[i] = binaryStr.charCodeAt(i);
          }
          const imageBlob = new Blob([bytes], { type: "image/jpeg" });

          const imageFileHandle = await dateDir.getFileHandle("image.jpg", {
            create: true,
          });
          const imageWriter = await imageFileHandle.createWritable();
          await imageWriter.write(imageBlob);
          await imageWriter.close();
        }

        return true;
      } catch (err) {
        console.error("Error importing data:", err);
        throw err;
      }
    },
    [directoryHandle, isReady]
  );

  const value = {
    isReady,
    saveProgressEntry,
    deleteProgressEntry,
    getProgressEntry,
    getProgressEntriesMonth,
    getAllMetrics,
    getAllEntries,
    exportAllData,
    importData,
  };

  return (
    <BodyProgressContext.Provider value={value}>
      {children}
    </BodyProgressContext.Provider>
  );
};

export const useBodyProgress = () => {
  const context = useContext(BodyProgressContext);
  if (!context) {
    throw new Error(
      "useBodyProgress must be used within a BodyProgressProvider"
    );
  }
  return context;
};
