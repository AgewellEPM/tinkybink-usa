'use client';

import React, { useState } from 'react';
import { appointmentSchedulingService, type Appointment } from '../services/appointment-scheduling-service';

interface RecurringAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseAppointment: Partial<Appointment>;
  onSuccess: (appointments: Appointment[]) => void;
}

export default function RecurringAppointmentModal({
  isOpen,
  onClose,
  baseAppointment,
  onSuccess
}: RecurringAppointmentModalProps) {
  const [pattern, setPattern] = useState<'daily' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [frequency, setFrequency] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [endType, setEndType] = useState<'date' | 'occurrences'>('date');
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [occurrenceCount, setOccurrenceCount] = useState(12);
  const [skipHolidays, setSkipHolidays] = useState(true);
  const [autoAdjustConflicts, setAutoAdjustConflicts] = useState(false);
  const [exceptions, setExceptions] = useState<string[]>([]);
  const [newException, setNewException] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [results, setResults] = useState<{
    created: number;
    skipped: { date: Date; reason: string }[];
    failed: { date: Date; error: string }[];
  } | null>(null);

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleDayToggle = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const handleAddException = () => {
    if (newException && !exceptions.includes(newException)) {
      setExceptions([...exceptions, newException]);
      setNewException('');
    }
  };

  const handleRemoveException = (date: string) => {
    setExceptions(exceptions.filter(d => d !== date));
  };

  const handleCreate = async () => {
    if (!baseAppointment.professional_id || !baseAppointment.patient_id) {
      alert('Missing required appointment information');
      return;
    }

    setIsCreating(true);
    setResults(null);

    try {
      const recurringPattern = {
        pattern,
        frequency,
        days_of_week: pattern === 'weekly' && selectedDays.length > 0 ? selectedDays : undefined,
        end_date: endType === 'date' ? new Date(endDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        occurrence_count: endType === 'occurrences' ? occurrenceCount : undefined,
        skip_holidays: skipHolidays,
        exceptions: exceptions.map(d => new Date(d)),
        auto_adjust_conflicts: autoAdjustConflicts
      };

      const result = await appointmentSchedulingService.createRecurringAppointments(
        baseAppointment as any,
        recurringPattern
      );

      setResults({
        created: result.created.length,
        skipped: result.skipped,
        failed: result.failed
      });

      if (result.created.length > 0) {
        onSuccess(result.created);
      }
    } catch (error) {
      console.error('Failed to create recurring appointments:', error);
      alert('Failed to create recurring appointments');
    } finally {
      setIsCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            Create Recurring Appointments
          </h2>
          <p className="text-gray-600 mt-1">
            Set up a series of appointments with Medicare billing integration
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Pattern Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recurrence Pattern
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['daily', 'weekly', 'biweekly', 'monthly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setPattern(p)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    pattern === p
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency */}
          {pattern !== 'biweekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Every</span>
                <input
                  type="number"
                  min="1"
                  max="4"
                  value={frequency}
                  onChange={(e) => setFrequency(parseInt(e.target.value) || 1)}
                  className="w-16 px-3 py-2 border rounded-md"
                />
                <span className="text-gray-600">
                  {pattern === 'daily' ? 'day(s)' :
                   pattern === 'weekly' ? 'week(s)' :
                   'month(s)'}
                </span>
              </div>
            </div>
          )}

          {/* Days of Week (for weekly pattern) */}
          {pattern === 'weekly' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Days of the Week
              </label>
              <div className="flex space-x-2">
                {daysOfWeek.map((day, index) => (
                  <button
                    key={day}
                    onClick={() => handleDayToggle(index)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      selectedDays.includes(index)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Recurrence
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="date"
                  checked={endType === 'date'}
                  onChange={() => setEndType('date')}
                  className="mr-2"
                />
                <span className="text-gray-700">End by date:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={endType !== 'date'}
                  className="ml-2 px-3 py-1 border rounded-md disabled:opacity-50"
                />
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="occurrences"
                  checked={endType === 'occurrences'}
                  onChange={() => setEndType('occurrences')}
                  className="mr-2"
                />
                <span className="text-gray-700">End after:</span>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={occurrenceCount}
                  onChange={(e) => setOccurrenceCount(parseInt(e.target.value) || 1)}
                  disabled={endType !== 'occurrences'}
                  className="ml-2 w-16 px-3 py-1 border rounded-md disabled:opacity-50"
                />
                <span className="ml-2 text-gray-700">occurrences</span>
              </label>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={skipHolidays}
                onChange={(e) => setSkipHolidays(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-700">Skip holidays</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={autoAdjustConflicts}
                onChange={(e) => setAutoAdjustConflicts(e.target.checked)}
                className="mr-2"
              />
              <span className="text-gray-700">
                Automatically adjust conflicting appointments to nearest available slot
              </span>
            </label>
          </div>

          {/* Exceptions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Exception Dates (skip these dates)
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="date"
                value={newException}
                onChange={(e) => setNewException(e.target.value)}
                className="flex-1 px-3 py-2 border rounded-md"
              />
              <button
                onClick={handleAddException}
                disabled={!newException}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Add
              </button>
            </div>
            {exceptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {exceptions.map(date => (
                  <span
                    key={date}
                    className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                  >
                    {new Date(date).toLocaleDateString()}
                    <button
                      onClick={() => handleRemoveException(date)}
                      className="ml-2 text-gray-500 hover:text-gray-700"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Medicare Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Medicare Billing Note:</strong> The system will automatically check Medicare 
              session limits and insurance authorization for each appointment. Some appointments may 
              be skipped if they exceed allowed limits.
            </p>
          </div>

          {/* Results */}
          {results && (
            <div className="bg-gray-50 border rounded-md p-4">
              <h3 className="font-medium text-gray-900 mb-2">Creation Results</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-600">✓ {results.created} appointments created</p>
                {results.skipped.length > 0 && (
                  <details className="text-yellow-600">
                    <summary className="cursor-pointer">
                      ⚠ {results.skipped.length} dates skipped
                    </summary>
                    <ul className="ml-4 mt-1 space-y-1">
                      {results.skipped.map((skip, idx) => (
                        <li key={idx}>
                          {skip.date.toLocaleDateString()}: {skip.reason}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                {results.failed.length > 0 && (
                  <details className="text-red-600">
                    <summary className="cursor-pointer">
                      ✗ {results.failed.length} appointments failed
                    </summary>
                    <ul className="ml-4 mt-1 space-y-1">
                      {results.failed.map((fail, idx) => (
                        <li key={idx}>
                          {fail.date.toLocaleDateString()}: {fail.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isCreating ? 'Creating...' : 'Create Series'}
          </button>
        </div>
      </div>
    </div>
  );
}