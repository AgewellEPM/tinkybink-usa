'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPinIcon, 
  StarIcon, 
  CheckBadgeIcon,
  PhoneIcon,
  ClockIcon,
  CurrencyDollarIcon,
  HeartIcon,
  AdjustmentsHorizontalIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid, HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { therapistDirectoryService, TherapistProfile, SearchFilters } from '@/services/therapist-directory-service';

export default function FindTherapistPage() {
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<SearchFilters>({
    location: { center: { lat: 30.2672, lng: -97.7431 }, radius: 25 },
    insurance: [],
    specialties: [],
    telehealth: undefined
  });
  const [showFilters, setShowFilters] = useState(false);
  const [savedTherapists, setSavedTherapists] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  useEffect(() => {
    searchTherapists();
  }, [selectedFilters]);

  const searchTherapists = async () => {
    setLoading(true);
    try {
      const results = await therapistDirectoryService.searchTherapists(selectedFilters);
      setTherapists(results.therapists);
    } catch (error) {
      console.error('Error searching therapists:', error);
    }
    setLoading(false);
  };

  const toggleSaved = (therapistId: string) => {
    const newSaved = new Set(savedTherapists);
    if (newSaved.has(therapistId)) {
      newSaved.delete(therapistId);
    } else {
      newSaved.add(therapistId);
    }
    setSavedTherapists(newSaved);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="relative">
        {i < Math.floor(rating) ? (
          <StarIconSolid className="h-4 w-4 text-yellow-400" />
        ) : i < rating ? (
          <div className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <StarIconSolid 
              className="h-4 w-4 text-yellow-400 absolute inset-0"
              style={{ clipPath: `inset(0 ${100 - (rating - i) * 100}% 0 0)` }}
            />
          </div>
        ) : (
          <StarIcon className="h-4 w-4 text-gray-300" />
        )}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-8"
            >
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Find Your Perfect 
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {' '}Speech Therapist
                </span>
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Discover TinkyBink-certified therapists near you. Real reviews, verified credentials, 
                and seamless insurance matching.
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative max-w-4xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-4 bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
                {/* Location Input */}
                <div className="flex-1 relative">
                  <MapPinIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Enter your location..."
                    value={searchLocation}
                    onChange={(e) => setSearchLocation(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>

                {/* Filter Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                    showFilters || selectedFilters.insurance?.length || selectedFilters.specialties?.length
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  Filters
                  {(selectedFilters.insurance?.length || 0) + (selectedFilters.specialties?.length || 0) > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {(selectedFilters.insurance?.length || 0) + (selectedFilters.specialties?.length || 0)}
                    </span>
                  )}
                </button>

                {/* Search Button */}
                <button
                  onClick={searchTherapists}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                >
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border-b border-gray-200 shadow-sm"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {/* Insurance Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
                  <div className="space-y-2">
                    {['Aetna', 'Blue Cross Blue Shield', 'Cigna', 'United Healthcare', 'Medicare', 'Medicaid'].map((insurance) => (
                      <label key={insurance} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters.insurance?.includes(insurance) || false}
                          onChange={(e) => {
                            const newInsurance = e.target.checked
                              ? [...(selectedFilters.insurance || []), insurance]
                              : selectedFilters.insurance?.filter(i => i !== insurance) || [];
                            setSelectedFilters({ ...selectedFilters, insurance: newInsurance });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{insurance}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Specialties Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Specialties</label>
                  <div className="space-y-2">
                    {['Autism Spectrum Disorders', 'AAC', 'Apraxia', 'Language Delays', 'Stuttering', 'Voice Disorders'].map((specialty) => (
                      <label key={specialty} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFilters.specialties?.includes(specialty) || false}
                          onChange={(e) => {
                            const newSpecialties = e.target.checked
                              ? [...(selectedFilters.specialties || []), specialty]
                              : selectedFilters.specialties?.filter(s => s !== specialty) || [];
                            setSelectedFilters({ ...selectedFilters, specialties: newSpecialties });
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{specialty}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Age Groups */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Age Groups</label>
                  <div className="space-y-2">
                    {['Early Intervention (0-3)', 'Preschool (3-5)', 'School Age (6-12)', 'Adolescent (13-18)', 'Adult (18+)'].map((age) => (
                      <label key={age} className="flex items-center">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{age}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="serviceType"
                        value="all"
                        checked={!selectedFilters.telehealth}
                        onChange={() => setSelectedFilters({ ...selectedFilters, telehealth: undefined })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">All Services</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="serviceType"
                        value="in-person"
                        checked={selectedFilters.telehealth === false}
                        onChange={() => setSelectedFilters({ ...selectedFilters, telehealth: false })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">In-Person Only</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="serviceType"
                        value="telehealth"
                        checked={selectedFilters.telehealth === true}
                        onChange={() => setSelectedFilters({ ...selectedFilters, telehealth: true })}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Telehealth Available</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {therapists.length} Therapists Found
            </h2>
            <p className="text-gray-600">Showing results within 25 miles of your location</p>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'map' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Map View
            </button>
          </div>
        </div>

        {/* Therapist Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {therapists.map((therapist, index) => (
            <motion.div
              key={therapist.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {therapist.name.first} {therapist.name.last}
                      </h3>
                      {therapist.verified && (
                        <CheckBadgeIcon className="h-5 w-5 text-blue-500" />
                      )}
                      {therapist.tinkyBinkCertified && (
                        <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          TinkyBink Certified
                        </div>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm">
                      {therapist.name.credentials.join(', ')}
                    </p>
                    
                    {/* Rating */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1">
                        {renderStars(therapist.rating.overall)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {therapist.rating.overall}
                      </span>
                      <span className="text-sm text-gray-500">
                        ({therapist.rating.totalReviews} reviews)
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleSaved(therapist.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    {savedTherapists.has(therapist.id) ? (
                      <HeartIconSolid className="h-6 w-6 text-red-500" />
                    ) : (
                      <HeartIcon className="h-6 w-6 text-gray-400" />
                    )}
                  </button>
                </div>

                {/* Specialties */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {therapist.specialties.slice(0, 3).map((specialty) => (
                      <span
                        key={specialty.name}
                        className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium"
                      >
                        {specialty.name}
                      </span>
                    ))}
                    {therapist.specialties.length > 3 && (
                      <span className="text-xs text-gray-500 py-1">
                        +{therapist.specialties.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Location & Distance */}
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <MapPinIcon className="h-4 w-4" />
                    <span>{therapist.locations[0].address.city}, {therapist.locations[0].address.state}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="h-4 w-4" />
                    <span>2.3 miles away</span>
                  </div>
                </div>

                {/* Services & Insurance */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Services</h4>
                    <div className="space-y-1">
                      {therapist.telehealth.available && (
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          Telehealth Available
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        In-Person Sessions
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Insurance</h4>
                    <div className="text-xs text-gray-600">
                      {therapist.insuranceAccepted.slice(0, 2).map(insurance => insurance.name).join(', ')}
                      {therapist.insuranceAccepted.length > 2 && ` +${therapist.insuranceAccepted.length - 2} more`}
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">${therapist.rates.evaluation}</div>
                      <div className="text-xs text-gray-500">Evaluation</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">${therapist.rates.therapy}</div>
                      <div className="text-xs text-gray-500">Session</div>
                    </div>
                  </div>
                  
                  {therapist.tinkyBinkUsage.successStories > 0 && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-purple-600">{therapist.tinkyBinkUsage.successStories}</div>
                      <div className="text-xs text-gray-500">Success Stories</div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg">
                    Request Appointment
                  </button>
                  <button className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    <PhoneIcon className="h-5 w-5" />
                  </button>
                  <button className="px-4 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        {therapists.length > 0 && (
          <div className="text-center mt-8">
            <button className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              Load More Therapists
            </button>
          </div>
        )}
      </div>
    </div>
  );
}