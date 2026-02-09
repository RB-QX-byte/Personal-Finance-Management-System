import { useState, useEffect } from 'react';
import api from '../services/api';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, unread, read

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data || []);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            await api.patch(`/notifications/${notificationId}`, { read: true });
            setNotifications(notifications.map(n =>
                n._id === notificationId ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post('/notifications/actions', { action: 'mark_all_read' });
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            await api.delete(`/notifications/${notificationId}`);
            setNotifications(notifications.filter(n => n._id !== notificationId));
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const clearAllNotifications = async () => {
        if (window.confirm('Are you sure you want to clear all notifications?')) {
            try {
                await api.post('/notifications/actions', { action: 'clear_all' });
                setNotifications([]);
            } catch (error) {
                console.error('Error clearing notifications:', error);
            }
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'budget_alert':
                return { icon: '💰', bgColor: 'bg-warning-100' };
            case 'goal_progress':
                return { icon: '🎯', bgColor: 'bg-success-100' };
            case 'transaction':
                return { icon: '💳', bgColor: 'bg-primary-100' };
            case 'system':
                return { icon: '⚙️', bgColor: 'bg-gray-100' };
            case 'reminder':
                return { icon: '⏰', bgColor: 'bg-indigo-100' };
            default:
                return { icon: '🔔', bgColor: 'bg-primary-100' };
        }
    };

    const formatTimeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
        if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
        return date.toLocaleDateString();
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter === 'unread') return !n.read;
        if (filter === 'read') return n.read;
        return true;
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="bg-gray-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading notifications...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Page Header */}
            <div className="bg-white shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
                            <p className="text-sm text-gray-600 mt-1">
                                {unreadCount > 0
                                    ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                                    : 'No new notifications'}
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                    Mark all as read
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={clearAllNotifications}
                                    className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                                >
                                    Clear all
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Filter Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setFilter('all')}
                            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            onClick={() => setFilter('unread')}
                            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${filter === 'unread'
                                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            onClick={() => setFilter('read')}
                            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${filter === 'read'
                                    ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            Read ({notifications.length - unreadCount})
                        </button>
                    </div>
                </div>

                {/* Notifications List */}
                {filteredNotifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">🔔</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {filter === 'unread' ? 'No unread notifications' :
                                    filter === 'read' ? 'No read notifications' : 'No notifications yet'}
                            </h3>
                            <p className="text-gray-600">
                                {filter === 'all'
                                    ? 'We\'ll notify you when something important happens'
                                    : 'Try changing the filter to see more'}
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredNotifications.map((notification) => {
                            const { icon, bgColor } = getNotificationIcon(notification.type);

                            return (
                                <div
                                    key={notification._id}
                                    className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md ${!notification.read ? 'border-l-4 border-l-primary-500' : ''
                                        }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center flex-shrink-0`}>
                                            <span className="text-xl">{icon}</span>
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                                                        {notification.title}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        {formatTimeAgo(notification.createdAt)}
                                                    </p>
                                                </div>

                                                {!notification.read && (
                                                    <span className="w-3 h-3 bg-primary-500 rounded-full flex-shrink-0 mt-1"></span>
                                                )}
                                            </div>

                                            <div className="flex items-center space-x-4 mt-3">
                                                {!notification.read && (
                                                    <button
                                                        onClick={() => markAsRead(notification._id)}
                                                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                                    >
                                                        Mark as read
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification._id)}
                                                    className="text-sm text-danger-600 hover:text-danger-700 font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
