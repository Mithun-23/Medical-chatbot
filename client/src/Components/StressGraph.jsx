import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';

const StressGraph = () => {
  // Manually entered data
  const heartRateData = [72, 75, 78, 80, 76, 74, 70, 85, 90, 88];
  const sleepData = [
    { totalSleep: 7, timeInBed: 8 },
    { totalSleep: 6, timeInBed: 8 },
    { totalSleep: 5, timeInBed: 7 },
    { totalSleep: 7, timeInBed: 8 },
    { totalSleep: 8, timeInBed: 9 },
    { totalSleep: 6, timeInBed: 7 },
    { totalSleep: 5, timeInBed: 6 },
    { totalSleep: 4, timeInBed: 6 },
    { totalSleep: 3, timeInBed: 5 },
    { totalSleep: 6, timeInBed: 7 },
  ];

  const [stressData, setStressData] = useState([]);

  useEffect(() => {
    if (heartRateData.length && sleepData.length) {
      const stressIndex = heartRateData.map((hr, index) => {
        const rhr = Math.min(...heartRateData); // Resting Heart Rate
        const currentRHR = hr;

        // Calculate HRV (Heart Rate Variability)
        const rri = 60000 / currentRHR; // R-R Interval
        const avgRRI = 60000 / rhr;
        const hrv = Math.abs(avgRRI - rri);

        // Sleep Efficiency
        const totalSleep = sleepData[index].totalSleep;
        const timeInBed = sleepData[index].timeInBed;
        const sleepEfficiency = (totalSleep / timeInBed) * 100;

        // Stress Calculation
        const stress = ((currentRHR - rhr) / rhr * 100) +
          ((avgRRI - rri) / avgRRI * 100) -
          (sleepEfficiency / 100 * 10);

        return stress.toFixed(2);
      });

      setStressData(stressIndex);
    }
  }, []);

  const data = {
    labels: heartRateData.map((_, index) => `Day ${index + 1}`),
    datasets: [
      {
        label: 'Stress Index',
        data: stressData,
        borderColor: '#FF6384',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: true,
      },
    ],
  };

  return (
    <div>
      <h2>Stress Level Over Time</h2>
      <Line data={data} />
    </div>
  );
};

export default StressGraph;
