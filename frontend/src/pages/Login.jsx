import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Invalid credentials. Access Denied.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] px-4 font-mono text-gray-300">
      <div className="w-full max-w-md devops-panel p-8 rounded-xl shadow-2xl relative overflow-hidden border devops-border">
        {/* Terminal Header */}
        <div className="flex items-center space-x-2 pb-4 mb-6 border-b devops-border">
          <div className="w-3 h-3 rounded-full bg-[#ef4444] opacity-80"></div>
          <div className="w-3 h-3 rounded-full bg-[#f59e0b] opacity-80"></div>
          <div className="w-3 h-3 rounded-full bg-[#10b981] opacity-80"></div>
          <span className="text-xs text-gray-500 ml-2">deployiq_auth_v1.0</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center">
            <span className="text-gray-500 mr-2">$</span>deployiq login
          </h1>
          <p className="text-xs text-gray-500 mt-1">Authenticate credentials to establish secure session.</p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 text-xs flex items-start space-x-2">
            <span className="font-bold text-red-500 text-xs">[ERROR]</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              --identity / email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full terminal-input"
              placeholder="operator@deployiq.edu"
              required
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              --secret / password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full terminal-input"
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="w-full terminal-button mt-6 flex items-center justify-center space-x-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-gray-600 border-t-white rounded-full animate-spin"></div>
                <span>Executing...</span>
              </>
            ) : (
              <span>Establish Session</span>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t devops-border text-center text-xs text-gray-500">
          <span>First deployment? </span>
          <Link to="/register" className="text-white hover:underline">
            register --new
          </Link>
        </div>
      </div>
    </div>
  );
}
