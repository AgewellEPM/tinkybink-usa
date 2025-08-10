'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { authService } from '@/services/auth-service';
import { 
  reportGenerationService, 
  StudentReport, 
  ReportTemplate 
} from '@/services/report-generation-service';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';

export default function ReportsPage() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState<'individual' | 'classroom' | 'iep'>('individual');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('weekly_progress');
  const [generatedReports, setGeneratedReports] = useState<StudentReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check permissions - Demo mode allows access without auth
    const user = authService.getCurrentUser();
    const isDemoMode = true; // Enable demo mode for Railway deployment
    
    if (!isDemoMode && (!user || !authService.hasAnyRole(['teacher', 'parent', 'therapist', 'admin']))) {
      router.push('/login');
      return;
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load available students
      const user = authService.getCurrentUser();
      
      // Demo students for Railway deployment
      const demoStudents = [
        { id: 'demo-1', name: 'Emma Johnson', grade: 'Grade 2', lastActive: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { id: 'demo-2', name: 'Liam Smith', grade: 'Grade 3', lastActive: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { id: 'demo-3', name: 'Sophia Davis', grade: 'Grade 1', lastActive: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { id: 'demo-4', name: 'Noah Wilson', grade: 'Grade 4', lastActive: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) }
      ];
      
      if (user?.metadata?.studentIds) {
        // Production: use real student data
        const students = user.metadata.studentIds.map((id: string, index: number) => ({
          id,
          name: `Student ${index + 1}`,
          grade: `Grade ${Math.floor(Math.random() * 5) + 1}`,
          lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        }));
        setAvailableStudents(students);
      } else {
        // Demo mode: use demo students
        setAvailableStudents(demoStudents);
      }

      // Load report templates
      const reportTemplates = reportGenerationService.getReportTemplates();
      setTemplates(reportTemplates);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const generateReports = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);
    try {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);

      if (reportType === 'individual') {
        const reports = await Promise.all(
          selectedStudents.map(studentId =>
            reportGenerationService.generateStudentReport(studentId, startDate, endDate, true)
          )
        );
        setGeneratedReports(reports);
      }
      // Add classroom and IEP report generation logic here
    } catch (error) {
      console.error('Failed to generate reports:', error);
      alert('Failed to generate reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (report: StudentReport, format: 'pdf' | 'csv' | 'json') => {
    try {
      if (format === 'pdf') {
        const pdfBlob = await reportGenerationService.exportToPDF(report);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.studentName}_report_${report.reportPeriod.endDate.toISOString().split('T')[0]}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const dataStr = JSON.stringify(report, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${report.studentName}_report.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export report:', error);
    }
  };

  const scheduleReport = async (template: ReportTemplate) => {
    try {
      await reportGenerationService.scheduleReport(
        template,
        selectedStudents,
        {
          frequency: template.frequency as any,
          time: '09:00',
          recipients: ['teacher@example.com']
        }
      );
      alert('Report scheduled successfully!');
    } catch (error) {
      console.error('Failed to schedule report:', error);
    }
  };

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000'];

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Student Reports & Analytics</h1>
        <p className="text-gray-400">Generate comprehensive reports from collected ML data</p>
      </div>

      {/* Report Configuration */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Report Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Students
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {availableStudents.map(student => (
                <label key={student.id} className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedStudents([...selectedStudents, student.id]);
                      } else {
                        setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{student.name} ({student.grade})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date Range
            </label>
            <div className="space-y-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
              />
            </div>
          </div>

          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              <option value="individual">Individual Student</option>
              <option value="classroom">Classroom Summary</option>
              <option value="iep">IEP Progress</option>
            </select>
            
            <label className="block text-sm font-medium text-gray-300 mb-2 mt-4">
              Template
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2 bg-gray-700 text-white rounded-lg border border-gray-600"
            >
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mt-6">
          <button
            onClick={generateReports}
            disabled={loading || selectedStudents.length === 0}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? 'Generating Reports...' : 'Generate Reports'}
          </button>
        </div>
      </div>

      {/* Generated Reports */}
      {generatedReports.length > 0 && (
        <div className="space-y-8">
          {generatedReports.map((report, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              {/* Report Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-white">{report.studentName}</h3>
                  <p className="text-gray-400">
                    Report Period: {report.reportPeriod.startDate.toLocaleDateString()} - {report.reportPeriod.endDate.toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport(report, 'pdf')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Export PDF
                  </button>
                  <button
                    onClick={() => exportReport(report, 'json')}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Export Data
                  </button>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-400">{report.metrics.totalSessions}</div>
                  <div className="text-sm text-gray-400">Total Sessions</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-400">{report.metrics.wordsUsed}</div>
                  <div className="text-sm text-gray-400">Words Used</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-400">{report.metrics.uniqueVocabulary}</div>
                  <div className="text-sm text-gray-400">Unique Words</div>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-yellow-400">{report.metrics.vocabularyGrowth.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Growth Rate</div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Weekly Progress */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Weekly Progress</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={report.progress.weeklyTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="week" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Line type="monotone" dataKey="words" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="sessions" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Usage */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-white mb-4">Category Usage</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={report.progress.categoryUsage}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="count"
                      >
                        {report.progress.categoryUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Skill Areas Progress */}
              <div className="bg-gray-700 p-4 rounded-lg mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Skill Areas Progress</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={report.progress.skillAreas}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="area" stroke="#9CA3AF" angle={-45} textAnchor="end" height={100} />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }}
                    />
                    <Bar dataKey="currentLevel" fill="#3B82F6" />
                    <Bar dataKey="previousLevel" fill="#6B7280" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-lg font-semibold text-white mb-4">Recommendations</h4>
                <ul className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-300">
                      <span className="text-yellow-400 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Milestones */}
              {report.progress.milestones.length > 0 && (
                <div className="bg-gray-700 p-4 rounded-lg mt-6">
                  <h4 className="text-lg font-semibold text-white mb-4">Recent Milestones</h4>
                  <div className="space-y-3">
                    {report.progress.milestones.map((milestone, idx) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                        <div>
                          <div className="text-white font-medium">{milestone.achievement}</div>
                          <div className="text-sm text-gray-400">
                            {milestone.date.toLocaleDateString()} - {milestone.description}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Report Templates */}
      <div className="mt-12 bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Automated Reports</h2>
        <p className="text-gray-400 mb-6">Schedule regular reports to be generated automatically</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map(template => (
            <div key={template.id} className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-2">{template.name}</h3>
              <p className="text-sm text-gray-400 mb-4">{template.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase">{template.frequency}</span>
                <button
                  onClick={() => scheduleReport(template)}
                  className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                >
                  Schedule
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ML Data Notice */}
      <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          🧠 All reports are generated from comprehensive ML data collection including interaction patterns, 
          engagement metrics, learning progress, and communication development tracked across all sessions.
        </p>
      </div>
    </div>
  );
}