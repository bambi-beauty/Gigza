// screens/NotificationsScreen.jsx

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Calendar, 
  DollarSign, 
  Bell, 
  Check, 
  Loader2, 
  AlertCircle,
  X,
  Trash2,
  Clock,
  Star,
  MessageCircle,
  CreditCard,
  UserPlus,
  Award,
  LogOut
} from "lucide-react";
import { useUser } from "../../frontend/src/UserContext/ThisUserContext.js";
import { useNavigate } from "react-router-dom";

// ============================================
// HELPER FUNCTIONS
// ============================================

// Map notification types to icons
const getNotificationIcon = (type) => {
  const typeMap = {
    'booking_created': Calendar,
    'booking_confirmed': Calendar,
    'booking_cancelled': Calendar,
    'booking_rescheduled': Calendar,
    'booking_status_updated': Calendar,
    'booking_completed': Calendar,
    'payment_received': DollarSign,
    'payment_failed': CreditCard,
    'payment_refunded': CreditCard,
    'dj_application_submitted': UserPlus,
    'dj_application_approved': Award,
    'dj_application_rejected': X,
    'new_message': MessageCircle,
    'new_review': Star,
    'review_request': Star,
    'system_alert': AlertCircle,
    'reminder': Clock,
    'promotional': Bell,
    'default': Bell
  };
  
  return typeMap[type] || typeMap.default;
};

// Map notification types to icon colors
const getIconColor = (type) => {
  const colorMap = {
    'booking_created': 'bg-purple-500/20 text-purple-400',
    'booking_confirmed': 'bg-emerald-500/20 text-emerald-400',
    'booking_cancelled': 'bg-red-500/20 text-red-400',
    'booking_rescheduled': 'bg-orange-500/20 text-orange-400',
    'booking_status_updated': 'bg-blue-500/20 text-blue-400',
    'booking_completed': 'bg-emerald-500/20 text-emerald-400',
    'payment_received': 'bg-green-500/20 text-green-400',
    'payment_failed': 'bg-red-500/20 text-red-400',
    'payment_refunded': 'bg-yellow-500/20 text-yellow-400',
    'dj_application_submitted': 'bg-cyan-500/20 text-cyan-400',
    'dj_application_approved': 'bg-emerald-500/20 text-emerald-400',
    'dj_application_rejected': 'bg-red-500/20 text-red-400',
    'new_message': 'bg-indigo-500/20 text-indigo-400',
    'new_review': 'bg-yellow-500/20 text-yellow-400',
    'review_request': 'bg-yellow-500/20 text-yellow-400',
    'system_alert': 'bg-red-500/20 text-red-400',
    'reminder': 'bg-blue-500/20 text-blue-400',
    'promotional': 'bg-pink-500/20 text-pink-400',
    'default': 'bg-zinc-500/20 text-zinc-400'
  };
  
  return colorMap[type] || colorMap.default;
};

// Get priority color
const getPriorityColor = (priority) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'text-red-400 bg-red-500/10';
    case 'medium': return 'text-yellow-400 bg-yellow-500/10';
    case 'low': return 'text-green-400 bg-green-500/10';
    default: return 'text-zinc-400 bg-zinc-500/10';
  }
};

// Format time to human-readable
const formatTime = (dateString) => {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
};

// Get readable notification type
const getReadableType = (type) => {
  const typeMap = {
    'booking_created': 'New Booking',
    'booking_confirmed': 'Booking Confirmed',
    'booking_cancelled': 'Booking Cancelled',
    'booking_rescheduled': 'Booking Rescheduled',
    'booking_status_updated': 'Booking Updated',
    'booking_completed': 'Booking Completed',
    'payment_received': 'Payment Received',
    'payment_failed': 'Payment Failed',
    'payment_refunded': 'Payment Refunded',
    'dj_application_submitted': 'Application Submitted',
    'dj_application_approved': 'Application Approved',
    'dj_application_rejected': 'Application Rejected',
    'new_message': 'New Message',
    'new_review': 'New Review',
    'review_request': 'Review Request',
    'system_alert': 'System Alert',
    'reminder': 'Reminder',
    'promotional': 'Promotion'
  };
  
  return typeMap[type] || type;
};

// ============================================
// MAIN COMPONENT
// ============================================

