'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChatBubbleLeftRightIcon,
  FireIcon,
  ClockIcon,
  TrophyIcon,
  BoltIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  HeartIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ShareIcon,
  BookmarkIcon,
  UserCircleIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  BeakerIcon,
  LightBulbIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid, 
  BookmarkIcon as BookmarkIconSolid,
  FireIcon as FireIconSolid 
} from '@heroicons/react/24/solid';
import { speechCommunityService, CommunityPost, TrendingTopic } from '@/services/speech-community-service';

export default function CommunityPage() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [trendingTopics, setTrendingTopics] = useState<TrendingTopic[]>([]);
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'top' | 'trending'>('hot');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [loading, setLoading] = useState(true);

  const categories = [
    { id: 'all', name: 'All Posts', icon: '🔥', color: 'from-orange-400 to-red-500' },
    { id: 'latest_research', name: 'Latest Research', icon: '🔬', color: 'from-blue-400 to-indigo-500' },
    { id: 'technology_trends', name: 'Tech & Apps', icon: '📱', color: 'from-green-400 to-emerald-500' },
    { id: 'success_stories', name: 'Success Stories', icon: '🎉', color: 'from-yellow-400 to-orange-500' },
    { id: 'expert_ama', name: 'Expert AMAs', icon: '🎓', color: 'from-purple-400 to-violet-500' },
    { id: 'professional_development', name: 'Professional', icon: '💼', color: 'from-gray-400 to-slate-500' }
  ];

  useEffect(() => {
    loadCommunityData();
  }, [activeTab, selectedCategory]);

  const loadCommunityData = async () => {
    setLoading(true);
    try {
      const feed = await speechCommunityService.getFeed('current_user', {
        categories: selectedCategory === 'all' ? undefined : [selectedCategory],
        sortBy: activeTab === 'trending' ? 'hot' : activeTab
      });
      setPosts(feed.posts);
      setTrendingTopics(feed.trending);
    } catch (error) {
      console.error('Error loading community data:', error);
    }
    setLoading(false);
  };

  const renderUserBadge = (userType: string, verified: boolean, credentials?: string[]) => {
    const badges = [];
    
    if (verified) {
      badges.push(
        <CheckBadgeIcon key="verified" className="h-4 w-4 text-blue-500" />
      );
    }
    
    if (userType === 'therapist') {
      badges.push(
        <div key="therapist" className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full font-medium">
          SLP
        </div>
      );
    } else if (userType === 'researcher') {
      badges.push(
        <div key="researcher" className="bg-purple-100 text-purple-800 text-xs px-2 py-0.5 rounded-full font-medium">
          PhD
        </div>
      );
    }
    
    return <div className="flex items-center gap-1">{badges}</div>;
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return 'just now';
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (hours < 48) return 'yesterday';
    return `${Math.floor(hours / 24)}d ago`;
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
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  Speech Therapy
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {' '}Community
                  </span>
                </h1>
                <p className="text-xl text-gray-600 mt-2">
                  Connect, learn, and share with therapists, families, and researchers worldwide
                </p>
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg flex items-center gap-2"
              >
                <PlusIcon className="h-5 w-5" />
                Create Post
              </motion.button>
            </motion.div>

            {/* Category Pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-3 mt-6 overflow-x-auto pb-2"
            >
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap ${
                    selectedCategory === category.id
                      ? `bg-gradient-to-r ${category.color} text-white shadow-lg`
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{category.icon}</span>
                  {category.name}
                </button>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Sort Tabs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6">
              <div className="flex items-center justify-between p-4">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  {[
                    { id: 'hot', icon: FireIcon, label: 'Hot' },
                    { id: 'new', icon: ClockIcon, label: 'New' },
                    { id: 'top', icon: TrophyIcon, label: 'Top' },
                    { id: 'trending', icon: BoltIcon, label: 'Trending' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <MagnifyingGlassIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <AdjustmentsHorizontalIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-6">
              <AnimatePresence>
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-6">
                      {/* Post Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <UserCircleIcon className="h-10 w-10 text-gray-400" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900">{post.author.username}</span>
                              {renderUserBadge(post.author.userType, post.author.verified, post.author.credentials)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <span>in {post.category.name}</span>
                              <span>•</span>
                              <span>{formatTimeAgo(post.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {post.ceuEligible && (
                            <div className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              CEU Eligible
                            </div>
                          )}
                          {post.evidenceLevel && (
                            <div className={`text-xs px-2 py-1 rounded-full font-medium ${
                              post.evidenceLevel === 'research' ? 'bg-blue-100 text-blue-800' :
                              post.evidenceLevel === 'clinical' ? 'bg-purple-100 text-purple-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {post.evidenceLevel}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Post Content */}
                      <div className="mb-4">
                        <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer transition-colors">
                          {post.title}
                        </h2>
                        <p className="text-gray-700 leading-relaxed">
                          {post.content.substring(0, 300)}
                          {post.content.length > 300 && (
                            <span className="text-blue-600 hover:text-blue-700 cursor-pointer font-medium">
                              ... Read more
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Tags */}
                      {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 4).map((tag) => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-700 text-xs px-3 py-1 rounded-full hover:bg-gray-200 cursor-pointer transition-colors"
                            >
                              #{tag}
                            </span>
                          ))}
                          {post.tags.length > 4 && (
                            <span className="text-gray-500 text-xs py-1">+{post.tags.length - 4} more</span>
                          )}
                        </div>
                      )}

                      {/* Post Stats & Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-6">
                          {/* Voting */}
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors">
                              <ChevronUpIcon className="h-5 w-5" />
                              <span className="font-medium">{post.upvotes}</span>
                            </button>
                            <button className="text-gray-400 hover:text-red-500 transition-colors">
                              <ChevronDownIcon className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Comments */}
                          <button className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors">
                            <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            <span className="font-medium">{post.comments.length}</span>
                            <span className="hidden sm:inline">comments</span>
                          </button>

                          {/* Views */}
                          <div className="flex items-center gap-2 text-gray-500 text-sm">
                            <span>{post.views.toLocaleString()} views</span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <button className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 transition-colors">
                            <HeartIcon className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-500 rounded-lg hover:bg-gray-100 transition-colors">
                            <BookmarkIcon className="h-5 w-5" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-500 rounded-lg hover:bg-gray-100 transition-colors">
                            <ShareIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Load More */}
            <div className="text-center mt-8">
              <button className="bg-white border border-gray-200 text-gray-700 px-8 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
                Load More Posts
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trending Topics */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <FireIconSolid className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900">Trending Now</h3>
              </div>
              
              <div className="space-y-3">
                {trendingTopics.slice(0, 5).map((topic, index) => (
                  <div key={topic.keyword} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 hover:text-blue-600 cursor-pointer">
                        #{topic.keyword}
                      </div>
                      <div className="text-sm text-gray-500">{topic.mentions} mentions</div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600">
                      <span className="text-sm font-medium">+{topic.growth}%</span>
                      <BoltIcon className="h-4 w-4" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Community Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg text-white p-6"
            >
              <h3 className="text-lg font-bold mb-4">Community Impact</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="opacity-90">Active Members</span>
                  <span className="font-bold">12,847</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-90">Posts This Week</span>
                  <span className="font-bold">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-90">Success Stories</span>
                  <span className="font-bold">5,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="opacity-90">Research Papers</span>
                  <span className="font-bold">892</span>
                </div>
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                {[
                  { icon: BeakerIcon, label: 'Latest Research', color: 'text-blue-500' },
                  { icon: AcademicCapIcon, label: 'Upcoming Events', color: 'text-purple-500' },
                  { icon: LightBulbIcon, label: 'Best Practices', color: 'text-yellow-500' },
                  { icon: UsersIcon, label: 'Find Therapists', color: 'text-green-500' }
                ].map((link) => (
                  <button
                    key={link.label}
                    className="flex items-center gap-3 text-gray-700 hover:text-gray-900 hover:bg-gray-50 w-full p-2 rounded-lg transition-colors"
                  >
                    <link.icon className={`h-5 w-5 ${link.color}`} />
                    <span className="font-medium">{link.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}