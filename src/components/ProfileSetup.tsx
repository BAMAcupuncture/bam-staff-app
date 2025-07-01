import React from 'react';
import { AlertTriangle, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ProfileSetup: React.FC = () => {
  const { user, error } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <div className="bg-amber-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Profile Setup Required</h1>
            <p className="text-gray-600 mb-6">
              Your account exists but you need a profile in the team collection to access the task management system.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-600 text-sm font-medium">Error: {error}</p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-medium text-blue-900 mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Setup Instructions
            </h3>
            <div className="text-left">
              <p className="text-sm text-blue-800 mb-4">
                <strong>Option 1: Use the Team Management (Recommended)</strong>
              </p>
              <ol className="text-sm text-blue-700 space-y-2 mb-6 pl-4">
                <li>1. Have an existing admin user log in to the task management system</li>
                <li>2. Go to the "Team" section in the navigation</li>
                <li>3. Click the "Add Member" button</li>
                <li>4. Fill out the form with your information:</li>
                <li className="ml-4">
                  • Name: <strong>Your Full Name</strong><br/>
                  • Email: <strong>{user?.email}</strong><br/>
                  • Firebase User ID: <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">{user?.uid}</code><br/>
                  • Role: <strong>Admin</strong> or <strong>Staff</strong>
                </li>
                <li>5. Click "Add Team Member" and refresh this page</li>
              </ol>

              <p className="text-sm text-blue-800 mb-4">
                <strong>Option 2: Manual Database Setup</strong>
              </p>
              <ol className="text-sm text-blue-700 space-y-2 pl-4">
                <li>1. Go to <a 
                  href="https://console.firebase.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline hover:text-blue-800 inline-flex items-center"
                >
                  Firebase Console <ExternalLink className="h-3 w-3 ml-1" />
                </a> → Firestore Database</li>
                <li>2. Navigate to the 'team' collection</li>
                <li>3. Create a new document with ID: <code className="bg-blue-100 px-2 py-1 rounded text-xs font-mono">{user?.uid}</code></li>
                <li>4. Add these exact fields:
                  <div className="mt-2 bg-blue-100 p-3 rounded text-xs font-mono">
                    name: "Your Full Name"<br/>
                    email: "{user?.email}"<br/>
                    role: "Admin" or "Staff"<br/>
                    uid: "{user?.uid}"<br/>
                    phone: null<br/>
                    status: "active"
                  </div>
                </li>
                <li>5. Save the document and refresh this page</li>
              </ol>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-green-900 mb-2">Critical Requirements</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• The document ID in Firestore MUST exactly match your Firebase UID</li>
              <li>• The 'uid' field in the document MUST exactly match your Firebase UID</li>
              <li>• Set role as "Admin" to access all features or "Staff" for standard access</li>
              <li>• Set status as "active" for proper team management</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>User ID:</strong> <code className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{user?.uid}</code></p>
              <p><strong>Account Created:</strong> {user?.metadata.creationTime}</p>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;