export function NotificationsScreen() {
  const { getToken, logout } = useUser();
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);
  const [markingSingle, setMarkingSingle] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const BASE_API = 'https://gigza-testing-11.onrender.com';
  const LIMIT = 20;
  const observerRef = useRef();

  // ============================================
  // TOKEN VALIDATION HELPER
  // ============================================
  const validateAndGetToken = useCallback(async () => {
    const token = getToken();
    
    console.log('🔑 Token present:', !!token);
    if (token) {
      console.log('📝 Token preview:', token.substring(0, 30) + '...');
    }
    
    if (!token) {
      console.warn('⚠️ No token found in localStorage');
      return null;
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000;
      const now = Date.now();
      
      console.log('⏰ Token expires:', new Date(exp));
      console.log('⏰ Current time:', new Date(now));
      
      if (now >= exp) {
        console.warn('⚠️ Token expired at:', new Date(exp));
        return null;
      }
      
      return token;
    } catch (error) {
      console.error('❌ Error validating token:', error);
      return null;
    }
  }, [getToken]);

  // ============================================
  // FETCH NOTIFICATIONS
  // ============================================
  const fetchNotifications = useCallback(async (reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }
      
      setError(null);
      
      const token = await validateAndGetToken();
      
      if (!token) {
        setError("Your session has expired. Please login again.");
        setLoading(false);
        return;
      }

      const currentPage = reset ? 0 : page;
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: currentPage * LIMIT
      });

      if (filter === 'unread') {
        params.append('unread_only', 'true');
      }
      if (typeFilter !== 'all') {
        params.append('type', typeFilter);
      }

      console.log('📡 Fetching notifications with params:', params.toString());

      const response = await fetch(`${BASE_API}/api/notifications?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Response status:', response.status);

      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Token may be invalid or expired');
        setError("Your session has expired. Please login again.");
        setLoading(false);
        logout();
        return;
      }

      if (response.status === 403) {
        console.warn('⚠️ 403 Forbidden - You don\'t have permission');
        setError("You don't have permission to view notifications.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Failed to fetch notifications (Status: ${response.status})`);
      }

      const newNotifications = data.notifications || [];
      console.log(`✅ Received ${newNotifications.length} notifications`);
      
      if (reset) {
        setNotifications(newNotifications);
        setUnreadCount(data.unreadCount || 0);
        setHasMore(newNotifications.length === LIMIT);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
        setHasMore(newNotifications.length === LIMIT);
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      setError(error.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setIsRetrying(false);
    }
  }, [validateAndGetToken, page, filter, typeFilter, logout]);

  // ============================================
  // FETCH UNREAD COUNT
  // ============================================
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = await validateAndGetToken();
      if (!token) return;

      const response = await fetch(`${BASE_API}/api/notifications/unread-count`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.warn('⚠️ 401 Unauthorized - Token may be invalid');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [validateAndGetToken]);

  // ============================================
  // MARK SINGLE AS READ
  // ============================================
  const markAsRead = async (notificationId) => {
    try {
      setMarkingSingle(notificationId);
      
      const token = await validateAndGetToken();
      if (!token) {
        setError("Please login to mark notifications");
        return;
      }

      const response = await fetch(`${BASE_API}/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, read: true, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        throw new Error(data.message || 'Failed to mark as read');
      }
    } catch (error) {
      console.error('Error marking as read:', error);
      setError(error.message);
    } finally {
      setMarkingSingle(null);
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================
  const markAllAsRead = async () => {
    try {
      setMarkingAll(true);
      
      const token = await validateAndGetToken();
      if (!token) {
        setError("Please login to mark notifications");
        return;
      }

      const response = await fetch(`${BASE_API}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
        );
        setUnreadCount(0);
      } else {
        throw new Error(data.message || 'Failed to mark all as read');
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError(error.message);
    } finally {
      setMarkingAll(false);
    }
  };

  // ============================================
  // DELETE NOTIFICATION
  // ============================================
  const deleteNotification = async (notificationId) => {
    try {
      setDeleting(notificationId);
      
      const token = await validateAndGetToken();
      if (!token) {
        setError("Please login to delete notifications");
        return;
      }

      const notification = notifications.find(n => n.id === notificationId);
      
      const response = await fetch(`${BASE_API}/api/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError("Your session has expired. Please login again.");
        return;
      }

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (notification && !notification.read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError(error.message);
    } finally {
      setDeleting(null);
    }
  };

  // ============================================
  // HANDLE NOTIFICATION CLICK
  // ============================================
  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  // ============================================
  // HANDLE RETRY
  // ============================================
  const handleRetry = () => {
    setIsRetrying(true);
    setError(null);
    fetchNotifications(true);
  };

  // ============================================
  // HANDLE LOGIN REDIRECT
  // ============================================
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  // ============================================
  // INFINITE SCROLL OBSERVER
  // ============================================
  useEffect(() => {
    if (loading || loadingMore || !hasMore || error) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchNotifications(false);
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, fetchNotifications, error]);

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    fetchNotifications(true);
  }, [filter, typeFilter, fetchNotifications]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // ============================================
  // GET UNIQUE TYPES FOR FILTER
  // ============================================
  const getUniqueTypes = () => {
    const types = notifications.map(n => n.type);
    return [...new Set(types)];
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-zinc-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE WITH LOGIN OPTION
  // ============================================
  if (error && !notifications.length) {
    const isAuthError = error.includes('session') || error.includes('login');
    
    return (
      <div className="min-h-screen bg-black pb-4">
        <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          <p className="text-sm text-zinc-400">Stay updated with your bookings</p>
        </div>
        <div className="px-6 mt-20 text-center">
          <div className={`rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 ${
            isAuthError ? 'bg-yellow-500/10' : 'bg-red-500/10'
          }`}>
            {isAuthError ? (
              <LogOut className="w-10 h-10 text-yellow-400" />
            ) : (
              <AlertCircle className="w-10 h-10 text-red-400" />
            )}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {isAuthError ? 'Session Expired' : 'Oops! Something went wrong'}
          </h3>
          <p className="text-sm text-zinc-500">{error}</p>
          <div className="flex items-center justify-center gap-3 mt-4">
            {isAuthError ? (
              <button 
                onClick={handleLoginRedirect}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Login Again
              </button>
            ) : (
              <button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {isRetrying ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Retry'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-black pb-4">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/30 to-black px-6 pt-6 pb-4 sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-zinc-400">Stay updated with your bookings</p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-purple-500 text-white text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
              {unreadCount} new
            </div>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'unread'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'read'
                ? 'bg-purple-600 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            Read
          </button>
          
          {/* Type filter dropdown */}
          {getUniqueTypes().length > 0 && (
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-400 border border-zinc-700 focus:outline-none focus:border-purple-500"
            >
              <option value="all">All Types</option>
              {getUniqueTypes().map(type => (
                <option key={type} value={type}>
                  {getReadableType(type)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {markingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {markingAll ? 'Marking...' : 'Mark all as read'}
              </button>
            )}
          </div>
          <span className="text-xs text-zinc-600">
            {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-6 mt-2 space-y-3">
        {notifications.length > 0 ? (
          <>
            {notifications.map((notification, index) => {
              const Icon = getNotificationIcon(notification.type);
              const isUnread = !notification.read;
              const isMarking = markingSingle === notification.id;
              const isDeleting = deleting === notification.id;
              
              return (
                <div
                  key={notification.id}
                  ref={index === notifications.length - 1 ? observerRef : null}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-zinc-900 border rounded-2xl p-4 transition-all cursor-pointer ${
                    isUnread
                      ? "border-purple-500/50 bg-purple-500/5 hover:border-purple-500/70"
                      : "border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getIconColor(
                        notification.type
                      )}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-white truncate">
                              {notification.title}
                            </h3>
                            {isUnread && (
                              <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <span className="text-xs text-zinc-500">
                            {getReadableType(notification.type)}
                          </span>
                        </div>
                      </div>

                      {/* Message */}
                      <p className="text-sm text-zinc-400 mt-1">
                        {notification.message}
                      </p>

                      {/* Footer */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-zinc-600">
                            {formatTime(notification.created_at)}
                          </p>
                          {notification.priority === 'high' && (
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                              Urgent
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {isUnread && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              disabled={isMarking || isDeleting}
                              className="p-1.5 rounded-lg text-zinc-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors disabled:opacity-50"
                              title="Mark as read"
                            >
                              {isMarking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            disabled={isDeleting || isMarking}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading more indicator */}
            {loadingMore && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
              </div>
            )}

            {/* End of list */}
            {!hasMore && notifications.length > 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-zinc-600">You're all caught up! 🎉</p>
              </div>
            )}
          </>
        ) : (
          // Empty State
          <div className="px-6 mt-20 text-center">
            <div className="bg-zinc-900 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-zinc-700" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
            </h3>
            <p className="text-sm text-zinc-500">
              {filter === 'unread' 
                ? "You've read all your notifications. Great job! 👏"
                : "We'll notify you when something important happens"}
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300"
              >
                View all notifications
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}