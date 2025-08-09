'use client';

import React, { useState, useEffect } from 'react';
import { roiCalculatorService } from '../services/roi-calculator-service';
import type { ROIInputs, ROIResults } from '../services/roi-calculator-service';

export default function ROICalculatorWidget() {
  const [step, setStep] = useState(1);
  const [inputs, setInputs] = useState<ROIInputs>({
    numberOfPatients: 50,
    sessionsPerWeek: 40,
    averageSessionRate: 125,
    hoursOnDocumentation: 20,
    hoursOnBilling: 10,
    deniedClaimsPerMonth: 10,
    averageDeniedClaimValue: 500,
    hourlyStaffRate: 35,
    numberOfTherapists: 2,
    currentAACSoftwareCost: 199,
    currentBillingSoftwareCost: 299
  });
  
  const [results, setResults] = useState<ROIResults | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [animatedValue, setAnimatedValue] = useState(0);
  const [competitors, setCompetitors] = useState<any[]>([]);

  useEffect(() => {
    // Load competitor data
    const competitorData = roiCalculatorService.getCompetitorComparison('10001');
    setCompetitors(competitorData);
  }, []);

  useEffect(() => {
    // Animate the savings number
    if (results && showResults) {
      const target = results.annualSavings;
      const duration = 2000;
      const steps = 60;
      const increment = target / steps;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setAnimatedValue(target);
          clearInterval(timer);
        } else {
          setAnimatedValue(current);
        }
      }, duration / steps);
      
      return () => clearInterval(timer);
    }
  }, [results, showResults]);

  const handleInputChange = (field: keyof ROIInputs, value: number) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const calculateROI = () => {
    const calculatedResults = roiCalculatorService.calculateROI(inputs);
    setResults(calculatedResults);
    roiCalculatorService.trackCalculatorUsage(inputs, calculatedResults);
    setShowResults(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Tell us about your practice</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Number of Patients</label>
          <input
            type="number"
            value={inputs.numberOfPatients}
            onChange={(e) => handleInputChange('numberOfPatients', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Sessions per Week</label>
          <input
            type="number"
            value={inputs.sessionsPerWeek}
            onChange={(e) => handleInputChange('sessionsPerWeek', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Average Session Rate</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={inputs.averageSessionRate}
              onChange={(e) => handleInputChange('averageSessionRate', parseInt(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Number of Therapists</label>
          <input
            type="number"
            value={inputs.numberOfTherapists}
            onChange={(e) => handleInputChange('numberOfTherapists', parseInt(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      <button
        onClick={() => setStep(2)}
        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Next: Time & Billing →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Current pain points</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Hours on Documentation per Week
            <span className="text-gray-500 ml-2 text-xs">(Industry avg: 20)</span>
          </label>
          <input
            type="range"
            min="0"
            max="40"
            value={inputs.hoursOnDocumentation}
            onChange={(e) => handleInputChange('hoursOnDocumentation', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>0 hours</span>
            <span className="font-bold text-blue-600">{inputs.hoursOnDocumentation} hours</span>
            <span>40 hours</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Hours on Billing per Week
            <span className="text-gray-500 ml-2 text-xs">(Industry avg: 10)</span>
          </label>
          <input
            type="range"
            min="0"
            max="20"
            value={inputs.hoursOnBilling}
            onChange={(e) => handleInputChange('hoursOnBilling', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>0 hours</span>
            <span className="font-bold text-blue-600">{inputs.hoursOnBilling} hours</span>
            <span>20 hours</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">
            Denied Claims per Month
            <span className="text-gray-500 ml-2 text-xs">(Industry avg: 15)</span>
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={inputs.deniedClaimsPerMonth}
            onChange={(e) => handleInputChange('deniedClaimsPerMonth', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-600">
            <span>0</span>
            <span className="font-bold text-red-600">{inputs.deniedClaimsPerMonth} claims</span>
            <span>50</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Average Denied Claim Value</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={inputs.averageDeniedClaimValue}
              onChange={(e) => handleInputChange('averageDeniedClaimValue', parseInt(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        <button
          onClick={() => setStep(3)}
          className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Next: Current Software →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Current software costs</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Current AAC Software Monthly Cost</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={inputs.currentAACSoftwareCost}
              onChange={(e) => handleInputChange('currentAACSoftwareCost', parseInt(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">/month</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Current Billing Software Monthly Cost</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={inputs.currentBillingSoftwareCost}
              onChange={(e) => handleInputChange('currentBillingSoftwareCost', parseInt(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">/month</span>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Staff Hourly Rate (for time calculations)</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-500">$</span>
            <input
              type="number"
              value={inputs.hourlyStaffRate}
              onChange={(e) => handleInputChange('hourlyStaffRate', parseInt(e.target.value))}
              className="w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute right-3 top-2 text-gray-500">/hour</span>
          </div>
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm">
          <span className="font-semibold">💡 Did you know?</span> The average clinic using TinkyBink saves 
          <span className="font-bold text-green-600"> $78,400</span> annually and recovers 
          <span className="font-bold text-blue-600"> 26 work weeks</span> of time.
        </p>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={() => setStep(2)}
          className="flex-1 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition"
        >
          ← Back
        </button>
        <button
          onClick={calculateROI}
          className="flex-1 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition animate-pulse"
        >
          Calculate My ROI 💰
        </button>
      </div>
    </div>
  );

  const renderResults = () => {
    if (!results) return null;
    
    return (
      <div className="space-y-8">
        {/* Hero Result */}
        <div className="text-center py-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl">
          <h2 className="text-3xl font-bold mb-2">Your Annual Savings with TinkyBink</h2>
          <div className="text-6xl font-bold text-green-600 mb-2">
            {formatCurrency(animatedValue)}
          </div>
          <p className="text-xl text-gray-600">
            ROI: <span className="font-bold text-blue-600">{results.roiPercentage.toFixed(0)}%</span> • 
            Payback: <span className="font-bold text-purple-600">{results.paybackPeriodDays} days</span>
          </p>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            icon="⏰"
            value={`${results.hoursSavedPerWeek.toFixed(0)} hrs`}
            label="Saved per Week"
            color="blue"
          />
          <MetricCard
            icon="💰"
            value={formatCurrency(results.deniedClaimsRecovered / 12)}
            label="Claims Recovered/Month"
            color="green"
          />
          <MetricCard
            icon="📈"
            value={`+${results.patientsPerTherapistIncrease}`}
            label="Patient Capacity"
            color="purple"
          />
          <MetricCard
            icon="🎯"
            value={`${results.workWeeksRecovered.toFixed(0)} weeks`}
            label="Time Recovered/Year"
            color="orange"
          />
        </div>
        
        {/* Breakdown Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b">
            <h3 className="text-lg font-semibold">Detailed Savings Breakdown</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Category</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Current Cost</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">With TinkyBink</th>
                <th className="text-right px-6 py-3 text-sm font-medium text-gray-700">Savings</th>
              </tr>
            </thead>
            <tbody>
              {results.breakdown.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{item.category}</div>
                      <div className="text-sm text-gray-500">{item.impact}</div>
                    </div>
                  </td>
                  <td className="text-right px-6 py-4 text-red-600">
                    {formatCurrency(item.currentCost)}
                  </td>
                  <td className="text-right px-6 py-4">
                    {formatCurrency(item.withTinkyBink)}
                  </td>
                  <td className="text-right px-6 py-4 font-bold text-green-600">
                    {formatCurrency(item.savings)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50">
                <td className="px-6 py-4 font-bold">Total Annual Impact</td>
                <td className="text-right px-6 py-4"></td>
                <td className="text-right px-6 py-4"></td>
                <td className="text-right px-6 py-4 text-xl font-bold text-green-600">
                  {formatCurrency(results.annualSavings)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {/* Competitor Comparison */}
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your Local Competitors Using TinkyBink</h3>
          <div className="space-y-3">
            {competitors.map((comp, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${
                comp.usingTinkyBink ? 'bg-white' : 'bg-red-50 border-2 border-red-200'
              }`}>
                <div>
                  <div className="font-medium">{comp.competitorName}</div>
                  <div className="text-sm text-gray-600">
                    {comp.usingTinkyBink ? (
                      <span className="text-green-600">✓ Using TinkyBink</span>
                    ) : (
                      <span className="text-red-600 font-bold">← This is you (missing out)</span>
                    )}
                  </div>
                </div>
                {comp.usingTinkyBink && (
                  <div className="text-right">
                    <div className="font-bold text-green-600">+{formatCurrency(comp.additionalRevenue)}/mo</div>
                    <div className="text-sm text-gray-600">{comp.timeSavedPerWeek} hrs/week saved</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        {/* 5-Year Projection */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6">
          <h3 className="text-2xl font-bold mb-2">5-Year Value</h3>
          <div className="text-4xl font-bold mb-2">{formatCurrency(results.fiveYearValue)}</div>
          <p className="opacity-90">
            That\'s enough to hire {Math.floor(results.fiveYearValue / 50000)} additional therapists 
            or expand to {Math.floor(results.fiveYearValue / 100000)} new locations!
          </p>
        </div>
        
        {/* CTA */}
        <div className="text-center space-y-4">
          <button className="px-8 py-4 bg-green-600 text-white text-xl font-bold rounded-lg hover:bg-green-700 transition transform hover:scale-105">
            Start Free Trial - See Results in 48 Hours
          </button>
          <p className="text-sm text-gray-600">No credit card required • 14-day free trial • Cancel anytime</p>
          
          <div className="flex justify-center gap-4 pt-4">
            <button className="text-blue-600 hover:underline" onClick={() => window.print()}>
              📄 Download Report
            </button>
            <button className="text-blue-600 hover:underline">
              📧 Email to Decision Maker
            </button>
            <button className="text-blue-600 hover:underline" onClick={() => {
              setShowResults(false);
              setStep(1);
            }}>
              🔄 Recalculate
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <h1 className="text-3xl font-bold mb-2">ROI Calculator</h1>
          <p className="opacity-90">
            See exactly how much time and money TinkyBink will save your practice
          </p>
        </div>
        
        {/* Progress Bar */}
        {!showResults && (
          <div className="px-6 py-4 bg-gray-50">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of 3</span>
              <span className="text-sm text-gray-600">
                {step === 1 && 'Practice Details'}
                {step === 2 && 'Current Challenges'}
                {step === 3 && 'Software Costs'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="p-6">
          {!showResults && step === 1 && renderStep1()}
          {!showResults && step === 2 && renderStep2()}
          {!showResults && step === 3 && renderStep3()}
          {showResults && renderResults()}
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: string; 
  value: string; 
  label: string; 
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
    orange: 'bg-orange-50 text-orange-600'
  };
  
  return (
    <div className={`p-4 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm opacity-80">{label}</div>
    </div>
  );
}