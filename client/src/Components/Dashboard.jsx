import React, { useContext, useEffect, useState } from "react";
import { axiosClient } from "../axios";
import {
  LineChart,
  AreaChart, Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar
} from "recharts";
import { ThemeContext } from "./ThemeContext";
import StressGraph from "./StressGraph";

export const HeartRateComponent = () => {
  const [heartRateData, setHeartRateData] = useState([]);
  const [heartRateZones, setHeartRateZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);
  const timeframe = "1d";

  useEffect(() => {
    const fetchHeartRateData = async () => {
      const token = localStorage.getItem("fitbit_access_token");
      if (!token) {
        console.log("No access token, redirecting to login...");
        window.location.href = "/";
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };


        const heartRateResponse = await axiosClient.get(
          `https://api.fitbit.com/1/user/-/activities/heart/date/today/${timeframe}.json`,
          { headers }
        );

        console.log("Heart Rate Data:", heartRateResponse.data);

        // const heartRateDict = createFitbitDataDictionary(heartRateResponse.data);
        // console.log("Heart Rate Dictionary:", heartRateDict);
        const heartData = heartRateResponse.data["activities-heart"].map((item) => ({
          date: item.dateTime,
          outOfRange: item.value.heartRateZones[0]?.minutes || 0,
          fatBurn: item.value.heartRateZones[1]?.minutes || 0,
          cardio: item.value.heartRateZones[2]?.minutes || 0,
          peak: item.value.heartRateZones[3]?.minutes || 0,
          restingHeartRate: item.value.restingHeartRate || 0
        }));

        setHeartRateZones(heartData);


        try {
          const intradayResponse = await axiosClient.get(
            `https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json`,
            { headers }
          );

          console.log("Intraday Heart Rate:", intradayResponse.data);

          // const intradayDict = createFitbitDataDictionary(intradayResponse.data);
          // console.log("Intraday Heart Rate Dictionary:", intradayDict);
          if (intradayResponse.data["activities-heart-intraday"]?.dataset) {
            const intradayData = intradayResponse.data["activities-heart-intraday"].dataset.map(item => ({
              time: item.time,
              value: item.value
            }));

            setHeartRateData(intradayData);
          }
        } catch (intradayError) {
          console.log("Intraday data not available:", intradayError);

        }
      } catch (error) {
        console.error("Error fetching Fitbit heart rate data:", error);
        setError("Failed to load heart rate data");
      } finally {
        setLoading(false);
      }
    };

    fetchHeartRateData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className={`dashboard-container ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-white text-xl font-semibold mb-4`}>Heart Rate Data</h2>
        <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Loading heart rate data...</div>
      </div>
    );
  }

  if (error && heartRateZones.length === 0) {
    return (
      <div className={`dashboard-container ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Heart Rate Data</h2>
        <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Heart Rate Data</h2>


      <div className={`dashboard-container mb-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h3 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-lg font-medium mb-2`}>Time in Heart Rate Zones (minutes)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={heartRateZones}>
            <XAxis dataKey="date" tick={{ fill: "#fff" }} />
            <YAxis tick={{ fill: "#fff" }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <Legend />
            <Bar dataKey="outOfRange" fill="#ff4757" name="Out of Range" />
            <Bar dataKey="fatBurn" fill="#FFA500" name="Fat Burn" />
            <Bar dataKey="cardio" fill="#1e90ff" name="Cardio" />
            <Bar dataKey="peak" fill="#32cd32" name="Peak" />
          </BarChart>
        </ResponsiveContainer>
      </div>


      {heartRateZones.length > 0 && heartRateZones[0].restingHeartRate > 0 && (
        <div className={`mb-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-100 "}`}>
          <h3 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-lg font-medium mb-2`}>Resting Heart Rate</h3>
          <div className={` ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 text-center`}>
            <div className="text-5xl font-bold text-red-400">
              {heartRateZones[0].restingHeartRate}
            </div>
            <div className={` ${isDarkMode ? "text-white" : "text-gray-900"} mt-2`}>BPM</div>
          </div>
        </div>
      )}


      {heartRateData.length > 0 && (
        <div className="chart-container">
          <h3 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-lg font-medium mb-2`}>Intraday Heart Rate</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={heartRateData}>
              <XAxis
                dataKey="time"
                tick={{ fill: "#fff" }}
                interval="preserveStartEnd"
                minTickGap={50}
              />
              <YAxis
                tick={{ fill: "#fff" }}
                domain={['dataMin - 10', 'dataMax + 10']}
              />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff4757"
                strokeWidth={2}
                name="Heart Rate (BPM)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
export const StepsComponent = () => {
  const [stepsData, setStepsData] = useState([]);
  const timeframe = "1w";
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchStepsData = async () => {
      const token = localStorage.getItem("fitbit_access_token");
      if (!token) {
        console.log("No access token, redirecting to login...");
        window.location.href = "/";
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };


        const stepsResponse = await axiosClient.get(
          `https://api.fitbit.com/1/user/-/activities/steps/date/today/${timeframe}.json`,
          { headers }
        );

        console.log("Steps Data:", stepsResponse.data);
        //   const stepsDict = createFitbitDataDictionary(stepsResponse.data);
        // console.log("Steps Dictionary:", stepsDict);

        const formattedStepsData = stepsResponse.data["activities-steps"].map((item) => ({
          date: item.dateTime,
          steps: parseInt(item.value, 10)
        }));

        setStepsData(formattedStepsData);
      } catch (error) {
        console.error("Error fetching Fitbit steps data:", error);
      }
    };

    fetchStepsData();
  }, [timeframe]);

  return (
    <div className={`dashboard-container ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <h2 className={`text-xl font-semibold mb-4 `}>Daily Steps</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stepsData}>
            <XAxis dataKey="date" tick={{ fill: "#fff" }} />
            <YAxis tick={{ fill: "#fff" }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <Bar dataKey="steps" fill="#4F98CA" name="Steps" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


const SleepComponent = () => {
  //const [sleepData, setSleepData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isDarkMode } = useContext(ThemeContext);
  const sleepData = [
    {
      date: "2025-03-04",
      deep: 1.5,  // hours
      light: 4,   // hours
      rem: 2,     // hours
      wake: 0.5,  // hours
      totalHours: 8,
    },
    {
      date: "2025-03-05",
      deep: 1.2,
      light: 3.5,
      rem: 1.8,
      wake: 0.4,
      totalHours: 7.5,
    },
    {
      date: "2025-03-06",
      deep: 1.8,
      light: 4.2,
      rem: 2.1,
      wake: 0.3,
      totalHours: 8.4,
    },
    {
      date: "2025-03-07",
      deep: 1.4,
      light: 3.8,
      rem: 1.9,
      wake: 0.5,
      totalHours: 7.6,
    },
    {
      date: "2025-03-08",
      deep: 1.7,
      light: 4.1,
      rem: 2,
      wake: 0.6,
      totalHours: 8.4,
    },
    {
      date: "2025-03-09",
      deep: 1.6,
      light: 4,
      rem: 1.9,
      wake: 0.5,
      totalHours: 8,
    },
    {
      date: "2025-03-10",
      deep: 1.3,
      light: 3.7,
      rem: 1.6,
      wake: 0.4,
      totalHours: 7,
    }
  ];


  useEffect(() => {
    const fetchSleepData = async () => {
      const token = localStorage.getItem("fitbit_access_token");
      if (!token) {
        console.log("No access token, redirecting to login...");
        window.location.href = "/";
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };

      try {
        const today = new Date().toISOString().split('T')[0];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(new Date().getDate() - 7);
        const formattedSevenDaysAgo = sevenDaysAgo.toISOString().split('T')[0];


        const sleepRangeResponse = await axiosClient.get(
          `https://api.fitbit.com/1.2/user/-/sleep/date/${formattedSevenDaysAgo}/${today}.json`,
          { headers }
        );
        const sleepData = sleepRangeResponse.data;

        // Send data to your backend
        await axiosClient.post('http://localhost:/send-sleep-data', { sleepData });

        // const sleepDict = createFitbitDataDictionary(sleepRangeResponse.data);
        // console.log("Sleep Dictionary:", sleepDict);

        const formattedSleepData = sleepRangeResponse.data.sleep?.map((sleep) => ({
          date: sleep.dateOfSleep,
          deep: sleep.levels?.summary.deep?.minutes / 60 || 0,
          light: sleep.levels?.summary.light?.minutes / 60 || 0,
          rem: sleep.levels?.summary.rem?.minutes / 60 || 0,
          wake: sleep.levels?.summary.wake?.minutes / 60 || 0,
          totalHours: sleep.duration / (1000 * 60 * 60),
        }));

        if (formattedSleepData?.length > 0) {
          setSleepData(formattedSleepData);
        } else {
          setError("No sleep data available for the past week.");
        }
      } catch (error) {
        console.error("Error fetching Fitbit sleep data:", error);
        setError("Failed to load sleep data");
      } finally {
        setLoading(false);
      }
    };

    fetchSleepData();
  }, []);
  if (loading) {
    return (
      <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Sleep Analysis</h2>
        <div className={` ${isDarkMode ? "text-white" : "text-gray-900"}`}>Loading sleep data...</div>
      </div>
    );
  }

  if (error && sleepData.length === 0) {
    return (
      <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
        <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Sleep Analysis</h2>
        <div className={` ${isDarkMode ? "text-white" : "text-gray-900"}`}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Sleep Analysis</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={sleepData}>
            <XAxis dataKey="date" tick={{ fill: "#fff" }} />
            <YAxis tick={{ fill: "#fff" }} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fill: '#fff' }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <Legend />
            <Area type="monotone" dataKey="totalHours" stroke="#8884d8" fill="#8884d8" name="Total Sleep" />
            {sleepData[0] && sleepData[0].deep > 0 && (
              <>
                <Area type="monotone" dataKey="deep" stackId="1" stroke="#0047AB" fill="#0047AB" name="Deep" />
                <Area type="monotone" dataKey="light" stackId="1" stroke="#6495ED" fill="#6495ED" name="Light" />
                <Area type="monotone" dataKey="rem" stackId="1" stroke="#B0C4DE" fill="#B0C4DE" name="REM" />
                <Area type="monotone" dataKey="wake" stackId="1" stroke="#D3D3D3" fill="#D3D3D3" name="Awake" />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export const ActivityComponent = () => {
  const [caloriesData, setCaloriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const timeframe = "1w";
  const { isDarkMode } = useContext(ThemeContext);

  useEffect(() => {
    const fetchActivityData = async () => {
      const token = localStorage.getItem("fitbit_access_token");
      if (!token) {
        console.log("No access token, redirecting to login...");
        window.location.href = "/";
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };


        const caloriesResponse = await axiosClient.get(
          `https://api.fitbit.com/1/user/-/activities/tracker/calories/date/today/${timeframe}.json`,
          { headers }
        );

        console.log("Tracker Calories Data:", caloriesResponse.data);


        const distanceResponse = await axiosClient.get(
          `https://api.fitbit.com/1/user/-/activities/tracker/distance/date/today/${timeframe}.json`,
          { headers }
        );

        console.log("Distance Data:", distanceResponse.data);

        // const caloriesDict = createFitbitDataDictionary(caloriesResponse.data);
        // console.log("Calories Dictionary:", caloriesDict);

        if (caloriesResponse.data["activities-tracker-calories"]) {
          const combinedData = caloriesResponse.data["activities-tracker-calories"].map((caloriesItem) => {
            const dateMatch = distanceResponse.data["activities-tracker-distance"]?.find(
              distanceItem => distanceItem.dateTime === caloriesItem.dateTime
            );

            return {
              date: caloriesItem.dateTime,
              calories: parseInt(caloriesItem.value, 10),
              distance: dateMatch ? parseFloat(dateMatch.value) : 0
            };
          });

          setCaloriesData(combinedData);
        }
      } catch (error) {
        console.error("Error fetching Fitbit activity data:", error);
        setError("Failed to load activity data");
      } finally {
        setLoading(false);
      }
    };

    fetchActivityData();
  }, [timeframe]);

  if (loading) {
    return (
      <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Activity & Calories</h2>
        <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Loading activity data...</div>
      </div>
    );
  }

  if (error && caloriesData.length === 0) {
    return (
      <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
        <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Activity & Calories</h2>
        <div className={` ${isDarkMode ? "text-white" : "text-gray-900"}`}>{error}</div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container mt-8 ${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <h2 className={` ${isDarkMode ? "text-white" : "text-gray-900"} text-xl font-semibold mb-4`}>Activity & Calories</h2>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={caloriesData}>
            <XAxis dataKey="date" tick={{ fill: "#fff" }} />
            <YAxis yAxisId="left" tick={{ fill: "#fff" }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: "#fff" }} />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="calories"
              stroke="#FF6B6B"
              strokeWidth={2}
              name="Calories Burned"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="distance"
              stroke="#48CFAD"
              strokeWidth={2}
              name="Distance (km)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { isDarkMode } = useContext(ThemeContext);
  return (
    <div className={`italic ${isDarkMode ? "text-white" : "text-gray-900"} min-h-screen overflow-y-auto custom-scrollbar`}>
      <div className="p-6">
        <h1 className={` text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Fitness Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          <div className={` ${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 shadow-lg`}>
            <HeartRateComponent />
          </div>

          <div className={`${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 shadow-lg`}>
            <StepsComponent />
          </div>


          <div className={`${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 shadow-lg`}>
            <SleepComponent />
          </div>


          <div className={`${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 shadow-lg`}>
            <ActivityComponent />
          </div>
          <div className={`${isDarkMode ? "bg-gray-900" : "bg-gray-100"} rounded-lg p-4 shadow-lg`}>
            <  StressGraph />
          </div>
        </div>
      </div>
    </div>

  );
};

export default Dashboard;