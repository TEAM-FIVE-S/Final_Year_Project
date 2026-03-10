import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ResponsiveContainer
} from 'recharts';
import Navbar from '../components/Navbar';
import ChartCard from '../components/ChartCard';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';

const Dashboard = ({ user, onLogout }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [message, setMessage] = useState('');
  const [timer, setTimer] = useState(0);
  const pollingIntervalRef = useRef(null);
  
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  // Implements the queue logic for the dashboard data
  const fetchData = async () => {
    if (!user?.id || !token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/${user.id}/data`, config);
      // Slice the incoming data to only keep the 20 most recent entries.
      setData(response.data.slice(0, 20));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/device/release`, {}, config);
      setMessage('Monitoring stopped. Refreshing final data...');
      setTimeout(fetchData, 1000); 
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to release device.');
    } finally {
      setIsMonitoring(false);
      setTimer(0);
    }
  };

  useEffect(() => {
    let timerId;
    if (isMonitoring && timer > 0) {
      timerId = setInterval(() => setTimer(t => t - 1), 1000);
    } else if (timer === 0 && isMonitoring) {
      handleStopMonitoring();
    }
    return () => clearInterval(timerId);
  }, [isMonitoring, timer]);

  useEffect(() => {
    if (isMonitoring) {
      pollingIntervalRef.current = setInterval(fetchData, 3000);
    } else if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    return () => clearInterval(pollingIntervalRef.current);
  }, [isMonitoring]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleStartMonitoring = async () => {
    setMessage('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/device/claim`, {}, config);
      setIsMonitoring(true);
      setTimer(10);
      setMessage('Device claimed! Monitoring for 10 seconds.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to claim device.');
    }
  };

  const latestData = data.length > 0 ? data[0] : {};
  const chartData = data.slice().reverse();

  // Converts the latest temperature reading from Celsius to Fahrenheit
  const tempInFahrenheit = latestData.temperature ? ((latestData.temperature * 9/5) + 32).toFixed(1) : 'N/A';

  if (loading) {
    return <AnimatedPageWrapper><div>Loading Dashboard...</div></AnimatedPageWrapper>;
  }

  return (
    <AnimatedPageWrapper>
      <Navbar user={user} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">User Dashboard</h1>

        <div className="bg-white p-4 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">Device Control</h2>
          <div className="flex items-center space-x-4">
            {!isMonitoring ? (
              <button onClick={handleStartMonitoring} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg">Start Monitoring</button>
            ) : (
              <button onClick={handleStopMonitoring} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg">Stop Monitoring ({timer}s left)</button>
            )}
          </div>
          {message && <p className="mt-3 text-sm font-semibold text-gray-600">{message}</p>}
        </div>

        {data.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="card p-6 text-center">
                <h3 className="text-gray-500">Heart Rate</h3>
                <p className="text-4xl font-bold text-blue-600">{latestData.heartrate || 'N/A'} bpm</p>
              </div>
              <div className="card p-6 text-center">
                <h3 className="text-gray-500">Temperature</h3>
                <p className="text-4xl font-bold text-green-600">{tempInFahrenheit} °F</p>
              </div>
              <div className="card p-6 text-center">
                <h3 className="text-gray-500">SpO2</h3>
                <p className="text-4xl font-bold text-red-600">{latestData.spo2 || 'N/A'} %</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Heart Rate Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="createdAt" tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis domain={['dataMin - 5', 'dataMax + 5']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="heartrate" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              <ChartCard title="Temperature History (°F)">
                <ResponsiveContainer width="100%" height={300}>
                  {/* Convert all temperature data points for the chart */}
                  <BarChart data={chartData.map(item => ({...item, temperature: (item.temperature * 9/5) + 32}))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="createdAt" tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value.toFixed(1)} °F`} />
                    <Bar dataKey="temperature" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No sensor data has been recorded for this user yet.</p>
            <p className="text-sm text-gray-500 mt-2">Click "Start Monitoring" to begin a session.</p>
          </div>
        )}
      </main>
    </AnimatedPageWrapper>
  );
};

export default Dashboard;
