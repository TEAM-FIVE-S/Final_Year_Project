import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Call the logout function passed down from App.jsx
    if (onLogout) {
      onLogout();
    }
    // Navigate back to the root login page
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to={user?.role === 'admin' ? "/admin" : "/dashboard"} className="text-xl font-bold text-gray-800">
          Health Monitor
        </Link>
        <div className="flex items-center">
          {user && <span className="text-gray-700 mr-4">Welcome, {user.name}</span>}
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
