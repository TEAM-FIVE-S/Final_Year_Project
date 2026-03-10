import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';
import { motion } from 'framer-motion';

// Helper to determine status style (unchanged)
const getStatusStyle = (value, thresholds) => {
  if (value > thresholds.critical) return { className: 'text-red-600 font-bold', isCritical: true };
  if (value > thresholds.warning) return { className: 'text-yellow-600 font-semibold', isCritical: false };
  return { className: 'text-gray-700', isCritical: false };
};

// Thresholds are still in Celsius for alert logic (unchanged)
const thresholds = {
  heartrate: { warning: 100, critical: 120 },
  temperature: { warning: 37.5, critical: 38.3 }, 
  spo2: { warning: 94, critical: 90 },
};

// SpO2 logic is also unchanged
const getSpo2StatusStyle = (value, thresholds) => {
  if (value < thresholds.critical) return { className: 'text-red-600 font-bold', isCritical: true };
  if (value < thresholds.warning) return { className: 'text-yellow-600 font-semibold', isCritical: false };
  return { className: 'text-gray-700', isCritical: false };
};

const AdminPanel = ({ user, onLogout }) => {
  const [allData, setAllData] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchAllData = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/admin/data`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAllData(data);
      } catch (error) {
        console.error('Error fetching admin data:', error.response?.data?.message || error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [token]);

  return (
    <AnimatedPageWrapper>
      <Navbar user={user} onLogout={onLogout} />
      <main className="container mx-auto p-4 md:p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Admin Panel - All Sensor Data</h1>
        <div className="bg-white rounded-lg shadow-xl overflow-x-auto">
          {loading ? (
            <p className="p-6 text-center text-gray-500">Loading data...</p>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3">User</th>
                  <th scope="col" className="px-6 py-3">Heart Rate</th>
                  <th scope="col" className="px-6 py-3">Temperature (°F)</th> {/* Unit updated in header */}
                  <th scope="col" className="px-6 py-3">SpO2</th>
                  <th scope="col" className="px-6 py-3">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {allData.map((d, index) => {
                  const hrStyle = getStatusStyle(d.heartrate, thresholds.heartrate);
                  const tempStyle = getStatusStyle(d.temperature, thresholds.temperature);
                  const spo2Style = getSpo2StatusStyle(d.spo2, thresholds.spo2);
                  const isRowCritical = hrStyle.isCritical || tempStyle.isCritical || spo2Style.isCritical;
                  const rowClassName = isRowCritical ? 'bg-red-100' : 'bg-white';
                  
                  // TEMPERATURE CONVERSION FIX IS HERE
                  const tempInFahrenheit = ((d.temperature * 9/5) + 32).toFixed(1);

                  return (
                    <motion.tr
                      key={d._id}
                      className={`${rowClassName} border-b hover:bg-gray-50`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                        {d.userId?.name || 'Unknown User'}
                      </td>
                      <td className={`px-6 py-4 ${hrStyle.className}`}>
                        {d.heartrate} {hrStyle.isCritical && '⚠️'}
                      </td>
                      <td className={`px-6 py-4 ${tempStyle.className}`}>
                        {/* Display the converted Fahrenheit value */}
                        {tempInFahrenheit} {tempStyle.isCritical && '⚠️'}
                      </td>
                      <td className={`px-6 py-4 ${spo2Style.className}`}>
                        {d.spo2}% {spo2Style.isCritical && '⚠️'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(d.createdAt).toLocaleString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </AnimatedPageWrapper>
  );
};

export default AdminPanel;
