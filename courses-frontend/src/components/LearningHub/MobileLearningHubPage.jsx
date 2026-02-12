import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaRocket,
    FaBookOpen,
    FaBrain,
    FaChartLine,
    FaGraduationCap,
    FaFire,
    FaCertificate
} from 'react-icons/fa';
import ActiveCourses from './ActiveCourses/ActiveCourses';
import AILearningPlans from './AILearningPlans/AILearningPlans';
import LearningAnalytics from './LearningAnalytics/LearningAnalytics';
import Certificates from '../Profile/tabs/Certificates';
import axios from '../../utils/axios';
import { getLearningStats as fetchLearningStats } from '../../services/activityTracker';
// logger removed for production cleanliness

// Session cache for hub stats - instant display
const HUB_STATS_CACHE_KEY = 'learning_hub_stats_v1';
const HUB_STATS_TTL = 60 * 1000; // 1 minute

const readHubStatsCache = () => {
    try {
        const raw = sessionStorage.getItem(HUB_STATS_CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || !parsed.ts) return null;
        return parsed;
    } catch (_) {
        return null;
    }
};

const writeHubStatsCache = (stats, count) => {
    try {
        sessionStorage.setItem(HUB_STATS_CACHE_KEY, JSON.stringify({
            ts: Date.now(),
            stats,
            count
        }));
    } catch (_) { }
};

// Get initial state from cache for instant display
const getInitialHubState = () => {
    const cached = readHubStatsCache();
    if (cached) {
        return {
            stats: cached.stats || null,
            count: cached.count || 0,
            hasCachedData: true
        };
    }
    return { stats: null, count: 0, hasCachedData: false };
};

