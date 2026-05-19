import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Simulate login for MVP
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-deployiq-darker">
      <div className="w-full max-w-md bg-deployiq-dark border border-slate-800 rounded-lg p-8 shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-linear-to-r from-blue-400 to-indigo-500 mb-2">
            DeployIQ
          </h1>
          <p className="text-slate-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:outline-none focus:border-deployiq-accent transition-colors"
              placeholder="admin@deployiq.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-4 py-2 focus:outline-none focus:border-deployiq-accent transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-deployiq-accent hover:bg-deployiq-accent-hover text-white font-medium py-2 rounded-md transition-colors mt-6"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
