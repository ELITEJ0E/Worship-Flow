import React, { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { User } from '../types';
import { Music2 } from 'lucide-react';

interface AuthFormProps {
  onLogin: (user: User) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        const user = loginUser(username, password);
        onLogin(user);
      } else {
        const user = registerUser(username, password);
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 p-4">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-6 text-primary">
             <Music2 size={48} />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-slate-900 dark:text-white">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        
        {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Username</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary outline-none dark:text-white"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-lg border dark:border-slate-600 bg-slate-50 dark:bg-slate-700 focus:ring-2 focus:ring-primary outline-none dark:text-white"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-primary hover:bg-indigo-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {isLogin ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button 
            onClick={() => { setIsLogin(!isLogin); setError(null); }}
            className="text-primary hover:underline"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
