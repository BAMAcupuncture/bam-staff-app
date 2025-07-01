import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertTriangle } from 'lucide-react';

interface AdminRouteProps {
  children: React.ReactNode;
  fallbackPath?: string;
  showAccessDenied?: boolean;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ 
  children, 
  fallbackPath = '/', 
  showAccessDenied = false 
}) => {
  const { userProfile, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access permissions...</p>
        </div>
      </div>
    );
  }

  // Check if user has admin role
  const isAdmin = userProfile?.role === 'Admin';

  if (!isAdmin) {
    // Show access denied page instead of redirect if requested
    if (showAccessDenied) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
              
              <div className="space-y-4 text-left">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="font-medium text-red-900 mb-2 flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    Administrator Access Required
                  </h3>
                  <p className="text-red-700 text-sm">
                    This section is restricted to users with administrator privileges. 
                    You currently have <strong>{userProfile?.role || 'Unknown'}</strong> access level.
                  </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Need Admin Access?</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Contact your system administrator</li>
                    <li>• Request role elevation if needed</li>
                    <li>• Verify you're logged in with the correct account</li>
                  </ul>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Your Current Access</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Name:</strong> {userProfile?.name || 'Unknown'}</p>
                    <p><strong>Email:</strong> {userProfile?.email || 'Unknown'}</p>
                    <p><strong>Role:</strong> {userProfile?.role || 'Unknown'}</p>
                    <p><strong>Status:</strong> {userProfile?.status || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Go Back
                </button>
                
                <button
                  onClick={() => window.location.href = '/'}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default behavior: redirect to fallback path
    return <Navigate to={fallbackPath} replace />;
  }

  // User is admin, render the protected content
  return <>{children}</>;
};

export default AdminRoute;