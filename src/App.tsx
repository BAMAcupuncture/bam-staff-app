import React, { useState, useMemo, useEffect, createContext, useContext, ReactNode } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, Query, doc, getDoc } from 'firebase/firestore';
import { LogOut } from 'lucide-react';

// ==================================================================
// 1. TYPES
// ==================================================================
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  uid: string;
  status: 'active' | 'terminated';
}
interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId?: string;
  dueDate: Date;
  status: 'Not Started' | 'In Progress' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
}

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

// Notice the trailing comma after <T,> -- This is the fix.
const useCollection = <T,>(collectionName: string): CollectionResponse<T> => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
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
      console.error("Firestore onSnapshot error:", error);
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
interface AuthContextType {
  user: any | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<any>;
}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="text-xl font-bold text-blue-600">BAM Task App</Link>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-800">{userProfile?.name}</p>
              <p className="text-xs text-gray-500">{userProfile?.role}</p>
            </div>
            <button onClick={handleLogout} className="p-2 rounded-full text-gray-500 hover:text-gray-700" title="Log Out"><LogOut size={24} /></button>
          </div>
        </div>
      </div>
    </header>
  );
};

const Navigation: React.FC = () => (
  <nav className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex space-x-8">
        <Link to="/" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Dashboard</Link>
        <Link to="/tasks" className="text-gray-500 hover:text-gray-700 px-3 py-4 text-sm font-medium">Tasks</Link>
      </div>
    </div>
  </nav>
);

const AppLoader: React.FC = () => <div className="flex justify-center items-center h-screen"><div>Loading...</div></div>;
const ProfileSetup: React.FC = () => <div className="p-8"><h2>Profile Setup Required</h2><p>Please contact an administrator to set up your team profile.</p></div>;

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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in</h2>
        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleLogin}>
            <input name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            <input name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" className="w-full flex justify-center py-2 px-4 border rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Sign in</button>
          </form>
        </div>
      </div>
    </div>
  );
};

const DashboardView: React.FC = () => {
  const { userProfile } = useAuth();
  const { data: tasks, loading: tasksLoading } = useCollection<Task>('tasks');
  if (tasksLoading) return <div>Loading dashboard...</div>;
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
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Tasks</h1>
      <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50"><tr><th>Task</th><th>Assignee</th><th>Status</th></tr></thead>
          <tbody>
            {(tasks || []).map(task => {
              const assignee = (teamMembers || []).find(m => m.uid === task.assigneeId);
              return <tr key={task.id}><td>{task.title}</td><td>{assignee?.name || 'Unassigned'}</td><td>{task.status}</td></tr>
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
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
    <div>
      <Header />
      <Navigation />
      <main className="p-8"><Outlet /></main>
    </div>
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
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;