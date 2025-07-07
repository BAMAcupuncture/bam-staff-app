import React from 'react';

const GoalsView: React.FC = () => {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Goals</h1>
      {/* TODO: Fetch goals from Firestore and display them in a GoalCard or table */}
      <p>Goals list goes here...</p>
    </div>
  );
};

export default GoalsView;