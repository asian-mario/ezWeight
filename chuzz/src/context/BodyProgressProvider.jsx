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
        const formattedMonth = monthDate
          .toISOString()
          .split("T")[0]
          .slice(0, 7);

        // array of 0 to 31
        let entries = [];
        for (let i = 1; i < 32; i++)
          entries.push(await getProgressEntry(`${formattedMonth}-${i}`));

        return entries.filter((entry) => entry !== null);
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
      const entries = await directoryHandle.getEntries();
      const metrics = [];

      for (const entry of entries) {
        if (entry.isDirectory) {
          const metricsFile = await entry.getFileHandle("metrics.json");
          const metricsReader = await metricsFile.getFile();
          const metricsData = await metricsReader.text();
          const { weight, bodyFat } = JSON.parse(metricsData);
          metrics.push({ date: entry.name, weight, bodyFat });
        }
      }

      return metrics;
    } catch (err) {
      console.error("Error getting all metrics:", err);
      throw err;
    }
  }, [directoryHandle, isReady]);

  const value = {
    isReady,
    saveProgressEntry,
    deleteProgressEntry,
    getProgressEntry,
    getProgressEntriesMonth,
    getAllMetrics,
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
