import React from 'react';
import { Task } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../../config/firebase';

const SidebarTaskItem: React.FC<{ task: Task }> = ({ task }) => {
  const { user } = useAuth();

  // This defensively checks if actionSteps exists, defaulting to an empty array if not.
  // This prevents the ".filter() of undefined" error.
  const actionSteps = task.actionSteps || [];
  const completedSteps = actionSteps.filter(step => step.completed).length;
  const totalSteps = actionSteps.length;
  const progressPercent = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleToggleComplete = async () => {
    if (!user) return;
    const taskRef = doc(firestore, 'tasks', task.id);
    await updateDoc(taskRef, {
      status: 'Completed',
      completedDate: new Date(),
      completedBy: user.uid,
    });
  };

  const handleClaimTask = async () => {
    if (!user) return;
    const taskRef = doc(firestore, 'tasks', task.id);
    await updateDoc(taskRef, {
      assigneeId: user.uid,
      status