const MobileLearningHubPage = () => {
    const { user: authUser, isLoggedIn } = useAuth();
    const location = useLocation();

    // Initialize from cache for instant display
    const initialHubState = getInitialHubState();
    const [learningStats, setLearningStats] = useState(initialHubState.stats);
    const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(initialHubState.count);
    const [activeTab, setActiveTab] = useState('enrolled'); // Tab state

    // Refs to prevent duplicate API calls (matching desktop optimization)
    const lastRefreshTimeRef = useRef(0);
    const isRefreshingRef = useRef(false);
    const hasCachedDataRef = useRef(initialHubState.hasCachedData);
    const REFRESH_COOLDOWN = 30000; // 30 seconds cooldown between refreshes

    // Handle hash navigation to switch to AI courses tab
    useEffect(() => {
        if (location.hash === '#ai-courses') {
            setActiveTab('ai');
        }
    }, [location.hash]);

    // Optimized refresh function with cooldown (matching desktop version)
    const refreshHubData = useCallback(async (force = false) => {
        if (!isLoggedIn) return;

        const now = Date.now();

        // Check cache freshness
        if (!force && hasCachedDataRef.current) {
            const cached = readHubStatsCache();
            if (cached && (now - cached.ts) < HUB_STATS_TTL) {
                return; // Cache is fresh
            }
        }

        // Prevent duplicate calls within cooldown period
        if (!force && (isRefreshingRef.current || (now - lastRefreshTimeRef.current < REFRESH_COOLDOWN))) {
            return;
        }

        isRefreshingRef.current = true;
        lastRefreshTimeRef.current = now;

        try {
            // Parallel fetch for better performance
            const [coursesResponse, stats] = await Promise.all([
                axios.get('/courses/enrolled/'),
                fetchLearningStats(),
            ]);

            let newCount = 0;
            let newStats = null;

            if (coursesResponse.data?.success) {
                newCount = coursesResponse.data.courses.length;
                setEnrolledCoursesCount(newCount);
            }
            if (stats) {
                newStats = stats;
                setLearningStats(stats);
            }

            // Update cache
            writeHubStatsCache(newStats, newCount);
            hasCachedDataRef.current = true;
        } catch (_) {
            // silent in production
        } finally {
            isRefreshingRef.current = false;
        }
    }, [isLoggedIn]); // Only depend on isLoggedIn - state values captured fresh each call

    useEffect(() => {
        // Background fetch - don't force if we have cache
        refreshHubData(!hasCachedDataRef.current);
    }, [refreshHubData]);

    // Lightweight realtime: listen for activity updates (matching desktop optimization)
    useEffect(() => {
        const onEnrollmentChanged = (e) => {
            // Prefer delta updates to avoid extra network call; fallback to full refresh
            const detail = e?.detail || {};
            if (typeof detail.count === 'number') {
                setEnrolledCoursesCount(Math.max(0, detail.count));
            } else if (typeof detail.delta === 'number') {
                setEnrolledCoursesCount((prev) => Math.max(0, prev + detail.delta));
            } else {
                refreshHubData(); // Cooldown will prevent excessive calls
            }
        };

        const onActivity = (e) => {
            // Optimistically update time-based stats without immediate network call
            const minutes = e?.detail?.minutes;
            if (typeof minutes === 'number' && minutes > 0) {
                let shouldRefreshForStreak = false;
                setLearningStats((prev) => {
                    if (!prev) return prev;
                    const prevWeek = Number(prev?.weekly_hours || 0);
                    const prevTodayHours = Number(prev?.today?.hours || 0);
                    const addHours = minutes / 60;

                    // If this is the first activity chunk today, schedule a stats refresh
                    if (prevTodayHours === 0) shouldRefreshForStreak = true;

                    // Update weekly breakdown marking today as active
                    const wb = Array.isArray(prev?.weekly_breakdown) ? [...prev.weekly_breakdown] : [];
                    try {
                        const todayISO = new Date().toISOString().slice(0, 10);
                        const idx = wb.findIndex((d) => {
                            const dateStr = typeof d?.date === 'string' ? d.date : (d?.date ? new Date(d.date).toISOString().slice(0, 10) : null);
                            return dateStr === todayISO;
                        });
                        if (idx >= 0) {
                            const item = wb[idx] || {};
                            const itemHours = Number(item.hours || 0) + addHours;
                            const itemMinutes = Number(item.minutes || 0) + minutes;
                            wb[idx] = { ...item, has_activity: true, hours: itemHours, minutes: itemMinutes };
                        }
                    } catch { }

                    return {
                        ...prev,
                        weekly_hours: prevWeek + addHours,
                        today: { ...(prev?.today || {}), hours: prevTodayHours + addHours },
                        weekly_breakdown: wb,
                    };
                });

                // Fetch authoritative streak data once when today transitions from 0 -> active
                if (shouldRefreshForStreak) {
                    refreshHubData();
                }
            } else {
                // For events without minutes detail, fallback to a refresh
                refreshHubData();
            }
        };

        const onStorage = (e) => {
            // If proLearning course saved markers changed, refresh
            if (e && typeof e.key === 'string' && (e.key.startsWith('proLearning_') || e.key === 'coursesSavedToHub')) {
                refreshHubData();
            }
        };

        // Only use visibilitychange (not focus) to avoid double-firing on Alt+Tab
        const onVisibility = () => {
            if (document.visibilityState === 'visible') {
                refreshHubData(); // Cooldown will prevent excessive calls
            }
        };

        window.addEventListener('enrollment-changed', onEnrollmentChanged);
        window.addEventListener('learning:activity-updated', onActivity);
        window.addEventListener('prolearning:course-saved', onActivity);
        window.addEventListener('storage', onStorage);
        document.addEventListener('visibilitychange', onVisibility);
        // Removed focus listener - visibilitychange is sufficient and prevents double-firing

        return () => {
            window.removeEventListener('enrollment-changed', onEnrollmentChanged);
            window.removeEventListener('learning:activity-updated', onActivity);
            window.removeEventListener('prolearning:course-saved', onActivity);
            window.removeEventListener('storage', onStorage);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [refreshHubData]);

    // Create enhanced user object with updated stats
    const user = {
        ...authUser,
        totalCoursesEnrolled: enrolledCoursesCount,
        hoursThisWeek: learningStats?.weekly_hours || 0,
        currentStreak: learningStats?.current_streak || 0
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 pt-0 md:pt-6">
            {/* Modern Hero Section */}
            <div className="relative overflow-hidden pt-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600">
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600"></div>
                <div className="absolute inset-0 bg-black/10"></div>

                <div className="relative px-4 py-5 pt-[3.75rem]">
                    {/* Welcome Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-white mb-4"
                    >
                        <h1 className="text-xl font-bold mb-1">
                            Welcome back, {user?.full_name || user?.first_name || user?.username || 'Student'}! 👋
                        </h1>
                        <p className="text-blue-100 text-sm">
                            Ready to continue your learning journey?
                        </p>
                    </motion.div>

                    {/* Quick Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="grid grid-cols-3 gap-2 mb-4"
                    >
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                            <div className="text-xl font-bold text-white mb-0.5">
                                {user?.totalCoursesEnrolled || 0}
                            </div>
                            <div className="text-xs text-blue-100">Enrolled</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                            <div className="text-xl font-bold text-white mb-0.5">
                                {typeof user?.hoursThisWeek === 'number' ? user.hoursThisWeek.toFixed(1) : '0'}h
                            </div>
                            <div className="text-xs text-blue-100">This Week</div>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center border border-white/20">
                            <div className="text-xl font-bold text-white mb-0.5 flex items-center justify-center">
                                {user?.currentStreak || 0} <FaFire className="text-orange-400 ml-1 text-xs" />
                            </div>
                            <div className="text-xs text-blue-100">Day Streak</div>
                        </div>
                    </motion.div>

                    {/* Quick Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 gap-2"
                    >
                        <Link
                            to="/learning-path"
                            className="bg-white text-indigo-700 font-semibold rounded-xl px-3 py-3 text-center flex items-center justify-center shadow-lg hover:shadow-xl transition-all active:scale-95 text-sm"
                        >
                            <FaRocket className="mr-1.5 text-base" />
                            <span>Try Smart Learning</span>
                        </Link>

                        <Link
                            to="/courses"
                            className="bg-indigo-500/20 backdrop-blur-sm text-white font-semibold rounded-xl px-3 py-3 text-center flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all active:scale-95 text-sm"
                        >
                            <FaBookOpen className="mr-1.5 text-base" />
                            <span>Browse Courses</span>
                        </Link>
                    </motion.div>
                </div>
            </div>

            {/* Content Area - Tabbed Interface */}
            <div className="px-4 pt-6 pb-20">
                {/* Tab Navigation */}
                <div className="bg-white rounded-xl shadow-sm mb-4 p-1">
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => setActiveTab('enrolled')}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'enrolled'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <FaGraduationCap className="mx-auto mb-1 text-base" />
                            <div className="text-xs">Enrolled</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('ai')}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'ai'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <FaBrain className="mx-auto mb-1 text-base" />
                            <div className="text-xs">Guided Paths</div>
                        </button>
                        <button
                            onClick={() => setActiveTab('stats')}
                            className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'stats'
                                ? 'bg-indigo-500 text-white shadow-md'
                                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                                }`}
                        >
                            <FaChartLine className="mx-auto mb-1 text-base" />
                            <div className="text-xs">Stats</div>
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    {activeTab === 'enrolled' && (
                        <motion.div
                            key="enrolled"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-indigo-500 p-2 rounded-lg mr-3">
                                    <FaGraduationCap className="text-white text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">My Enrolled Courses</h2>
                                    <p className="text-xs text-gray-500">Continue your learning journey</p>
                                </div>
                            </div>
                            <ActiveCourses
                                onEnrollmentChanged={(change) => {
                                    if (change && typeof change.count === 'number') {
                                        setEnrolledCoursesCount(Math.max(0, change.count));
                                    } else if (change && typeof change.delta === 'number') {
                                        setEnrolledCoursesCount((prev) => Math.max(0, prev + change.delta));
                                    } else {
                                        axios.get('/courses/enrolled/').then((res) => {
                                            if (res.data?.success) {
                                                setEnrolledCoursesCount(res.data.courses.length);
                                            }
                                        }).catch(() => { });
                                    }
                                }}
                            />
                        </motion.div>
                    )}

                    {activeTab === 'ai' && (
                        <motion.div
                            key="ai"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-purple-500 p-2 rounded-lg mr-3">
                                    <FaBrain className="text-white text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">My Learning Paths</h2>
                                    <p className="text-xs text-gray-500">Guided learning paths based on your interests</p>
                                </div>
                            </div>
                            <AILearningPlans />
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.2 }}
                        >
                            <div className="flex items-center mb-4">
                                <div className="bg-blue-500 p-2 rounded-lg mr-3">
                                    <FaChartLine className="text-white text-lg" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-gray-800">Learning Progress</h2>
                                    <p className="text-xs text-gray-500">Track your growth and achievements</p>
                                </div>
                            </div>
                            <LearningAnalytics
                                user={{
                                    ...user,
                                    weeklyBreakdown: learningStats?.weekly_breakdown ?? []
                                }}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default MobileLearningHubPage;
