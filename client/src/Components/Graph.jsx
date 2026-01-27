import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { axiosClient } from "../axios";

const SessionSentimentsGraph = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const sessionId = localStorage.getItem('chatSessionId');
        console.log(sessionId + "rog");
        if (!sessionId) {
            setError('No session ID found in local storage');
            setLoading(false);
            return;
        }

        axiosClient.get(`https://apparent-wolf-obviously.ngrok-free.app/api/get-session-sentiments/${sessionId}`)
            .then(response => {
                const chartData = response.data.map(item => ({
                    time: new Date(item.timestamp).toLocaleTimeString(),
                    stressPercentageAnalysis: item.percentage
                }));
                setData(chartData);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to fetch data', err);
                setLoading(false);
            });
    }, []);

    const getEmotion = (percentage) => {
        if (percentage > 75) return '😞 High Stress';
        if (percentage > 50) return '😐 Moderate Stress';
        return '😊 Low Stress';
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

    return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
            <h2>Stress Percentage Over Time</h2>
            <div style={{ marginBottom: '20px' }}>
                <h3>{getEmotion(data.length > 0 ? data[data.length - 1].stressPercentage : 0)}</h3>
            </div>
            {/* <h1>{data}</h1> */}
            <LineChart
                width={600}
                height={300}
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                <YAxis domain={[0, 100]} label={{ value: 'Stress Percentage', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="stressPercentageAnalysis"
                    stroke={data.length > 0 && data[data.length - 1].stressPercentage > 75 ? "#FF0000" : "#00C49F"}
                    strokeWidth={2}
                    dot={{ r: 5 }}
                />
            </LineChart>
        </div>
    );
};

export default SessionSentimentsGraph;