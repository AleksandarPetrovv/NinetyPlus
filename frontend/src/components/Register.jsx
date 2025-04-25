import { useState, useEffect } from 'react';
import { register, login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import CloseIcon from '@mui/icons-material/Close';
import { toast } from 'react-toastify';

function Register({ open, onClose, onSwitchToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  
  useEffect(() => {
    if (!open) {
      setUsername('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setError('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      toast.error('Passwords do not match');
      return;
    }

    try {
      await register(username, email, password);
      const response = await login(username, password);
      setUser({
        id: response.user_id,
        username: response.username
      });
      toast.success(`Welcome to NinetyPlus, ${username}! Your account has been created.`);
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.username?.[0] || 
                        err.response?.data?.email?.[0] || 
                        err.response?.data?.password?.[0] || 
                        'Registration failed';
      setError(errorMessage);
      toast.error(`Registration failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 transition-opacity duration-300"
      style={{
        opacity: 1,
        animation: 'fadeIn 0.3s ease-out forwards'
      }}
    >
      <div 
        className="bg-dark-200 rounded-xl max-w-md w-full p-6 border border-dark-300 transition-transform duration-300"
        style={{
          transform: 'scale(1)',
          animation: 'scaleIn 0.3s ease-out forwards'
        }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400">Register</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors">
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 p-3 rounded-md mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-200 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-purple-500"
              required
              minLength={8}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-200 mb-2">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-dark-300 border border-dark-400 rounded-md py-2 px-3 text-gray-200 focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors disabled:bg-purple-800 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-center text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default Register;