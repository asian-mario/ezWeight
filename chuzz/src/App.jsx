import React from "react";
import ProgressTracker from "./pages/ProgressTracker";
import { BodyProgressProvider } from "./context/BodyProgressProvider";

const App = () => {
  return (
    <BodyProgressProvider>
      <div className="min-h-screen bg-gray-50 p-4">
        <ProgressTracker />
      </div>
    </BodyProgressProvider>
  );
};

export default App;
