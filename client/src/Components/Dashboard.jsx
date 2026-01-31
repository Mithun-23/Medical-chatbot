import React, { useContext } from "react";
import {
  LineChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { ThemeContext } from "./ThemeContext";
import { useFitnessData } from "../hooks/useFitnessData";

// Stat Card Component with gradient background
const StatCard = ({ icon, title, value, unit, subtitle, gradient, isDarkMode }) => (
  <div
    className={`relative overflow-hidden rounded-2xl p-5 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${gradient}`}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-xs uppercase tracking-wider opacity-80 font-medium">
          {title}
        </span>
      </div>
      <div className="text-4xl font-bold text-white mb-1">
        {value}
        <span className="text-lg font-normal ml-1 opacity-80">{unit}</span>
      </div>
      {subtitle && (
        <div className="text-sm opacity-80">{subtitle}</div>
      )}
    </div>
    {/* Decorative circle */}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white opacity-10" />
  </div>
);

// Health Score Ring Component
const HealthScoreRing = ({ score, size = 120, strokeWidth = 10, isDarkMode }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  let color = '#10B981'; // green
  if (score < 50) color = '#EF4444'; // red
  else if (score < 70) color = '#F59E0B'; // yellow

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={isDarkMode ? '#374151' : '#E5E7EB'}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {score}
        </span>
        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          / 100
        </span>
      </div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight, isDarkMode }) => {
  const bgColors = {
    success: isDarkMode ? 'bg-green-900/30 border-green-500/30' : 'bg-green-50 border-green-200',
    warning: isDarkMode ? 'bg-yellow-900/30 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200',
    info: isDarkMode ? 'bg-blue-900/30 border-blue-500/30' : 'bg-blue-50 border-blue-200',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${bgColors[insight.type] || bgColors.info}`}>
      <span className="text-xl">{insight.icon}</span>
      <p className={`text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        {insight.text}
      </p>
    </div>
  );
};

// Chart wrapper with consistent styling
const ChartCard = ({ title, children, isDarkMode }) => (
  <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
    <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {title}
    </h3>
    {children}
  </div>
);

