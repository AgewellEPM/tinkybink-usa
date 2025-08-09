'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TrophyIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  ChartBarIcon as ChartBarIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import { enterpriseClinicService } from '@/services/enterprise-clinic-service';

export default function EnterpriseDashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'therapists' | 'compliance' | 'locations' | 'reports'>('overview');
  const [clinicData, setClinicData] = useState<any>(null);
  const [therapistAnalytics, setTherapistAnalytics] = useState<any>(null);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [multiLocationData, setMultiLocationData] = useState<any>(null);
  const [executiveReport, setExecutiveReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const clinicId = 'clinic_001';
      
      // Load all dashboard data
      const [
        dashboard,
        therapists,
        compliance,
        locations,
        report
      ] = await Promise.all([
        enterpriseClinicService.getClinicDashboard(clinicId),
        enterpriseClinicService.getTherapistAnalytics(clinicId, 'month'),
        enterpriseClinicService.getComplianceStatus(clinicId),
        enterpriseClinicService.getMultiLocationInsights(clinicId),
        enterpriseClinicService.generateExecutiveReport(clinicId, 'monthly')
      ]);

      setClinicData(dashboard);
      setTherapistAnalytics(therapists);
      setComplianceData(compliance);
      setMultiLocationData(locations);
      setExecutiveReport(report);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-900/20 border-red-500/30';
      case 'high': return 'text-orange-400 bg-orange-900/20 border-orange-500/30';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30';
      case 'low': return 'text-blue-400 bg-blue-900/20 border-blue-500/30';
      default: return 'text-gray-400 bg-gray-900/20 border-gray-500/30';
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'text-green-400 bg-green-900/20';
      case 'needs_attention': return 'text-yellow-400 bg-yellow-900/20';
      case 'non_compliant': return 'text-red-400 bg-red-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const tabs = [
    { id: 'overview', title: 'Overview', icon: ChartBarIcon },
    { id: 'therapists', title: 'Therapists', icon: UsersIcon },
    { id: 'compliance', title: 'Compliance', icon: ShieldCheckIcon },
    { id: 'locations', title: 'Locations', icon: BuildingOffice2Icon },
    { id: 'reports', title: 'Reports', icon: DocumentTextIcon }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading Enterprise Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Enterprise Dashboard
                <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium">
                  <ChartBarIconSolid className="h-4 w-4 mr-1" />
                  Multi-Clinic
                </span>
              </h1>
              <p className="text-gray-400">
                Austin Speech & Language Center - Enterprise Analytics & Management
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">
                  ${clinicData?.overview.monthlyRevenue.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">Monthly Revenue</div>
              </div>
              
              <button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                <Cog6ToothIcon className="h-5 w-5" />
                Settings
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-6 bg-gray-800 p-1 rounded-lg">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                <span className="font-medium">{tab.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-2xl p-6 border border-green-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    ${clinicData.overview.monthlyRevenue.toLocaleString()}
                  </div>
                  <div className="text-green-400 text-sm">Monthly Revenue</div>
                </div>

                <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 rounded-2xl p-6 border border-blue-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <UsersIcon className="h-8 w-8 text-blue-400" />
                    <div className="text-blue-400 text-sm">+12%</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {clinicData.overview.totalTherapists}
                  </div>
                  <div className="text-blue-400 text-sm">Active Therapists</div>
                </div>

                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <TrophyIcon className="h-8 w-8 text-purple-400" />
                    <div className="text-purple-400 text-sm">High</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {clinicData.overview.utilizationRate}%
                  </div>
                  <div className="text-purple-400 text-sm">Utilization Rate</div>
                </div>

                <div className="bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-2xl p-6 border border-orange-500/30">
                  <div className="flex items-center justify-between mb-4">
                    <ClockIcon className="h-8 w-8 text-orange-400" />
                    <div className="text-orange-400 text-sm">Active</div>
                  </div>
                  <div className="text-3xl font-bold text-white mb-1">
                    {clinicData.overview.activePatients}
                  </div>
                  <div className="text-orange-400 text-sm">Active Patients</div>
                </div>
              </div>

              {/* KPIs & Alerts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Key Performance Indicators */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Key Performance Indicators</h2>
                  <div className="space-y-4">
                    {clinicData.kpis.map((kpi: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div>
                          <div className="text-white font-medium">{kpi.name}</div>
                          <div className="text-gray-400 text-sm">
                            {kpi.trend === 'up' ? '↗' : kpi.trend === 'down' ? '↘' : '→'} {kpi.changePercent}%
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {kpi.value}{kpi.unit}
                          </div>
                          <div className={`text-sm ${
                            kpi.trend === 'up' ? 'text-green-400' : 
                            kpi.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {kpi.trend === 'up' ? 'Improving' : 
                             kpi.trend === 'down' ? 'Declining' : 'Stable'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alerts & Notifications */}
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Alerts & Notifications</h2>
                  <div className="space-y-3">
                    {clinicData.alerts.map((alert: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {alert.severity === 'critical' || alert.severity === 'high' ? (
                              <ExclamationTriangleIconSolid className="h-5 w-5 text-current" />
                            ) : (
                              <CheckCircleIconSolid className="h-5 w-5 text-current" />
                            )}
                            <div>
                              <div className="font-medium text-current capitalize">
                                {alert.type} Alert
                              </div>
                              <div className="text-current text-sm opacity-90 mt-1">
                                {alert.message}
                              </div>
                            </div>
                          </div>
                          {alert.actionRequired && (
                            <button className="text-current hover:opacity-75 text-sm font-medium">
                              Take Action
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {clinicData.recentActivity.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-4 bg-gray-700/50 rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${
                        activity.type === 'appointment' ? 'bg-blue-400' :
                        activity.type === 'billing' ? 'bg-green-400' :
                        activity.type === 'milestone' ? 'bg-purple-400' : 'bg-gray-400'
                      }`}></div>
                      <div className="flex-1">
                        <div className="text-white">{activity.description}</div>
                        <div className="text-gray-400 text-sm">
                          {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.type === 'appointment' ? 'bg-blue-900/30 text-blue-400' :
                        activity.type === 'billing' ? 'bg-green-900/30 text-green-400' :
                        activity.type === 'milestone' ? 'bg-purple-900/30 text-purple-400' : 'bg-gray-900/30 text-gray-400'
                      }`}>
                        {activity.type}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Therapist Analytics Tab */}
          {activeTab === 'therapists' && therapistAnalytics && (
            <motion.div
              key="therapists"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Performance Distribution */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Performance Distribution</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {therapistAnalytics.performanceDistribution.excellent}
                    </div>
                    <div className="text-green-300 text-sm">Excellent (90+)</div>
                  </div>
                  <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {therapistAnalytics.performanceDistribution.good}
                    </div>
                    <div className="text-blue-300 text-sm">Good (75-89)</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                    <div className="text-3xl font-bold text-yellow-400">
                      {therapistAnalytics.performanceDistribution.average}
                    </div>
                    <div className="text-yellow-300 text-sm">Average (60-74)</div>
                  </div>
                  <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <div className="text-3xl font-bold text-red-400">
                      {therapistAnalytics.performanceDistribution.needsImprovement}
                    </div>
                    <div className="text-red-300 text-sm">Needs Improvement</div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Top Performers</h2>
                <div className="space-y-4">
                  {therapistAnalytics.topPerformers.map((therapist: any, index: number) => (
                    <div key={therapist.therapistId} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                            index === 0 ? 'bg-yellow-600' : 
                            index === 1 ? 'bg-gray-500' : 
                            index === 2 ? 'bg-orange-600' : 'bg-purple-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="text-white font-bold">{therapist.name}</div>
                            <div className="text-gray-400 text-sm">Performance Score: {therapist.score}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold">
                            ${therapist.metrics.revenue.toLocaleString()}
                          </div>
                          <div className="text-gray-400 text-sm">Revenue</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-white font-medium">{therapist.metrics.sessions}</div>
                          <div className="text-gray-400 text-xs">Sessions</div>
                        </div>
                        <div>
                          <div className="text-white font-medium">{therapist.metrics.satisfaction.toFixed(1)}</div>
                          <div className="text-gray-400 text-xs">Satisfaction</div>
                        </div>
                        <div>
                          <div className="text-white font-medium">{therapist.metrics.efficiency}%</div>
                          <div className="text-gray-400 text-xs">Efficiency</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benchmarks */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Performance Benchmarks</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {therapistAnalytics.benchmarks.avgSessionsPerWeek}
                    </div>
                    <div className="text-gray-400 text-sm">Avg Sessions/Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      ${therapistAnalytics.benchmarks.avgRevenuePerSession}
                    </div>
                    <div className="text-gray-400 text-sm">Revenue/Session</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {therapistAnalytics.benchmarks.avgClientSatisfaction.toFixed(1)}
                    </div>
                    <div className="text-gray-400 text-sm">Client Satisfaction</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-400">
                      {therapistAnalytics.benchmarks.utilizationRate}%
                    </div>
                    <div className="text-gray-400 text-sm">Utilization Rate</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && complianceData && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* HIPAA Compliance Overview */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">HIPAA Compliance</h2>
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      complianceData.hipaa.riskLevel === 'low' ? 'bg-green-900/30 text-green-400' :
                      complianceData.hipaa.riskLevel === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                      'bg-red-900/30 text-red-400'
                    }`}>
                      {complianceData.hipaa.riskLevel.toUpperCase()} RISK
                    </div>
                    <div className="text-2xl font-bold text-green-400">
                      {complianceData.hipaa.score}%
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {complianceData.hipaa.requirements.map((req: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          req.status === 'compliant' ? 'bg-green-400' :
                          req.status === 'needs_attention' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}></div>
                        <div>
                          <div className="text-white font-medium">{req.requirement}</div>
                          {req.evidence && (
                            <div className="text-gray-400 text-sm">{req.evidence}</div>
                          )}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getComplianceColor(req.status)}`}>
                        {req.status.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Documentation & Billing Compliance */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Documentation Compliance</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Completion Rate</span>
                      <span className="text-green-400 font-bold">
                        {complianceData.documentation.completionRate}%
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Avg Time to Complete</span>
                      <span className="text-blue-400 font-bold">
                        {complianceData.documentation.avgTimeToComplete}h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Quality Score</span>
                      <span className="text-purple-400 font-bold">
                        {complianceData.documentation.qualityScore}/5
                      </span>
                    </div>
                    
                    {complianceData.documentation.missingDocuments.length > 0 && (
                      <div className="mt-4 p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                        <div className="text-yellow-400 font-medium mb-2">Missing Documents</div>
                        <div className="text-yellow-300 text-sm">
                          {complianceData.documentation.missingDocuments.length} documents overdue
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                  <h2 className="text-xl font-bold text-white mb-4">Billing Compliance</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Accuracy Rate</span>
                      <span className="text-green-400 font-bold">
                        {complianceData.billing.accuracyRate}%
                      </span>
                    </div>
                    
                    <div>
                      <div className="text-gray-300 mb-2">Common Denial Reasons</div>
                      <div className="space-y-2">
                        {Object.entries(complianceData.billing.denialReasons).map(([reason, count]) => (
                          <div key={reason} className="flex justify-between text-sm">
                            <span className="text-gray-400">{reason}</span>
                            <span className="text-white">{count as number}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Staff Compliance */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Staff Compliance</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <div className="text-3xl font-bold text-green-400">
                      {complianceData.staff.currentCertifications}
                    </div>
                    <div className="text-green-300 text-sm">Current Certifications</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-900/20 rounded-lg border border-yellow-500/30">
                    <div className="text-3xl font-bold text-yellow-400">
                      {complianceData.staff.expiringCertifications.length}
                    </div>
                    <div className="text-yellow-300 text-sm">Expiring Soon</div>
                  </div>
                  <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <div className="text-3xl font-bold text-blue-400">
                      {complianceData.staff.trainingCompletion}%
                    </div>
                    <div className="text-blue-300 text-sm">Training Complete</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Executive Report Tab */}
          {activeTab === 'reports' && executiveReport && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Executive Summary */}
              <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-8 border border-purple-500/30">
                <h2 className="text-2xl font-bold text-white mb-6">Executive Summary - {executiveReport.summary.period}</h2>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                  {Object.entries(executiveReport.summary.keyMetrics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-2xl font-bold text-white">
                        {typeof value === 'number' && key.includes('Revenue') ? `$${(value as number).toLocaleString()}` : value}
                      </div>
                      <div className="text-gray-300 text-sm">{key}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-white font-bold mb-3">Key Achievements</h3>
                    <ul className="space-y-2">
                      {executiveReport.summary.achievements.map((achievement: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-green-300">
                          <CheckCircleIconSolid className="h-5 w-5 mt-0.5" />
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-white font-bold mb-3">Challenges</h3>
                    <ul className="space-y-2">
                      {executiveReport.summary.challenges.map((challenge: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-yellow-300">
                          <ExclamationTriangleIconSolid className="h-5 w-5 mt-0.5" />
                          {challenge}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Financial Analysis */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Financial Analysis</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-green-900/20 rounded-lg border border-green-500/30">
                    <div className="text-2xl font-bold text-green-400">
                      ${executiveReport.financialAnalysis.revenue.toLocaleString()}
                    </div>
                    <div className="text-green-300 text-sm">Total Revenue</div>
                  </div>
                  <div className="text-center p-4 bg-red-900/20 rounded-lg border border-red-500/30">
                    <div className="text-2xl font-bold text-red-400">
                      ${executiveReport.financialAnalysis.expenses.toLocaleString()}
                    </div>
                    <div className="text-red-300 text-sm">Total Expenses</div>
                  </div>
                  <div className="text-center p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                    <div className="text-2xl font-bold text-blue-400">
                      ${executiveReport.financialAnalysis.profit.toLocaleString()}
                    </div>
                    <div className="text-blue-300 text-sm">Net Profit</div>
                  </div>
                  <div className="text-center p-4 bg-purple-900/20 rounded-lg border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400">
                      {executiveReport.financialAnalysis.profitMargin}%
                    </div>
                    <div className="text-purple-300 text-sm">Profit Margin</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-white font-bold mb-3">Revenue by Service</h3>
                  <div className="space-y-3">
                    {Object.entries(executiveReport.financialAnalysis.revenueByService).map(([service, revenue]) => (
                      <div key={service} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <span className="text-gray-300">{service}</span>
                        <span className="text-green-400 font-bold">
                          ${(revenue as number).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strategic Recommendations */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                <h2 className="text-xl font-bold text-white mb-4">Strategic Recommendations</h2>
                <div className="space-y-4">
                  {executiveReport.strategicRecommendations.map((rec: any, index: number) => (
                    <div key={index} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="text-white font-bold">{rec.recommendation}</div>
                          <div className="text-gray-400 text-sm capitalize">{rec.category} • {rec.timeframe}</div>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          rec.priority === 'high' ? 'bg-red-900/30 text-red-400' :
                          rec.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-gray-900/30 text-gray-400'
                        }`}>
                          {rec.priority} priority
                        </div>
                      </div>
                      <div className="text-gray-300 text-sm">{rec.expectedImpact}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}