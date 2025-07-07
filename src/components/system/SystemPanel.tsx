import React from 'react';

const SystemPanel: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">System Admin Panel</h1>
      <p>
        This is accessible only to the “isSystemAccount” user. Add impersonation,
        audit log viewer, or data health checks here.
      </p>
    </div>
  );
};

export default SystemPanel;