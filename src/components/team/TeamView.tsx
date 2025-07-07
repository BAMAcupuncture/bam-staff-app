import React, { useEffect, useState } from 'react';
import { getFirestore, collection, doc, getDocs, updateDoc, query, where } from 'firebase/firestore';
import { TeamMember, Task } from '../../types';
import { useProfile } from '../../context/ProfileContext';

const TeamView: React.FC = () => {
  const db = getFirestore();
  const { profile } = useProfile();
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    // Fetch all team members
    const fetchTeam = async () => {
      const teamSnap = await getDocs(collection(db, 'team'));
      const members: TeamMember[] = [];
      teamSnap.forEach((docSnap) => {
        members.push(docSnap.data() as TeamMember);
      });
      setTeam(members);
    };
    fetchTeam();
  }, [db]);

  const handleTerminate = async (member: TeamMember) => {
    if (!profile) return;
    if (profile.role !== 'Admin') {
      alert('Only Admin can terminate a user.');
      return;
    }

    const confirmTerm = window.confirm(`Are you sure you want to terminate ${member.name}?`);
    if (!confirmTerm) return;

    // 1. Update the user’s status to terminated
    await updateDoc(doc(db, 'team', member.uid), {
      status: 'terminated',
    });

    // 2. Find that user’s incomplete tasks & unassign them
    const tasksRef = collection(db, 'tasks');
    const q = query(tasksRef, where('assigneeId', '==', member.uid), where('status', '!=', 'Completed'));
    const tasksSnap = await getDocs(q);
    for (const t of tasksSnap.docs) {
      await updateDoc(doc(db, 'tasks', t.id), {
        assigneeId: null,
      });
    }

    alert(`${member.name} has been terminated and tasks unassigned.`);
    // Refresh local team data
    setTeam((prev) =>
      prev.map((m) =>
        m.uid === member.uid ? { ...m, status: 'terminated' } : m
      )
    );
  };

  const handleReactivate = async (member: TeamMember) => {
    if (!profile) return;
    if (profile.role !== 'Admin') {
      alert('Only Admin can reactivate a user.');
      return;
    }

    const confirmReactivate = window.confirm(`Reactivate ${member.name}?`);
    if (!confirmReactivate) return;

    await updateDoc(doc(db, 'team', member.uid), {
      status: 'active',
    });

    alert(`${member.name} is back to active status. Tasks remain unassigned until claimed again.`);
    // Refresh local data
    setTeam((prev) =>
      prev.map((m) =>
        m.uid === member.uid ? { ...m, status: 'active' } : m
      )
    );
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Team Management</h1>
      {team.map((member) => (
        <div key={member.uid} className="border p-4 mb-2 flex justify-between items-center">
          <div>
            <p className="font-semibold">{member.name}</p>
            <p>Email: {member.email}</p>
            <p>Role: {member.role}</p>
            <p>Status: {member.status}</p>
          </div>
          <div>
            {member.status === 'active' ? (
              <button
                onClick={() => handleTerminate(member)}
                className="bg-red-600 text-white px-3 py-1 mr-2"
              >
                Terminate
              </button>
            ) : (
              <button
                onClick={() => handleReactivate(member)}
                className="bg-green-600 text-white px-3 py-1 mr-2"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TeamView;