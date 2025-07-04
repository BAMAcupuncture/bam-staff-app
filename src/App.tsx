import React, { useState, useMemo, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, Query, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { LogOut, Plus } from 'lucide-react';

// ==================================================================
// 1. TYPES
// ==================================================================
interface TeamMember { id: string; name: string; email: string; role: 'Admin' | 'Staff'; uid: string; status: 'active' | 'terminated'; }
interface Task { id: string; title: string; description: string; assigneeId?: string; dueDate: Date; status: 'Not Started' | 'In Progress' | 'Completed'; priority: 'Low' | 'Medium' | 'High'; }
interface Goal { id: string; title: string; description: string; type: string; status: 'active' | 'completed'; createdDate?: Date; targetDate?: Date; progress?: number; }

// ==================================================================
// 2. FIREBASE CONFIG
// ==================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

// ==================================================================
// 3. DATA-FETCHING HOOK (useCollection)
// ==================================================================
type CollectionResponse<T> = { data: T[]; loading: boolean };
const useCollection = <T,>(collectionName: string): CollectionResponse<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const collectionRef: Query = collection(firestore, collectionName);
    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const results: T[] = [];
      snapshot.forEach((doc) => {
        const docData = doc.data();
        for (const key in docData) {
          if (docData[key]?.toDate && typeof docData[key].toDate === 'function') {
            docData[key] = docData[key].toDate();
          }
        }
        results.push({ id: doc.id, ...docData } as T);
      });
      setData(results);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [collectionName]);
  return { data, loading };
};

// ==================================================================
// 4. AUTHENTICATION CONTEXT
// ==================================================================
interface UserProfile { name: string; role: 'Admin' | 'Staff'; uid: string; }
interface AuthContextType { user: any | null; userProfile: UserProfile | null; loading: boolean; login: (email: string, password: string) => Promise<any>; logout: () => Promise<any>; }
const AuthContext = createContext<AuthContextType | undefined>(undefined);
const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDocRef = doc(firestore, 'team', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        setUserProfile(userDoc.exists() ? (userDoc.data() as UserProfile) : null);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  const login = (email: string, password: string) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);
  const value = { user, userProfile, loading, login, logout };
  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

// ==================================================================
// 5. LAYOUT & PAGE COMPONENTS
// ==================================================================
const Header: React.FC = () => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const handleLogout = async () => { await signOut(auth); navigate('/login'); };
  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">BAM Task App</Link>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">{userProfile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 hover:text-gray-700" title="Log Out"><LogOut size={24} /></button>
          </div></div></div>
    </header>
  );
};

const Navigation: React.FC = () => (
  <nav className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="flex space-x-8">
        <Link to="/" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Dashboard</Link>
        <Link to="/tasks" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Tasks</Link>
        <Link to="/goals" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Goals</Link>
        <Link to="/calendar" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Calendar</Link>
        <Link to="/team" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Team</Link>
    </div></div>
  </nav>
);

const AppLoader: React.FC = () => <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
const ProfileSetup: React.FC = () => <div className="p-8"><h2>Profile Setup Required</h2><p>Please contact an administrator to create your team profile.</p></div>;

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) { setError('Failed to log in.'); }
  };
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8"><div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in</h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10"><form className="space-y-6" onSubmit={handleLogin}>
            <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            <input name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign in</button>
        </form></div></div></div>
  );
};

