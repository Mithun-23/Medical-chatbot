import { useState, useEffect, useCallback } from 'react';
import { axiosClient } from '../axios';

/**
 * Centralized hook for fetching and managing all Fitbit fitness data.
 * Provides aggregated data, health scores, and LLM-ready context.
 */
export function useFitnessData() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Individual data states
    const [heartRate, setHeartRate] = useState({
        current: 0,
        resting: 0,
        zones: [],
        intraday: []
    });

    const [steps, setSteps] = useState({
        today: 0,
        goal: 10000,
        weeklyData: []
    });

    const [sleep, setSleep] = useState({
        lastNight: 0,
        quality: 'Unknown',
        weeklyData: [],
        avgDeep: 0,
        avgRem: 0
    });

    const [activity, setActivity] = useState({
        calories: 0,
        distance: 0,
        weeklyData: []
    });

    // Health scores (0-100)
    const [healthScores, setHealthScores] = useState({
        overall: 0,
        heart: 0,
        sleep: 0,
        activity: 0
    });

    // AI-generated insights
    const [insights, setInsights] = useState([]);

    const getToken = () => localStorage.getItem('fitbit_access_token');

    const CACHE_KEY = 'fitbit_data_cache';
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Load cached data on mount
    useEffect(() => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                // Use cache regardless of age on initial load for instant display
                if (data.heartRate) setHeartRate(data.heartRate);
                if (data.steps) setSteps(data.steps);
                if (data.sleep) setSleep(data.sleep);
                if (data.activity) setActivity(data.activity);
            } catch (e) {
                console.log('Cache parse error');
            }
        }
    }, []);

    // Save data to cache
    const saveToCache = useCallback(() => {
        const cacheData = {
            data: { heartRate, steps, sleep, activity },
            timestamp: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    }, [heartRate, steps, sleep, activity]);

    // Save to cache when data changes
    useEffect(() => {
        if (heartRate.resting > 0 || steps.today > 0) {
            saveToCache();
        }
    }, [heartRate, steps, sleep, activity, saveToCache]);

    // Check if cache is fresh
    const isCacheFresh = () => {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return false;
        try {
            const { timestamp } = JSON.parse(cached);
            return Date.now() - timestamp < CACHE_DURATION;
        } catch (e) {
            return false;
        }
    };

    // Fetch all fitness data
    const fetchAllData = useCallback(async (forceRefresh = false) => {
        const token = getToken();
        if (!token) {
            setError('No Fitbit token found. Please connect your Fitbit.');
            setLoading(false);
            return;
        }

        // Skip fetch if cache is fresh and not forced
        if (!forceRefresh && isCacheFresh()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const headers = { Authorization: `Bearer ${token}` };

        try {
            // Fetch heart rate data
            try {
                const heartRes = await axiosClient.get(
                    'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d.json',
                    { headers }
                );

                const heartData = heartRes.data['activities-heart']?.[0];
                const zones = heartData?.value?.heartRateZones || [];
                const resting = heartData?.value?.restingHeartRate || 0;

                // Try to get intraday data
                let intradayData = [];
                try {
                    const intradayRes = await axiosClient.get(
                        'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json',
                        { headers }
                    );
                    intradayData = intradayRes.data['activities-heart-intraday']?.dataset || [];
                } catch (e) {
                    console.log('Intraday heart data not available');
                }

                const currentHR = intradayData.length > 0
                    ? intradayData[intradayData.length - 1].value
                    : resting;

                setHeartRate({
                    current: currentHR,
                    resting,
                    zones: zones.map(z => ({
                        name: z.name,
                        minutes: z.minutes || 0,
                        min: z.min,
                        max: z.max
                    })),
                    intraday: intradayData.slice(-60) // Last 60 minutes
                });
            } catch (e) {
                console.error('Heart rate fetch error:', e);
            }

            // Fetch steps data
            try {
                const stepsRes = await axiosClient.get(
                    'https://api.fitbit.com/1/user/-/activities/steps/date/today/1w.json',
                    { headers }
                );

                const stepsData = stepsRes.data['activities-steps'] || [];
                const todaySteps = stepsData.length > 0
                    ? parseInt(stepsData[stepsData.length - 1].value, 10)
                    : 0;

                setSteps({
                    today: todaySteps,
                    goal: 10000,
                    weeklyData: stepsData.map(d => ({
                        date: d.dateTime,
                        value: parseInt(d.value, 10)
                    }))
                });
            } catch (e) {
                console.error('Steps fetch error:', e);
            }

            // Fetch sleep data
            try {
                const today = new Date().toISOString().split('T')[0];
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const fromDate = sevenDaysAgo.toISOString().split('T')[0];

                const sleepRes = await axiosClient.get(
                    `https://api.fitbit.com/1.2/user/-/sleep/date/${fromDate}/${today}.json`,
                    { headers }
                );

                const sleepData = sleepRes.data.sleep || [];
                const lastSleep = sleepData.length > 0 ? sleepData[sleepData.length - 1] : null;

                let totalDeep = 0, totalRem = 0, count = 0;

                const weeklyData = sleepData.map(s => {
                    const deep = s.levels?.summary?.deep?.minutes || 0;
                    const rem = s.levels?.summary?.rem?.minutes || 0;
                    totalDeep += deep;
                    totalRem += rem;
                    count++;

                    return {
                        date: s.dateOfSleep,
                        hours: s.duration / (1000 * 60 * 60),
                        deep: deep / 60,
                        rem: rem / 60,
                        light: (s.levels?.summary?.light?.minutes || 0) / 60,
                        wake: (s.levels?.summary?.wake?.minutes || 0) / 60
                    };
                });

                const lastHours = lastSleep ? lastSleep.duration / (1000 * 60 * 60) : 0;
                let quality = 'Unknown';
                if (lastHours >= 7.5) quality = 'Excellent';
                else if (lastHours >= 6.5) quality = 'Good';
                else if (lastHours >= 5) quality = 'Fair';
                else if (lastHours > 0) quality = 'Poor';

                setSleep({
                    lastNight: lastHours,
                    quality,
                    weeklyData,
                    avgDeep: count > 0 ? (totalDeep / count / 60) : 0,
                    avgRem: count > 0 ? (totalRem / count / 60) : 0
                });
            } catch (e) {
                console.error('Sleep fetch error:', e);
            }

            // Fetch activity/calories data
            try {
                const caloriesRes = await axiosClient.get(
                    'https://api.fitbit.com/1/user/-/activities/tracker/calories/date/today/1w.json',
                    { headers }
                );

                const distanceRes = await axiosClient.get(
                    'https://api.fitbit.com/1/user/-/activities/tracker/distance/date/today/1w.json',
                    { headers }
                );

                const caloriesData = caloriesRes.data['activities-tracker-calories'] || [];
                const distanceData = distanceRes.data['activities-tracker-distance'] || [];

                const todayCalories = caloriesData.length > 0
                    ? parseInt(caloriesData[caloriesData.length - 1].value, 10)
                    : 0;
                const todayDistance = distanceData.length > 0
                    ? parseFloat(distanceData[distanceData.length - 1].value)
                    : 0;

                const weeklyData = caloriesData.map((c, i) => ({
                    date: c.dateTime,
                    calories: parseInt(c.value, 10),
                    distance: distanceData[i] ? parseFloat(distanceData[i].value) : 0
                }));

                setActivity({
                    calories: todayCalories,
                    distance: todayDistance,
                    weeklyData
                });
            } catch (e) {
                console.error('Activity fetch error:', e);
            }

        } catch (err) {
            console.error('Fitness data fetch error:', err);
            setError('Failed to load fitness data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Calculate health scores whenever data changes
    useEffect(() => {
        // Heart score (based on resting heart rate - lower is better for adults)
        let heartScore = 0;
        if (heartRate.resting > 0) {
            if (heartRate.resting < 60) heartScore = 100;
            else if (heartRate.resting < 70) heartScore = 85;
            else if (heartRate.resting < 80) heartScore = 70;
            else if (heartRate.resting < 90) heartScore = 55;
            else heartScore = 40;
        }

        // Sleep score (based on duration and quality)
        let sleepScore = 0;
        if (sleep.lastNight > 0) {
            const durationScore = Math.min(100, (sleep.lastNight / 8) * 100);
            sleepScore = Math.round(durationScore);
        }

        // Activity score (based on steps goal)
        let activityScore = 0;
        if (steps.today > 0) {
            activityScore = Math.min(100, Math.round((steps.today / steps.goal) * 100));
        }

        // Overall score (weighted average)
        const overall = Math.round(
            (heartScore * 0.3) + (sleepScore * 0.35) + (activityScore * 0.35)
        );

        setHealthScores({
            overall,
            heart: heartScore,
            sleep: sleepScore,
            activity: activityScore
        });

        // Generate insights
        const newInsights = [];

        if (heartRate.resting > 0 && heartRate.resting < 70) {
            newInsights.push({
                type: 'success',
                icon: '💚',
                text: `Your resting heart rate of ${heartRate.resting} BPM is excellent!`
            });
        } else if (heartRate.resting >= 80) {
            newInsights.push({
                type: 'warning',
                icon: '⚠️',
                text: `Your resting heart rate of ${heartRate.resting} BPM is elevated. Consider relaxation techniques.`
            });
        }

        if (sleep.lastNight >= 7) {
            newInsights.push({
                type: 'success',
                icon: '😴',
                text: `Great sleep! You got ${sleep.lastNight.toFixed(1)} hours last night.`
            });
        } else if (sleep.lastNight > 0 && sleep.lastNight < 6) {
            newInsights.push({
                type: 'warning',
                icon: '😴',
                text: `Only ${sleep.lastNight.toFixed(1)} hours of sleep. Try to get 7-8 hours tonight.`
            });
        }

        if (steps.today >= steps.goal) {
            newInsights.push({
                type: 'success',
                icon: '🎉',
                text: `You've reached your ${steps.goal.toLocaleString()} steps goal today!`
            });
        } else if (steps.today > 0) {
            const remaining = steps.goal - steps.today;
            newInsights.push({
                type: 'info',
                icon: '🚶',
                text: `${remaining.toLocaleString()} more steps to reach your daily goal.`
            });
        }

        if (activity.calories > 2000) {
            newInsights.push({
                type: 'success',
                icon: '🔥',
                text: `You've burned ${activity.calories.toLocaleString()} calories today!`
            });
        }

        setInsights(newInsights);
    }, [heartRate, sleep, steps, activity]);

    // Generate context string for LLM
    const getFitnessContext = useCallback(() => {
        const parts = [];

        if (heartRate.resting > 0) {
            parts.push(`Resting heart rate: ${heartRate.resting} BPM`);
        }

        if (steps.today > 0) {
            parts.push(`Today's steps: ${steps.today.toLocaleString()} (goal: ${steps.goal.toLocaleString()})`);
        }

        if (sleep.lastNight > 0) {
            parts.push(`Last night's sleep: ${sleep.lastNight.toFixed(1)} hours (${sleep.quality})`);
        }

        if (activity.calories > 0) {
            parts.push(`Calories burned today: ${activity.calories.toLocaleString()}`);
        }

        if (healthScores.overall > 0) {
            parts.push(`Health score: ${healthScores.overall}/100`);
        }

        return parts.join('. ');
    }, [heartRate, steps, sleep, activity, healthScores]);

    // Initial fetch
    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Store fitness context in localStorage for other components
    useEffect(() => {
        const context = getFitnessContext();
        if (context) {
            localStorage.setItem('fitness_context', context);
        }
    }, [getFitnessContext]);

    // Logout / Disconnect Fitbit
    const logout = useCallback(() => {
        localStorage.removeItem('fitbit_access_token');
        localStorage.removeItem(CACHE_KEY);
        setHeartRate({ current: 0, resting: 0, zones: [], intraday: [] });
        setSteps({ today: 0, goal: 10000, weeklyData: [] });
        setSleep({ lastNight: 0, quality: 'Unknown', weeklyData: [], avgDeep: 0, avgRem: 0 });
        setActivity({ calories: 0, distance: 0, weeklyData: [] });
        setHealthScores({ overall: 0, heart: 0, sleep: 0, activity: 0 });
        setInsights([]);
        setError('Fitbit disconnected');
    }, []);

    return {
        loading,
        error,
        heartRate,
        steps,
        sleep,
        activity,
        healthScores,
        insights,
        refresh: fetchAllData,
        getFitnessContext,
        logout
    };
}

export default useFitnessData;
