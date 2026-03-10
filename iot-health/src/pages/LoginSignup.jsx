import { useState } from 'react';
import axios from 'axios';
import AnimatedPageWrapper from '../components/AnimatedPageWrapper';

const LoginSignup = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin 
      ? `${import.meta.env.VITE_API_URL}/login` 
      : `${import.meta.env.VITE_API_URL}/signup`;

    try {
      const { data } = await axios.post(url, formData);

      if (isLogin) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        // Report the successful login to the parent App component
        onLogin(data);
      } else {
        setIsLogin(true);
        setError('Signup successful! Please log in.');
      }
    } catch (err) {
      const message = err.response?.data?.message || 'An unexpected error occurred. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPageWrapper>
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            {isLogin ? 'Welcome Back!' : 'Create an Account'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <label htmlFor="name" className="text-sm font-medium text-gray-700">Name</label>
                <input id="name" name="name" type="text" required={!isLogin} onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
              </div>
            )}
            <div>
              <label htmlFor="email" className="text-sm font-medium text-gray-700">Email Address</label>
              <input id="email" name="email" type="email" required onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="password" className="text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required onChange={handleChange} className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" />
            </div>

            {error && <p className="text-sm text-center text-red-500 font-semibold">{error}</p>}

            <div>
              <button type="submit" disabled={loading} className="w-full px-4 py-2 font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400">
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </div>
          </form>
          <p className="text-sm text-center text-gray-600">
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setIsLogin(!isLogin); setError(''); }} className="font-medium text-blue-600 hover:underline">
              {isLogin ? 'Sign Up' : 'Login'}
            </button>
          </p>
        </div>
      </div>
    </AnimatedPageWrapper>
  );
};

export default LoginSignup;
