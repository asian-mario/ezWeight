import React, { useState, useEffect, useRef } from "react";

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
    // Handle single data point case - center it
    const x = data.length === 1 
      ? 50 
      : chartPadding + (index / (data.length - 1)) * (100 - chartPadding * 2);
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

export default SimpleLineChart;