const Dashboard = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const {
    loading,
    error,
    heartRate,
    steps,
    sleep,
    activity,
    healthScores,
    insights,
    refresh,
    logout,
  } = useFitnessData();

  const chartColors = {
    text: isDarkMode ? '#9CA3AF' : '#6B7280',
    grid: isDarkMode ? '#374151' : '#E5E7EB',
    bg: isDarkMode ? '#1F2937' : '#FFFFFF',
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={`p-3 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Loading your fitness data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const isMissingToken = error.includes('No Fitbit token') || error.includes('Fitbit disconnected');

    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className={`text-center p-8 rounded-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-xl max-w-md w-full mx-4`}>
          {isMissingToken ? (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center">
                <span className="text-4xl">⌚</span>
              </div>
              <h2 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Connect Your Fitbit
              </h2>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Sync your activity, heart rate, and sleep data to get personalized health insights.
              </p>
              <a
                href={`https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${import.meta.env.VITE_FITBIT_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_FITBIT_REDIRECT_URI}&scope=activity%20heartrate%20sleep%20profile`}
                className="inline-block px-8 py-3 bg-gradient-to-r from-teal-500 to-blue-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Connect Fitbit
              </a>
            </>
          ) : (
            <>
              <span className="text-5xl mb-4 block">😔</span>
              <p className={`text-lg mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{error}</p>
              <button
                onClick={refresh}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Try Again
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen overflow-y-auto ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Fitness Dashboard
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Your health at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={refresh}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900'
                } shadow-md`}
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>

            <button
              onClick={logout}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isDarkMode
                ? 'bg-red-900/50 hover:bg-red-900 text-red-200'
                : 'bg-red-50 hover:bg-red-100 text-red-700'
                } shadow-md border ${isDarkMode ? 'border-red-800' : 'border-red-200'}`}
            >
              <span>❌</span>
              <span>Disconnect</span>
            </button>
          </div>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="❤️"
            title="Heart Rate"
            value={heartRate.resting || '--'}
            unit="BPM"
            subtitle={heartRate.resting ? "Resting" : "No data"}
            gradient="bg-gradient-to-br from-rose-500 to-purple-600"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon="🚶"
            title="Steps"
            value={steps.today > 0 ? steps.today.toLocaleString() : '--'}
            unit=""
            subtitle={steps.today > 0 ? `${Math.round((steps.today / steps.goal) * 100)}% of goal` : "No data"}
            gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon="😴"
            title="Sleep"
            value={sleep.lastNight > 0 ? sleep.lastNight.toFixed(1) : '--'}
            unit="hrs"
            subtitle={sleep.quality !== 'Unknown' ? sleep.quality : "No data"}
            gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
            isDarkMode={isDarkMode}
          />
          <StatCard
            icon="🔥"
            title="Calories"
            value={activity.calories > 0 ? activity.calories.toLocaleString() : '--'}
            unit="kcal"
            subtitle={activity.distance > 0 ? `${activity.distance.toFixed(1)} km` : "No data"}
            gradient="bg-gradient-to-br from-orange-500 to-red-600"
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Health Score & Insights Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Health Score */}
          <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🏆 Health Score
            </h3>
            <div className="flex items-center justify-center mb-4">
              <HealthScoreRing score={healthScores.overall} isDarkMode={isDarkMode} />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
                  {healthScores.heart}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Heart</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>
                  {healthScores.sleep}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sleep</div>
              </div>
              <div>
                <div className={`text-xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                  {healthScores.activity}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Activity</div>
              </div>
            </div>
          </div>

          {/* AI Insights */}
          <div className={`lg:col-span-2 rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🩺 AI Health Insights
            </h3>
            <div className="space-y-3">
              {insights.length > 0 ? (
                insights.map((insight, index) => (
                  <InsightCard key={index} insight={insight} isDarkMode={isDarkMode} />
                ))
              ) : (
                <p className={`text-center py-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Connect your Fitbit to see personalized insights
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Steps Chart */}
          <ChartCard title="📊 Weekly Steps" isDarkMode={isDarkMode}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={steps.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="value"
                  name="Steps"
                  fill="url(#stepsGradient)"
                  radius={[4, 4, 0, 0]}
                />
                <defs>
                  <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3B82F6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Heart Rate Zones Chart */}
          <ChartCard title="💓 Heart Rate Zones" isDarkMode={isDarkMode}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={heartRate.zones} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis type="number" tick={{ fill: chartColors.text, fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="minutes"
                  name="Minutes"
                  radius={[0, 4, 4, 0]}
                >
                  {heartRate.zones.map((entry, index) => {
                    const colors = ['#6B7280', '#F59E0B', '#EF4444', '#DC2626'];
                    return <rect key={index} fill={colors[index] || '#3B82F6'} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Sleep Chart */}
          <ChartCard title="😴 Sleep Analysis" isDarkMode={isDarkMode}>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={sleep.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis tick={{ fill: chartColors.text, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="deep" stackId="1" stroke="#1E40AF" fill="#1E40AF" name="Deep" />
                <Area type="monotone" dataKey="light" stackId="1" stroke="#60A5FA" fill="#60A5FA" name="Light" />
                <Area type="monotone" dataKey="rem" stackId="1" stroke="#A78BFA" fill="#A78BFA" name="REM" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Activity Chart */}
          <ChartCard title="🔥 Calories & Distance" isDarkMode={isDarkMode}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={activity.weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: chartColors.text, fontSize: 12 }}
                  tickFormatter={(date) => new Date(date).toLocaleDateString('en', { weekday: 'short' })}
                />
                <YAxis yAxisId="left" tick={{ fill: chartColors.text, fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: chartColors.text, fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="calories"
                  stroke="#F97316"
                  strokeWidth={2}
                  name="Calories"
                  dot={{ fill: '#F97316', strokeWidth: 0 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="distance"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Distance (km)"
                  dot={{ fill: '#10B981', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;