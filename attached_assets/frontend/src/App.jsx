import React, { useState, useEffect } from 'react';
import { Search, User, Book, Users, Home, LogOut, Menu, X, Plus, Edit, Trash2, Check, XCircle, Download, Eye, Upload, CheckCircle, Power, UserCheck, Settings, FileDown, Key, RefreshCw, BookOpen, GraduationCap, Calendar, Award } from 'lucide-react';

// Mock API Data
const mockAPI = {
  schools: [
    { _id: '1', name: 'Green Valley High School', code: 'GVHS001' }
  ],
  students: [
    { _id: '1', firstName: 'David', lastName: 'Adeleke', admissionNumber: 'GVHS2024001', class: 'JSS 3', classArm: 'A', gender: 'Male', isActive: true },
    { _id: '2', firstName: 'Blessing', lastName: 'Nwankwo', admissionNumber: 'GVHS2024002', class: 'JSS 3', classArm: 'A', gender: 'Female', isActive: true },
    { _id: '3', firstName: 'Emmanuel', lastName: 'Bello', admissionNumber: 'GVHS2024003', class: 'JSS 2', classArm: 'B', gender: 'Male', isActive: true },
  ],
  teachers: [
    { _id: '1', firstName: 'James', lastName: 'Okafor', email: 'james@school.com', isActive: true },
    { _id: '2', firstName: 'Sarah', lastName: 'Ibrahim', email: 'sarah@school.com', isActive: true },
  ],
  classes: [
    { _id: '1', name: 'Primary 1', level: 'Primary', grade: 1, academicYear: '2023/2024', capacity: 40 },
    { _id: '2', name: 'Primary 6', level: 'Primary', grade: 6, academicYear: '2023/2024', capacity: 38 },
    { _id: '3', name: 'JSS 1', level: 'JSS', grade: 1, academicYear: '2023/2024', capacity: 40 },
    { _id: '4', name: 'JSS 2', level: 'JSS', grade: 2, academicYear: '2023/2024', capacity: 35 },
    { _id: '5', name: 'JSS 3', level: 'JSS', grade: 3, academicYear: '2023/2024', capacity: 38 },
    { _id: '6', name: 'SS 1', level: 'SS', grade: 1, academicYear: '2023/2024', capacity: 30 },
  ],
  subjects: [
    { _id: '1', name: 'Mathematics', code: 'MATH101', category: 'Core' },
    { _id: '2', name: 'English Language', code: 'ENG101', category: 'Core' },
    { _id: '3', name: 'Physics', code: 'PHY101', category: 'Core' },
  ],
  assignments: [
    { _id: '1', teacher: { _id: '1', firstName: 'James', lastName: 'Okafor' }, subject: { _id: '1', name: 'Mathematics', code: 'MATH101' }, class: { _id: '5', name: 'JSS 3' }, academicYear: '2023/2024' },
    { _id: '2', teacher: { _id: '1', firstName: 'James', lastName: 'Okafor' }, subject: { _id: '2', name: 'English Language', code: 'ENG101' }, class: { _id: '5', name: 'JSS 3' }, academicYear: '2023/2024' },
  ],
  teacherResults: [
    { _id: '1', student: { _id: '1', firstName: 'David', lastName: 'Adeleke', admissionNumber: 'GVHS2024001' }, class: 'JSS 3', session: '2023/2024', term: 'First', subject: 'Mathematics', ca1: 8, ca2: 9, exam: 75, total: 92, grade: 'A', status: 'draft' },
    { _id: '2', student: { _id: '2', firstName: 'Blessing', lastName: 'Nwankwo', admissionNumber: 'GVHS2024002' }, class: 'JSS 3', session: '2023/2024', term: 'First', subject: 'Mathematics', ca1: 9, ca2: 10, exam: 80, total: 99, grade: 'A', status: 'submitted' },
    { _id: '3', student: { _id: '1', firstName: 'David', lastName: 'Adeleke', admissionNumber: 'GVHS2024001' }, class: 'JSS 3', session: '2023/2024', term: 'First', subject: 'English Language', ca1: 7, ca2: 8, exam: 70, total: 85, grade: 'A', status: 'approved' },
    { _id: '4', student: { _id: '2', firstName: 'Blessing', lastName: 'Nwankwo', admissionNumber: 'GVHS2024002' }, class: 'JSS 3', session: '2023/2024', term: 'First', subject: 'English Language', ca1: 6, ca2: 7, exam: 65, total: 78, grade: 'B', status: 'rejected', rejectionReason: 'CA1 score seems too low' },
  ],
  results: [
    { _id: '1', student: { firstName: 'David', lastName: 'Adeleke', admissionNumber: 'GVHS2024001' }, class: 'JSS 3', session: '2023/2024', term: 'First', status: 'submitted', uploadedBy: { firstName: 'James', lastName: 'Okafor' }, totalScore: 456, averageScore: 76 },
    { _id: '2', student: { firstName: 'Blessing', lastName: 'Nwankwo', admissionNumber: 'GVHS2024002' }, class: 'JSS 3', session: '2023/2024', term: 'First', status: 'approved', uploadedBy: { firstName: 'Sarah', lastName: 'Ibrahim' }, totalScore: 512, averageScore: 85 },
  ],
  pins: [
    { _id: '1', pin: 'ABC123DEF456', session: '2023/2024', term: 'First', isUsed: false, expiryDate: '2024-12-31' },
    { _id: '2', pin: 'XYZ789GHI012', session: '2023/2024', term: 'First', isUsed: true, expiryDate: '2024-12-31' },
  ],
  pinRequests: [
    { _id: '1', session: '2023/2024', term: 'First', quantity: 50, status: 'pending', createdAt: '2024-11-16' },
    { _id: '2', session: '2023/2024', term: 'Second', quantity: 30, status: 'approved', createdAt: '2024-10-20', processedAt: '2024-10-21' },
    { _id: '3', session: '2023/2024', term: 'Third', quantity: 40, status: 'rejected', createdAt: '2024-09-15', rejectionReason: 'Insufficient justification', processedAt: '2024-09-16' },
  ]
};

