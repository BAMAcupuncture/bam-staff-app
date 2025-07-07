import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const auth = getAuth();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    }
  };

  const handleForgotPassword = () => {
    // Optionally implement sendPasswordResetEmail
    alert('Forgot password not implemented yet.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 shadow-md rounded">
        <h2 className="text-2xl mb-4 font-semibold">Login</h2>
        <div className="mb-3">
          <label className="block mb-1">Email</label>
          <input
            type="email"
            className="border w-full p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            required
          />
        </div>
        <div className="mb-3">
          <label className="block mb-1">Password</label>
          <input
            type="password"
            className="border w-full p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white w-full py-2 mt-2">
          Log In
        </button>
        <button type="button" onClick={handleForgotPassword} className="text-blue-500 underline mt-2">
          Forgot password?
        </button>
      </form>
    </div>
  );
};

export default LoginPage;