import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError('Failed to log in. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to your account</h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email address</label>
              <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"/>
            </div>
            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
            <div>
              <button type="submit" className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign in</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;