const useStore = () => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) setUser(JSON.parse(savedUser));
    }
  }, [token]);

  const login = async (credentials) => {
    await new Promise(r => setTimeout(r, 500));
    const userData = { id: '2', email: credentials.email, firstName: 'Admin', lastName: 'User', role: 'school_admin', school: { _id: '1', name: 'Green Valley High School' } };
    setToken('mock-token');
    setUser(userData);
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return { user, login, logout };
};

const Modal = ({ isOpen, onClose, title, children, size = 'max-w-2xl' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className={`bg-white rounded-xl shadow-2xl ${size} w-full max-h-[90vh] overflow-y-auto`}>
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold">{title}</h2>
          <button onClick={onClose}><X size={24} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center space-x-2`}>
      <CheckCircle size={20} />
      <span>{message}</span>
    </div>
  );
};

const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) return;
  const headers = Object.keys(data[0]);
  const csvContent = [headers.join(','), ...data.map(row => headers.map(h => `"${row[h] || ''}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const LandingPage = ({ onGetStarted }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800">
    <nav className="bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Book className="text-white" size={32} />
          <span className="text-white text-2xl font-bold">SmartResultChecker</span>
        </div>
        <button onClick={onGetStarted} className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold">Staff Login</button>
      </div>
    </nav>
    <div className="max-w-7xl mx-auto px-4 py-20 text-center text-white">
      <h1 className="text-5xl font-bold mb-6">School Result Management</h1>
      <p className="text-xl">Secure, Fast, and Efficient</p>
    </div>
  </div>
);

const LoginPage = ({ onLogin, onBack, onSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Book className="text-blue-600 mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-bold">Welcome Back</h2>
          <p className="text-gray-600 mt-2">Sign in to your account</p>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="your@email.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="••••••••" />
          </div>
          <button onClick={() => onLogin({ email, password })} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
            Sign In
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">Don't have an account? <button onClick={onSignup} className="text-blue-600 font-semibold hover:underline">Sign Up</button></p>
        </div>
        
        <div className="mt-6 text-center">
          <button onClick={onBack} className="text-gray-600 hover:underline text-sm">← Back to Home</button>
        </div>
        
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-semibold mb-2 text-gray-700">Quick Login (Demo):</p>
          <div className="space-y-2">
            <button onClick={() => { setEmail('superadmin@smartresult.com'); setPassword('pass'); }} className="w-full text-xs bg-purple-100 text-purple-800 px-3 py-2 rounded hover:bg-purple-200">Super Admin</button>
            <button onClick={() => { setEmail('admin@greenvalley.edu.ng'); setPassword('pass'); }} className="w-full text-xs bg-blue-100 text-blue-800 px-3 py-2 rounded hover:bg-blue-200">School Admin</button>
            <button onClick={() => { setEmail('teacher@greenvalley.edu.ng'); setPassword('pass'); }} className="w-full text-xs bg-green-100 text-green-800 px-3 py-2 rounded hover:bg-green-200">Teacher</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SignupPage = ({ onSignup, onBack, onLogin }) => {
  const [formData, setFormData] = useState({
    schoolName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSignup(formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Book className="text-blue-600 mx-auto mb-4" size={48} />
          <h2 className="text-3xl font-bold">Create School Account</h2>
          <p className="text-gray-600 mt-2">Register your school to get started</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">School Name *</label>
            <input 
              type="text" 
              value={formData.schoolName} 
              onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="e.g., Green Valley High School"
              required 
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">First Name *</label>
              <input 
                type="text" 
                value={formData.firstName} 
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} 
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="John"
                required 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name *</label>
              <input 
                type="text" 
                value={formData.lastName} 
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} 
                className="w-full px-4 py-2 border rounded-lg" 
                placeholder="Doe"
                required 
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Email Address *</label>
            <input 
              type="email" 
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="admin@yourschool.com"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Phone Number *</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="+234 800 000 0000"
              required 
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Password *</label>
            <input 
              type="password" 
              value={formData.password} 
              onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder="••••••••"
              minLength="6"
              required 
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account? <button onClick={onLogin} className="text-blue-600 font-semibold hover:underline">Sign In</button>
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <button onClick={onBack} className="text-gray-600 hover:underline text-sm">← Back to Home</button>
        </div>
      </div>
    </div>
  );
};
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'students', icon: User, label: 'Students' },
    { id: 'teachers', icon: Users, label: 'Teachers' },
    { id: 'classes', icon: BookOpen, label: 'Classes & Subjects' },
    { id: 'assignments', icon: GraduationCap, label: 'Teacher Assignments' },
    { id: 'results', icon: Award, label: 'Results Manager' },
    { id: 'pins', icon: Key, label: 'Result Codes' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-md fixed w-full z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Book className="text-blue-600" size={24} />
            <span className="text-xl font-bold">SmartResultChecker</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden md:block">
              <p className="text-sm font-semibold">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-600">{user?.school?.name}</p>
            </div>
            <button onClick={onLogout} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      <aside className={`fixed left-0 top-16 h-full bg-white shadow-lg transition-transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} w-64 z-20`}>
        <div className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} onClick={() => setActiveView(item.id)} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg ${activeView === item.id ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </aside>
      <main className={`pt-20 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all`}>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};

const DashboardLayout = ({ user, onLogout, children, activeView, setActiveView }) => {
  <div>
    <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
    <div className="grid grid-cols-4 gap-6">
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Students</p>
            <p className="text-3xl font-bold mt-2">{mockAPI.students.length}</p>
          </div>
          <User className="text-blue-600" size={32} />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Teachers</p>
            <p className="text-3xl font-bold mt-2">{mockAPI.teachers.length}</p>
          </div>
          <Users className="text-green-600" size={32} />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Active Classes</p>
            <p className="text-3xl font-bold mt-2">{mockAPI.classes.length}</p>
          </div>
          <BookOpen className="text-purple-600" size={32} />
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Pending Results</p>
            <p className="text-3xl font-bold mt-2">{mockAPI.results.filter(r => r.status === 'submitted').length}</p>
          </div>
          <Award className="text-orange-600" size={32} />
        </div>
      </div>
    </div>
    <div className="mt-8 grid grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">Recent Activities</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <CheckCircle className="text-green-600" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">Result approved for David Adeleke</p>
              <p className="text-xs text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
            <Upload className="text-blue-600" size={20} />
            <div className="flex-1">
              <p className="text-sm font-medium">New result submitted by James Okafor</p>
              <p className="text-xs text-gray-500">5 hours ago</p>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-lg font-bold mb-4">PIN Statistics</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Total PINs</span>
            <span className="font-bold">{mockAPI.pins.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Used</span>
            <span className="font-bold text-red-600">{mockAPI.pins.filter(p => p.isUsed).length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Available</span>
            <span className="font-bold text-green-600">{mockAPI.pins.filter(p => !p.isUsed).length}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AddStudentModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ firstName: '', lastName: '', admissionNumber: '', class: '', gender: 'Male', autoGenerate: false });
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSubmit(f); 
    setF({ firstName: '', lastName: '', admissionNumber: '', class: '', gender: 'Male', autoGenerate: false }); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Student">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">First Name *</label><input type="text" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm mb-2">Last Name *</label><input type="text" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={f.autoGenerate} 
              onChange={(e) => setF({ ...f, autoGenerate: e.target.checked, admissionNumber: '' })} 
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Auto-generate admission number</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">System will generate: SCHOOLCODE + YEAR + SEQUENCE</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Admission Number {!f.autoGenerate && '*'}</label>
            <input 
              type="text" 
              value={f.admissionNumber} 
              onChange={(e) => setF({ ...f, admissionNumber: e.target.value.toUpperCase() })} 
              className="w-full px-4 py-2 border rounded-lg" 
              placeholder={f.autoGenerate ? 'Auto-generated' : 'e.g., GVHS2024001'}
              disabled={f.autoGenerate}
              required={!f.autoGenerate}
            />
          </div>
          <div><label className="block text-sm mb-2">Class *</label><select value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select</option>{mockAPI.classes.map(c => <option key={c._id} value={c.name}>{c.name}</option>)}</select></div>
        </div>
        
        <div>
          <label className="block text-sm mb-2">Gender *</label>
          <select value={f.gender} onChange={(e) => setF({ ...f, gender: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
            <option>Male</option>
            <option>Female</option>
          </select>
        </div>

        {/* COMMENTED OUT FOR FUTURE VERSION */}
        {/* <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">Date of Birth</label><input type="date" className="w-full px-4 py-2 border rounded-lg" /></div>
        </div>
        <div><label className="block text-sm mb-2">Parent/Guardian Name</label><input type="text" className="w-full px-4 py-2 border rounded-lg" /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">Parent Phone</label><input type="tel" className="w-full px-4 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm mb-2">Parent Email</label><input type="email" className="w-full px-4 py-2 border rounded-lg" /></div>
        </div> */}

        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Add Student</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const BulkUploadModal = ({ isOpen, onClose, onSubmit }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [autoGenerate, setAutoGenerate] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const rows = text.split('\n').filter(r => r.trim());
        const headers = rows[0].split(',');
        const data = rows.slice(1, 6).map(row => {
          const values = row.split(',');
          return headers.reduce((obj, header, i) => ({ ...obj, [header.trim()]: values[i]?.trim() }), {});
        });
        setPreview(data);
      };
      reader.readAsText(f);
    }
  };

  const handleSubmit = () => {
    if (preview.length > 0) {
      onSubmit({ students: preview, autoGenerate });
      setFile(null);
      setPreview([]);
      setAutoGenerate(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Upload Students" size="max-w-4xl">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">CSV Format Required:</p>
          <p className="text-xs text-gray-600 mb-2">
            <strong>Option 1 (With Admission Numbers):</strong> firstName,lastName,admissionNumber,class,gender
          </p>
          <p className="text-xs text-gray-600">
            <strong>Option 2 (Auto-generate):</strong> firstName,lastName,class,gender
          </p>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoGenerate} 
              onChange={(e) => setAutoGenerate(e.target.checked)} 
              className="w-4 h-4"
            />
            <span className="text-sm font-medium">Auto-generate all admission numbers</span>
          </label>
          <p className="text-xs text-gray-600 mt-1">If checked, system will ignore admission numbers in CSV and auto-generate them</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Upload CSV File</label>
          <input type="file" accept=".csv" onChange={handleFileChange} className="w-full px-4 py-2 border rounded-lg" />
        </div>
        {preview.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Preview (First 5 rows):</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Admission No</th>
                    <th className="px-4 py-2 text-left">Class</th>
                    <th className="px-4 py-2 text-left">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{row.firstName} {row.lastName}</td>
                      <td className="px-4 py-2">
                        {autoGenerate ? (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Auto-generated</span>
                        ) : (
                          row.admissionNumber || <span className="text-xs text-red-600">Missing</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{row.class}</td>
                      <td className="px-4 py-2">{row.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex space-x-3 pt-4">
          <button onClick={handleSubmit} disabled={preview.length === 0} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">Upload Students</button>
          <button onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </div>
    </Modal>
  );
};

const ViewStudentModal = ({ isOpen, onClose, student, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [f, setF] = useState(student || {});

  useEffect(() => {
    if (student) setF(student);
  }, [student]);

  const handleSave = () => {
    onUpdate(f);
    setIsEditing(false);
  };

  if (!student) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Student Details">
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Personal Information</h3>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg">
              <Edit size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg">Save</button>
              <button onClick={() => { setIsEditing(false); setF(student); }} className="px-4 py-2 bg-gray-200 rounded-lg">Cancel</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
            {isEditing ? <input type="text" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /> : <p className="font-semibold">{f.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
            {isEditing ? <input type="text" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /> : <p className="font-semibold">{f.lastName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Admission Number</label>
            <p className="font-semibold">{f.admissionNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
            {isEditing ? <input type="text" value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /> : <p className="font-semibold">{f.class}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Gender</label>
            <p className="font-semibold">{f.gender}</p>
          </div>
        </div>

        {/* COMMENTED OUT FOR FUTURE VERSION */}
        {/* <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Additional Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Date of Birth</label>
              <p className="font-semibold">{f.dateOfBirth}</p>
            </div>
          </div>
        </div>
        <div className="pt-4 border-t">
          <h4 className="font-semibold mb-3">Parent/Guardian Information</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              {isEditing ? <input type="text" value={f.parentName} onChange={(e) => setF({ ...f, parentName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /> : <p className="font-semibold">{f.parentName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
              {isEditing ? <input type="tel" value={f.parentPhone} onChange={(e) => setF({ ...f, parentPhone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /> : <p className="font-semibold">{f.parentPhone}</p>}
            </div>
          </div>
        </div> */}
      </div>
    </Modal>
  );
};

const StudentsManagement = () => {
  const [students, setStudents] = useState(mockAPI.students);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);

  const filtered = students.filter(s => s.firstName.toLowerCase().includes(search.toLowerCase()) || s.lastName.toLowerCase().includes(search.toLowerCase()) || s.admissionNumber.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (data) => {
    setStudents([...students, { _id: String(students.length + 1), ...data, isActive: true }]);
    setIsAddOpen(false);
    setToast({ message: 'Student added successfully!', type: 'success' });
  };

  const handleBulkUpload = (data) => {
    const newStudents = data.students.map((s, i) => ({ 
      _id: String(students.length + i + 1), 
      ...s, 
      admissionNumber: data.autoGenerate ? `GVHS2024${String(students.length + i + 1).padStart(3, '0')}` : s.admissionNumber,
      isActive: true 
    }));
    setStudents([...students, ...newStudents]);
    setIsBulkOpen(false);
    setToast({ message: `${data.students.length} students uploaded!`, type: 'success' });
  };

  const handleUpdate = (data) => {
    setStudents(students.map(s => s._id === data._id ? data : s));
    setIsViewOpen(false);
    setToast({ message: 'Student updated!', type: 'success' });
  };

  const handleExport = () => {
    const data = filtered.map(s => ({ Name: `${s.firstName} ${s.lastName}`, AdmissionNumber: s.admissionNumber, Class: s.class, Gender: s.gender, ParentName: s.parentName, ParentPhone: s.parentPhone }));
    exportToCSV(data, 'students');
    setToast({ message: 'Exported successfully!', type: 'success' });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AddStudentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAdd} />
      <BulkUploadModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} onSubmit={handleBulkUpload} />
      <ViewStudentModal isOpen={isViewOpen} onClose={() => setIsViewOpen(false)} student={selectedStudent} onUpdate={handleUpdate} />
      
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Students Management</h1>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg"><FileDown size={20} /><span>Export</span></button>
          <button onClick={() => setIsBulkOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg"><Upload size={20} /><span>Bulk Upload</span></button>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /><span>Add Student</span></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" />
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission No</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s._id} className="border-t hover:bg-gray-50">
                <td className="px-6 py-4 font-medium">{s.firstName} {s.lastName}</td>
                <td className="px-6 py-4">{s.admissionNumber}</td>
                <td className="px-6 py-4">{s.class}</td>
                <td className="px-6 py-4">{s.gender}</td>
                <td className="px-6 py-4">
                  {/* COMMENTED OUT FOR FUTURE VERSION */}
                  {/* <div className="text-sm">{s.parentName}</div>
                  <div className="text-xs text-gray-500">{s.parentPhone}</div> */}
                  <span className="text-sm text-gray-500">—</span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => { setSelectedStudent(s); setIsViewOpen(true); }} className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"><Eye size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AddTeacherModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(f); setF({ firstName: '', lastName: '', email: '', password: '' }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Teacher">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">First Name *</label><input type="text" value={f.firstName} onChange={(e) => setF({ ...f, firstName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm mb-2">Last Name *</label><input type="text" value={f.lastName} onChange={(e) => setF({ ...f, lastName: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
        </div>
        <div><label className="block text-sm mb-2">Email *</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
        <div><label className="block text-sm mb-2">Password *</label><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Add Teacher</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const TeachersManagement = () => {
  const [teachers, setTeachers] = useState(mockAPI.teachers);
  const [search, setSearch] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const filtered = teachers.filter(t => t.firstName.toLowerCase().includes(search.toLowerCase()) || t.lastName.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  const handleAdd = (data) => {
    setTeachers([...teachers, { _id: String(teachers.length + 1), ...data, isActive: true }]);
    setIsAddOpen(false);
    setToast({ message: 'Teacher added!', type: 'success' });
  };

  const toggleStatus = (id) => {
    setTeachers(teachers.map(t => t._id === id ? { ...t, isActive: !t.isActive } : t));
    setToast({ message: 'Status updated!', type: 'success' });
  };

  const handleExport = () => {
    const data = filtered.map(t => ({ Name: `${t.firstName} ${t.lastName}`, Email: t.email, Status: t.isActive ? 'Active' : 'Suspended' }));
    exportToCSV(data, 'teachers');
    setToast({ message: 'Exported!', type: 'success' });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AddTeacherModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAdd} />
      
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Teachers Management</h1>
        <div className="flex space-x-3">
          <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg"><FileDown size={20} /><span>Export</span></button>
          <button onClick={() => setIsAddOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /><span>Add Teacher</span></button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <input type="text" placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full px-4 py-2 border rounded-lg mb-4" />
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t._id} className="border-t">
                <td className="px-6 py-4 font-medium">{t.firstName} {t.lastName}</td>
                <td className="px-6 py-4">{t.email}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs ${t.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.isActive ? 'Active' : 'Suspended'}</span></td>
                <td className="px-6 py-4"><button onClick={() => toggleStatus(t._id)} className={`p-2 rounded-lg ${t.isActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}><Power size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AddClassModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ name: '', level: 'Primary', grade: 1, academicYear: '2023/2024', capacity: 30 });
  
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSubmit(f); 
    setF({ name: '', level: 'Primary', grade: 1, academicYear: '2023/2024', capacity: 30 }); 
  };

  const maxGrade = f.level === 'Primary' ? 6 : 3;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Class">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm mb-2">Class Name *</label><input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Primary 1, JSS 1A" required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Level *</label>
            <select value={f.level} onChange={(e) => setF({ ...f, level: e.target.value, grade: 1 })} className="w-full px-4 py-2 border rounded-lg">
              <option>Primary</option>
              <option>JSS</option>
              <option>SS</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2">Grade *</label>
            <select value={f.grade} onChange={(e) => setF({ ...f, grade: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg">
              {[...Array(maxGrade)].map((_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">Academic Year *</label><input type="text" value={f.academicYear} onChange={(e) => setF({ ...f, academicYear: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm mb-2">Capacity</label><input type="number" value={f.capacity} onChange={(e) => setF({ ...f, capacity: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" /></div>
        </div>
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Add Class</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const AddSubjectModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ name: '', code: '', category: 'Core' });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(f); setF({ name: '', code: '', category: 'Core' }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm mb-2">Subject Name *</label><input type="text" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., Mathematics" required /></div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="block text-sm mb-2">Subject Code *</label><input type="text" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2 border rounded-lg" placeholder="e.g., MATH101" required /></div>
          <div><label className="block text-sm mb-2">Category *</label><select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="w-full px-4 py-2 border rounded-lg"><option>Core</option><option>Elective</option><option>Vocational</option></select></div>
        </div>
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Add Subject</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const ClassesSubjectsManagement = () => {
  const [classes, setClasses] = useState(mockAPI.classes);
  const [subjects, setSubjects] = useState(mockAPI.subjects);
  const [activeTab, setActiveTab] = useState('classes');
  const [isAddClassOpen, setIsAddClassOpen] = useState(false);
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAddClass = (data) => {
    setClasses([...classes, { _id: String(classes.length + 1), ...data }]);
    setIsAddClassOpen(false);
    setToast({ message: 'Class added!', type: 'success' });
  };

  const handleAddSubject = (data) => {
    setSubjects([...subjects, { _id: String(subjects.length + 1), ...data }]);
    setIsAddSubjectOpen(false);
    setToast({ message: 'Subject added!', type: 'success' });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AddClassModal isOpen={isAddClassOpen} onClose={() => setIsAddClassOpen(false)} onSubmit={handleAddClass} />
      <AddSubjectModal isOpen={isAddSubjectOpen} onClose={() => setIsAddSubjectOpen(false)} onSubmit={handleAddSubject} />
      
      <h1 className="text-3xl font-bold mb-6">Classes & Subjects</h1>
      
      <div className="flex space-x-2 mb-6">
        <button onClick={() => setActiveTab('classes')} className={`px-6 py-2 rounded-lg font-semibold ${activeTab === 'classes' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Classes</button>
        <button onClick={() => setActiveTab('subjects')} className={`px-6 py-2 rounded-lg font-semibold ${activeTab === 'subjects' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Subjects</button>
      </div>

      {activeTab === 'classes' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Classes</h2>
            <button onClick={() => setIsAddClassOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /><span>Add Class</span></button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c._id} className="border-t">
                    <td className="px-6 py-4 font-medium">{c.name}</td>
                    <td className="px-6 py-4">{c.level}</td>
                    <td className="px-6 py-4">{c.grade}</td>
                    <td className="px-6 py-4">{c.academicYear}</td>
                    <td className="px-6 py-4">{c.capacity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subjects' && (
        <div>
          <div className="flex justify-between mb-4">
            <h2 className="text-xl font-bold">Subjects</h2>
            <button onClick={() => setIsAddSubjectOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /><span>Add Subject</span></button>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map(s => (
                  <tr key={s._id} className="border-t">
                    <td className="px-6 py-4 font-medium">{s.name}</td>
                    <td className="px-6 py-4 font-mono text-sm">{s.code}</td>
                    <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs ${s.category === 'Core' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>{s.category}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const AddAssignmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ teacher: '', subject: '', class: '', academicYear: '2023/2024' });
  const handleSubmit = (e) => { e.preventDefault(); onSubmit(f); setF({ teacher: '', subject: '', class: '', academicYear: '2023/2024' }); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Teacher to Subject">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div><label className="block text-sm mb-2">Teacher *</label><select value={f.teacher} onChange={(e) => setF({ ...f, teacher: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select Teacher</option>{mockAPI.teachers.map(t => <option key={t._id} value={t._id}>{t.firstName} {t.lastName}</option>)}</select></div>
        <div><label className="block text-sm mb-2">Subject *</label><select value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select Subject</option>{mockAPI.subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
        <div><label className="block text-sm mb-2">Class *</label><select value={f.class} onChange={(e) => setF({ ...f, class: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required><option value="">Select Class</option>{mockAPI.classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
        <div><label className="block text-sm mb-2">Academic Year *</label><input type="text" value={f.academicYear} onChange={(e) => setF({ ...f, academicYear: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required /></div>
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Assign Teacher</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const AssignmentsManagement = () => {
  const [assignments, setAssignments] = useState(mockAPI.assignments);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const handleAdd = (data) => {
    const teacher = mockAPI.teachers.find(t => t._id === data.teacher);
    const subject = mockAPI.subjects.find(s => s._id === data.subject);
    const classData = mockAPI.classes.find(c => c._id === data.class);
    setAssignments([...assignments, { _id: String(assignments.length + 1), teacher, subject, class: classData, academicYear: data.academicYear }]);
    setIsAddOpen(false);
    setToast({ message: 'Teacher assigned!', type: 'success' });
  };

  const handleRemove = (id) => {
    setAssignments(assignments.filter(a => a._id !== id));
    setToast({ message: 'Assignment removed!', type: 'success' });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <AddAssignmentModal isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} onSubmit={handleAdd} />
      
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Teacher Assignments</h1>
        <button onClick={() => setIsAddOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg"><Plus size={20} /><span>Assign Teacher</span></button>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Academic Year</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map(a => (
              <tr key={a._id} className="border-t">
                <td className="px-6 py-4 font-medium">{a.teacher.firstName} {a.teacher.lastName}</td>
                <td className="px-6 py-4">{a.subject.name} <span className="text-xs text-gray-500">({a.subject.code})</span></td>
                <td className="px-6 py-4">{a.class.name}</td>
                <td className="px-6 py-4">{a.academicYear}</td>
                <td className="px-6 py-4"><button onClick={() => handleRemove(a._id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><Trash2 size={18} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ResultsApproval = () => {
  const [results, setResults] = useState(mockAPI.results);
  const [filter, setFilter] = useState('all');
  const [toast, setToast] = useState(null);

  const filtered = filter === 'all' ? results : results.filter(r => r.status === filter);

  const handleApprove = (id) => {
    setResults(results.map(r => r._id === id ? { ...r, status: 'approved' } : r));
    setToast({ message: 'Result approved!', type: 'success' });
  };

  const handleReject = (id) => {
    setResults(results.map(r => r._id === id ? { ...r, status: 'rejected' } : r));
    setToast({ message: 'Result rejected!', type: 'success' });
  };

  const handlePublish = (id) => {
    const result = results.find(r => r._id === id);
    if (result.status !== 'approved') {
      setToast({ message: 'Only approved results can be published!', type: 'error' });
      return;
    }
    setResults(results.map(r => r._id === id ? { ...r, published: !r.published } : r));
    setToast({ message: result.published ? 'Result unpublished!' : 'Result published!', type: 'success' });
  };

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Results Manager</h1>
        <div className="flex space-x-2">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
          <button onClick={() => setFilter('submitted')} className={`px-4 py-2 rounded-lg ${filter === 'submitted' ? 'bg-yellow-600 text-white' : 'bg-gray-200'}`}>Pending</button>
          <button onClick={() => setFilter('approved')} className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Approved</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session/Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Average</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r._id} className="border-t">
                <td className="px-6 py-4">
                  <div className="font-medium">{r.student.firstName} {r.student.lastName}</div>
                  <div className="text-xs text-gray-500">{r.student.admissionNumber}</div>
                </td>
                <td className="px-6 py-4">{r.class}</td>
                <td className="px-6 py-4">{r.session} - {r.term}</td>
                <td className="px-6 py-4 font-semibold">{r.averageScore}%</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${r.status === 'submitted' ? 'bg-yellow-100 text-yellow-800' : r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {r.status}
                  </span>
                  {r.published && <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Published</span>}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {r.status === 'submitted' && (
                      <>
                        <button onClick={() => handleApprove(r._id)} className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200" title="Approve"><Check size={18} /></button>
                        <button onClick={() => handleReject(r._id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200" title="Reject"><XCircle size={18} /></button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <button onClick={() => handlePublish(r._id)} className={`p-2 rounded-lg ${r.published ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'}`} title={r.published ? 'Unpublish' : 'Publish'}>
                        <Eye size={18} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const RequestPINModal = ({ isOpen, onClose, onSubmit }) => {
  const [f, setF] = useState({ session: '2023/2024', term: 'First', quantity: 10 });
  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSubmit(f); 
    setF({ session: '2023/2024', term: 'First', quantity: 10 }); 
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Result Codes (PINs)">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <p className="text-sm font-semibold text-blue-900">Submit a request to Super Admin</p>
          <p className="text-xs text-blue-700 mt-1">Your request will be reviewed and processed by the system administrator</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2">Academic Session *</label>
            <input type="text" value={f.session} onChange={(e) => setF({ ...f, session: e.target.value })} className="w-full px-4 py-2 border rounded-lg" placeholder="2023/2024" required />
          </div>
          <div>
            <label className="block text-sm mb-2">Term *</label>
            <select value={f.term} onChange={(e) => setF({ ...f, term: e.target.value })} className="w-full px-4 py-2 border rounded-lg">
              <option>First</option>
              <option>Second</option>
              <option>Third</option>
            </select>
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-2">Number of PINs Needed *</label>
          <input type="number" min="1" max="1000" value={f.quantity} onChange={(e) => setF({ ...f, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" required />
          <p className="text-xs text-gray-500 mt-1">Maximum: 1000 PINs per request</p>
        </div>
        
        <div className="flex space-x-3 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold">Submit Request</button>
          <button type="button" onClick={onClose} className="flex-1 bg-gray-200 py-3 rounded-lg font-semibold">Cancel</button>
        </div>
      </form>
    </Modal>
  );
};

const PINsManagement = () => {
  const [pins, setPins] = useState(mockAPI.pins);
  const [pinRequests, setPinRequests] = useState(mockAPI.pinRequests);
  const [filter, setFilter] = useState('all');
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const filtered = filter === 'all' ? pins : filter === 'used' ? pins.filter(p => p.isUsed) : pins.filter(p => !p.isUsed);

  const handleRequestPINs = (data) => {
    const newRequest = {
      _id: String(pinRequests.length + 1),
      ...data,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0]
    };
    setPinRequests([newRequest, ...pinRequests]);
    setIsRequestOpen(false);
    setToast({ message: 'PIN request submitted successfully! Awaiting Super Admin approval.', type: 'success' });
  };

  const handleExport = () => {
    const data = filtered.map(p => ({ PIN: p.pin, Session: p.session, Term: p.term, Status: p.isUsed ? 'Used' : 'Available', Expiry: p.expiryDate }));
    exportToCSV(data, 'pins');
    setToast({ message: 'Exported!', type: 'success' });
  };

  const pendingCount = pinRequests.filter(r => r.status === 'pending').length;

  return (
    <div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <RequestPINModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} onSubmit={handleRequestPINs} />
      
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Result Codes (PINs)</h1>
          <p className="text-sm text-gray-600 mt-1">Request PINs from Super Admin to distribute to students</p>
        </div>
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>All</button>
            <button onClick={() => setFilter('available')} className={`px-4 py-2 rounded-lg ${filter === 'available' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>Available</button>
            <button onClick={() => setFilter('used')} className={`px-4 py-2 rounded-lg ${filter === 'used' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>Used</button>
          </div>
          <button onClick={handleExport} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg"><FileDown size={20} /><span>Export</span></button>
          <button onClick={() => setIsRequestOpen(true)} className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg">
            <Plus size={20} />
            <span>Request PINs</span>
          </button>
        </div>
      </div>

      {/* PIN Statistics */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total PINs</p>
          <p className="text-2xl font-bold mt-1">{pins.length}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Available</p>
          <p className="text-2xl font-bold mt-1">{pins.filter(p => !p.isUsed).length}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Used</p>
          <p className="text-2xl font-bold mt-1">{pins.filter(p => p.isUsed).length}</p>
        </div>
      </div>

      {/* PIN Requests Section */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Your PIN Requests</h2>
          {pendingCount > 0 && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
              {pendingCount} Pending
            </span>
          )}
        </div>
        
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Request Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session/Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {pinRequests.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                  No PIN requests yet. Click "Request PINs" to submit your first request.
                </td>
              </tr>
            ) : (
              pinRequests.map(req => (
                <tr key={req._id} className="border-t">
                  <td className="px-6 py-4">{req.createdAt}</td>
                  <td className="px-6 py-4">{req.session} - {req.term}</td>
                  <td className="px-6 py-4 font-semibold">{req.quantity}</td>
                  <td className="px-6 py-4">
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                      </span>
                      {req.status === 'rejected' && req.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1">Reason: {req.rejectionReason}</p>
                      )}
                      {req.status === 'approved' && req.processedAt && (
                        <p className="text-xs text-gray-500 mt-1">Approved: {req.processedAt}</p>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Available PINs Section */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-bold mb-4">Available PINs</h2>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">PIN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Term</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p._id} className="border-t">
                <td className="px-6 py-4 font-mono font-semibold">{p.pin}</td>
                <td className="px-6 py-4">{p.session}</td>
                <td className="px-6 py-4">{p.term}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${p.isUsed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                    {p.isUsed ? 'Used' : 'Available'}
                  </span>
                </td>
                <td className="px-6 py-4">{p.expiryDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default function App() {
  const [currentPage, setCurrentPage] = useState('landing');
  const [activeView, setActiveView] = useState('dashboard');
  const { user, login, logout, signup } = useStore();

  useEffect(() => {
    if (user) setCurrentPage('dashboard');
  }, [user]);

  const handleLogout = () => { logout(); setCurrentPage('landing'); };

  if (currentPage === 'landing') return <LandingPage onGetStarted={() => setCurrentPage('login')} onSignup={() => setCurrentPage('signup')} />;
  if (currentPage === 'login') return <LoginPage onLogin={login} onBack={() => setCurrentPage('landing')} onSignup={() => setCurrentPage('signup')} />;
  if (currentPage === 'signup') return <SignupPage onSignup={signup} onBack={() => setCurrentPage('landing')} onLogin={() => setCurrentPage('login')} />;
  
  if (currentPage === 'dashboard' && user) {
    const views = { 
      dashboard: <Dashboard />, 
      students: <StudentsManagement />, 
      teachers: <TeachersManagement />,
      classes: <ClassesSubjectsManagement />,
      assignments: <AssignmentsManagement />,
      results: <ResultsApproval />,
      pins: <PINsManagement />
    };
    return <DashboardLayout user={user} onLogout={handleLogout} activeView={activeView} setActiveView={setActiveView}>{views[activeView]}</DashboardLayout>;
  }

  return <LandingPage onGetStarted={() => setCurrentPage('login')} onSignup={() => setCurrentPage('signup')} />;
}