const GoalProgressIndicator: React.FC<{ goal: Goal }> = ({ goal }) => {
  const { progress, createdDate, targetDate, status } = goal;
  if (status !== 'active' || !targetDate || !createdDate) {
    return <div className="text-sm text-gray-500 capitalize">{status}</div>;
  }
  const today = new Date();
  if (today > targetDate) {
    return <div className="text-sm font-semibold text-red-600">Overdue</div>;
  }
  const totalDays = (targetDate.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
  const daysPassed = (today.getTime() - createdDate.getTime()) / (1000 * 3600 * 24);
  const expectedProgress = totalDays > 0 ? Math.min(Math.round((daysPassed / totalDays) * 100), 100) : 0;
  const variance = (progress || 0) - expectedProgress;
  let statusText = 'On Target';
  let statusColor = 'bg-green-500';
  if (variance < -25) { statusText = 'Behind'; statusColor = 'bg-red-500'; }
  else if (variance < -10) { statusText = 'At Risk'; statusColor = 'bg-yellow-500'; }
  return (
    <div>
      <div className="flex justify-between mb-1"><span className="text-sm font-medium text-gray-700">Progress</span><span className="text-sm font-medium text-gray-700">{progress || 0}%</span></div>
      <div className="w-full bg-gray-200 rounded-full h-2.5"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${progress || 0}%` }}></div></div>
      <div className="flex items-center mt-2"><div className={`w-3 h-3 rounded-full ${statusColor} mr-2`}></div><span className="text-sm text-gray-600">{statusText}</span><span className="text-xs text-gray-400 ml-1">(Expected: {expectedProgress}%)</span></div>
    </div>
  );
};

const GoalCard: React.FC<{ goal: Goal; onEdit: (goal: Goal) => void }> = ({ goal, onEdit }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start"><h3 className="text-lg font-bold text-gray-900">{goal.title}</h3><span className="text-sm text-gray-500 capitalize">{goal.type}</span></div>
        <p className="text-gray-700 my-4 text-sm">{goal.description}</p>
      </div>
      <div>
        <GoalProgressIndicator goal={goal} />
        <button onClick={() => onEdit(goal)} className="text-sm text-blue-600 hover:underline mt-4">Edit Goal</button>
      </div>
    </div>
  );
};

const GoalModal: React.FC<{ goal: Goal | null; onClose: () => void; }> = ({ goal, onClose }) => {
  const [formData, setFormData] = useState({
    title: goal?.title || '',
    description: goal?.description || '',
    type: goal?.type || 'monthly',
    targetDate: goal?.targetDate ? format(goal.targetDate, 'yyyy-MM-dd') : '',
    progress: goal?.progress || 0,
  });
  const isEditing = goal !== null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'progress' ? Number(value) : value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData, targetDate: new Date(formData.targetDate), progress: Number(formData.progress), };
    try {
      if (isEditing) {
        const goalRef = doc(firestore, 'goals', goal.id);
        await updateDoc(goalRef, dataToSave);
      } else {
        await addDoc(collection(firestore, 'goals'), { ...dataToSave, status: 'active', createdDate: serverTimestamp(), });
      }
      onClose();
    } catch (error) { console.error("Error saving goal:", error); }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-6">{isEditing ? 'Edit Goal' : 'Create New Goal'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="title" value={formData.title} onChange={handleChange} placeholder="Goal Title" required className="block w-full px-3 py-2 border border-gray-300 rounded-md"/>
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" required className="block w-full px-3 py-2 border border-gray-300 rounded-md"/>
          <select name="type" value={formData.type} onChange={handleChange} className="block w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option>
          </select>
          <input name="targetDate" type="date" value={formData.targetDate} onChange={handleChange} required className="block w-full px-3 py-2 border border-gray-300 rounded-md"/>
          <div><label>Progress: {formData.progress}%</label><input name="progress" type="range" min="0" max="100" value={formData.progress} onChange={handleChange} className="w-full"/></div>
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">{isEditing ? 'Save Changes' : 'Create Goal'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};


const DashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: tasks, loading } = useCollection<Task>('tasks');
  if (loading) return <div>Loading dashboard...</div>;
  const userTasks = (tasks || []).filter(task => task.assigneeId === userProfile?.uid);
  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome, {userProfile?.name}!</h1>
      <p>You have {userTasks.length} assigned tasks.</p>
    </div>
  );
};

const TasksView: React.FC = () => {
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  const { data: teamMembers, loading: teamLoading } = useCollection<TeamMember>('team');
  if (tasksLoading || teamLoading) return <div>Loading tasks...</div>;
  return (
    <div><h1 className="text-3xl font-bold text-gray-900 mb-6">Tasks</h1>
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg"><table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th>Task</th><th>Assignee</th><th>Status</th></tr></thead>
          <tbody>
            {(tasks || []).map(task => {
              const assignee = (teamMembers || []).find(m => m.uid === task.assigneeId);
              return <tr key={task.id}><td>{task.title}</td><td>{assignee?.name || 'Unassigned'}</td><td>{task.status}</td></tr>
            })}
          </tbody></table></div></div>
  );
};

const GoalsView: React.FC = () => {
    const { data: goals, loading } = useCollection<Goal>('goals');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
    const handleOpenModal = (goal: Goal | null) => { setSelectedGoal(goal); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedGoal(null); };
    if (loading) return <div>Loading goals...</div>;
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Goals</h1>
                <button onClick={() => handleOpenModal(null)} className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-blue-700 flex items-center">
                    <Plus size={20} className="mr-2" /> New Goal
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(goals || []).map(goal => (<GoalCard key={goal.id} goal={goal} onEdit={handleOpenModal} />))}
            </div>
            {isModalOpen && <GoalModal goal={selectedGoal} onClose={handleCloseModal} />}
        </div>
    );
};
const CalendarView: React.FC = () => <div><h1 className="text-3xl font-bold text-gray-900">Calendar</h1><p>Calendar view coming soon.</p></div>;
const TeamView: React.FC = () => {
    const { data: team, loading } = useCollection<TeamMember>('team');
    if (loading) return <div>Loading team...</div>
    return <div><h1 className="text-3xl font-bold text-gray-900">Team</h1><ul>{(team || []).map(t => <li key={t.id}>{t.name}</li>)}</ul></div>
};


// ==================================================================
// 6. THE APP ROUTING
// ==================================================================
const ProtectedRoute: React.FC = () => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return <AppLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (!userProfile) return <ProfileSetup />;
  return (
    <div><Header /><Navigation /><main className="p-8"><Outlet /></main></div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardView />} />
            <Route path="/tasks" element={<TasksView />} />
            <Route path="/goals" element={<GoalsView />} />
            <Route path="/calendar" element={<CalendarView />} />
            <Route path="/team" element={<TeamView />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;