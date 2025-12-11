import React from 'react';
import SimpleLineChart from './Chart';

const StatsSummary = ({ title, data, dataKey, color, unit }) => {
  // Guard against empty data
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-gray-500 text-center py-8">No data available</p>
      </div>
    );
  }

  const start = data[0][dataKey];
  const end = data[data.length - 1][dataKey];
  const diff = (end - start).toFixed(1);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="font-semibold mb-2">{title}</h3>
      <SimpleLineChart data={data} dataKey={dataKey} color={color} />
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Starting</p>
          <p className="text-lg font-bold">{start}{unit}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Current</p>
          <p className="text-lg font-bold">{end}{unit}</p>
        </div>
        <div className="bg-gray-50 p-2 rounded">
          <p className="text-xs text-gray-500">Change</p>
          <p className={`text-lg font-bold ${diff < 0 ? 'text-green-600' : 'text-red-600'}`}>
            {diff > 0 ? '+' : ''}{diff}{unit}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatsSummary;
