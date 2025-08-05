'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth-service';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/services/firebase-config';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface StudentData {
  id: string;
  name: string;
  lastActive: Date;
  sessionsToday: number;
  wordsToday: number;
  progressScore: number;
  vocabularyGrowth: number;
}

interface DashboardMetrics {
  totalStudents: number;
  activeToday: number;
  totalWords: number;
  avgSessionLength: number;
  weeklyProgress: any[];
  categoryUsage: any[];
  timeOfDayActivity: any[];
}

export default function TeacherParentDashboard() {
  const [students, setStudents] = useState<StudentData[]>([]);
  const [, setSelectedStudent] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('today');
  const router = useRouter();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || !authService.hasAnyRole(['teacher', 'parent', 'therapist', 'admin'])) {
      router.push('/login');
      return;
    }

    loadDashboardData();
  }, [dateRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      // Get student IDs based on role
      let studentIds: string[] = [];
      if (authService.hasRole('admin') || authService.hasRole('therapist')) {
        // Load all students
        const studentsQuery = query(
          collection(db, 'users'),
          where('role', '==', 'student')
        );
        const snapshot = await getDocs(studentsQuery);
        studentIds = snapshot.docs.map(doc => doc.id);
      } else {
        // Load linked students for teachers/parents
        studentIds = user.metadata?.studentIds || [];
      }

      // Load student data
      const studentData: StudentData[] = [];
      for (const studentId of studentIds) {
        const data = await loadStudentMetrics(studentId);
        if (data) studentData.push(data);
      }
      setStudents(studentData);

      // Load overall metrics
      const metricsData = await loadOverallMetrics(studentIds);
      setMetrics(metricsData);

    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentMetrics = async (studentId: string): Promise<StudentData | null> => {
    try {
      // Get today's interactions
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const interactionsQuery = query(
        collection(db, 'interactions'),
        where('userId', '==', studentId),
        where('timestamp', '>=', today),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(interactionsQuery);
      const interactions = snapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const sessionsToday = new Set(interactions.map(i => i.sessionId)).size;
      const wordsToday = interactions
        .filter(i => i.type === 'tile_click')
        .map(i => i.tileData?.text)
        .filter(Boolean).length;

      // Get user profile
      const userQuery = await getDocs(
        query(collection(db, 'users'), where('userId', '==', studentId), limit(1))
      );
      const userData = userQuery.docs[0]?.data();

      // Calculate progress score (mock for now)
      const progressScore = Math.round(Math.random() * 30 + 70); // 70-100
      const vocabularyGrowth = Math.round(Math.random() * 20 + 5); // 5-25%

      return {
        id: studentId,
        name: userData?.displayName || 'Unknown Student',
        lastActive: userData?.lastActive?.toDate() || new Date(),
        sessionsToday,
        wordsToday,
        progressScore,
        vocabularyGrowth
      };
    } catch (error) {
      console.error('Failed to load student metrics:', error);
      return null;
    }
  };

  const loadOverallMetrics = async (studentIds: string[]): Promise<DashboardMetrics> => {
    // Mock data for demonstration
    return {
      totalStudents: studentIds.length,
      activeToday: Math.round(studentIds.length * 0.8),
      totalWords: 1250,
      avgSessionLength: 18.5,
      weeklyProgress: [
        { day: 'Mon', words: 850, sentences: 120 },
        { day: 'Tue', words: 920, sentences: 145 },
        { day: 'Wed', words: 1100, sentences: 180 },
        { day: 'Thu', words: 1050, sentences: 165 },
        { day: 'Fri', words: 1250, sentences: 195 },
      ],
      categoryUsage: [
        { name: 'Want', value: 35, color: '#9370DB' },
        { name: 'Need', value: 25, color: '#FF6347' },
        { name: 'Feel', value: 20, color: '#00CED1' },
        { name: 'Do', value: 15, color: '#8B4513' },
        { name: 'People', value: 5, color: '#FF8C00' },
      ],
      timeOfDayActivity: [
        { hour: '8am', activity: 45 },
        { hour: '10am', activity: 80 },
        { hour: '12pm', activity: 65 },
        { hour: '2pm', activity: 90 },
        { hour: '4pm', activity: 70 },
        { hour: '6pm', activity: 30 },
      ]
    };
  };

  const viewStudentDetails = (studentId: string) => {
    router.push(`/student/${studentId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {authService.hasRole('teacher') ? 'Teacher' : 'Parent'} Dashboard
        </h1>
        <p className="text-gray-400">Track student progress and communication patterns</p>
      </div>

      {/* Date Range Selector */}
      <div className="mb-6 flex gap-2">
        {['today', 'week', 'month'].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              dateRange === range
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {range.charAt(0).toUpperCase() + range.slice(1)}
          </button>
        ))}
      </div>

      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="text-3xl font-bold text-white">{metrics.totalStudents}</div>
            <div className="text-gray-400">Total Students</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="text-3xl font-bold text-green-400">{metrics.activeToday}</div>
            <div className="text-gray-400">Active Today</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="text-3xl font-bold text-blue-400">{metrics.totalWords}</div>
            <div className="text-gray-400">Words Used</div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800 rounded-lg p-6"
          >
            <div className="text-3xl font-bold text-purple-400">{metrics.avgSessionLength}m</div>
            <div className="text-gray-400">Avg Session</div>
          </motion.div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Progress */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Weekly Progress</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={metrics?.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
              <Line type="monotone" dataKey="words" stroke="#A855F7" strokeWidth={2} />
              <Line type="monotone" dataKey="sentences" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Usage */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Category Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics?.categoryUsage}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {metrics?.categoryUsage.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-2 mt-4">
            {metrics?.categoryUsage.map((cat: any) => (
              <div key={cat.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: cat.color }} />
                <span className="text-sm text-gray-400">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Students</h3>
        <div className="space-y-3">
          {students.map((student) => (
            <motion.div
              key={student.id}
              whileHover={{ scale: 1.01 }}
              className="bg-gray-700 rounded-lg p-4 flex items-center justify-between cursor-pointer hover:bg-gray-600 transition-colors"
              onClick={() => viewStudentDetails(student.id)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {student.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-medium">{student.name}</h4>
                  <p className="text-sm text-gray-400">
                    Last active: {new Date(student.lastActive).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{student.sessionsToday}</div>
                  <div className="text-xs text-gray-400">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{student.wordsToday}</div>
                  <div className="text-xs text-gray-400">Words</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{student.progressScore}%</div>
                  <div className="text-xs text-gray-400">Progress</div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ML Training Notice */}
      <div className="mt-8 bg-purple-900 bg-opacity-20 border border-purple-500 rounded-lg p-4">
        <p className="text-sm text-purple-300">
          🧠 All interactions are being collected to train our ML model for better AAC predictions and personalized communication support.
        </p>
      </div>
    </div>
  );
}