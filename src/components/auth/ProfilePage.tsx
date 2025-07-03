// src/components/auth/ProfilePage.tsx

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { updatePassword } from 'firebase/auth';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (newPassword !== confirmPassword) {
            return setError("Passwords do not match.");
        }
        if (newPassword.length < 6) {
            return setError("Password should be at least 6 characters.");
        }
        if (!user) {
            return setError("No user is currently logged in.");
        }

        try {
            await updatePassword(user, newPassword);
            setMessage("Password updated successfully!");
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setError("Failed to update password. You may need to log out and log back in again to perform this action.");
        }
    };

    return (
        <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>
            <div className="max-w-md bg-white p-6 rounded-lg shadow">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">New Password</label>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {message && <p className="text-sm text-green-600">{message}</p>}

                    <button type="submit" className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                        Update Password
                    </button>
                </form>
            </div>
        </div>
    );
};

// This is the line that was likely missing
export default ProfilePage;