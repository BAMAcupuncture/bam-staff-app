import React from 'react';

const ProfileSetup: React.FC = () => {
  return (
    <div className="p-8">
      <h2 className="text-xl font-semibold mb-4">Profile Setup Required</h2>
      <p>You are logged in but do not have a profile in the team collection.</p>
      <p>Please contact an Admin to set up your account before you can access the application.</p>
    </div>
  );
};

export default ProfileSetup;