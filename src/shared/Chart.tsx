import React, { useEffect, useRef, useState } from 'react';
import { createChart, type LineData, LineSeries } from 'lightweight-charts';
import { DataService } from './dataService';

const Chart: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<ReturnType<typeof createChart> | null>(null);
  const seriesRef = useRef<ReturnType<ReturnType<typeof createChart>['addSeries']> | null>(null);
  const [data, setData] = useState<LineData[]>([]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      autoSize: true,
    });

    const lineSeries = chart.addSeries(LineSeries);
    chartRef.current = chart;
    seriesRef.current = lineSeries;

    // Cleanup
    return () => {
      chart.remove();
    };
  }, []);

  // Poll for data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newData = DataService.getData('stocks:ADA-USD') as LineData[] || [];
      console.log("Fetched new data:", newData);
      if (JSON.stringify(newData) !== JSON.stringify(data)) {
        setData(newData);
      }
    }, 500); // Check every 500ms

    return () => clearInterval(interval);
  }, [data]);

  // Update chart when data changes
  useEffect(() => {
    if (seriesRef.current) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full h-full bg-gray-50 rounded-lg shadow-lg border border-gray-200 p-2" />;
};

export default Chart;