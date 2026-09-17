import React, { useEffect, useState } from 'react';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingState from '../components/common/LoadingState';
import ErrorState from '../components/common/ErrorState';

const NotificationsPage = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll(100);
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  const destinationFor = (notification) => {
    const id = notification.relatedGrievanceId?._id;
    if (!id) return null;
    if (role === 'admin') return '/admin';
    if (role === 'officer') return `/officer/grievances/${id}`;
    return `/grievances/${id}`;
  };

  const handleOpen = async (notification) => {
    setWorkingId(notification._id);
    if (!notification.read) {
      await notificationService.markRead(notification._id).catch(() => {});
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    const destination = destinationFor(notification);
    if (destination) navigate(destination);
    setWorkingId(null);
  };

  const markAllRead = async () => {
    setWorkingId('all');
    await notificationService.markAllRead().catch(() => {});
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    setWorkingId(null);
  };

  if (loading) return <LoadingState message="Loading notifications..." />;
  if (error && notifications.length === 0) return <ErrorState message={error} onRetry={fetchNotifications} />;

  return (
    <div className="app-container main-content" style={{ maxWidth: '820px' }}>
      <div className="page-heading-row">
        <div>
          <Link to={role === 'admin' ? '/admin' : role === 'officer' ? '/officer' : '/dashboard'} className="back-link">Back to dashboard</Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '1rem' }}>
            <Bell size={23} color="var(--primary)" />
            <h1 style={{ fontSize: '1.8rem' }}>Notifications</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.35rem' }}>{unreadCount} unread notification{unreadCount === 1 ? '' : 's'}</p>
        </div>
        <button type="button" onClick={markAllRead} disabled={workingId === 'all' || unreadCount === 0} className="btn btn-secondary btn-sm">
          {workingId === 'all' ? <Loader2 size={14} /> : <Check size={14} />} Mark all as read
        </button>
      </div>

      {error && <p style={{ color: '#991b1b', marginBottom: '1rem' }}>{error}</p>}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <p className="notification-empty" style={{ padding: '2rem' }}>You are all caught up.</p>
        ) : notifications.map((notification) => (
          <button key={notification._id} type="button" onClick={() => handleOpen(notification)} className={`notification-page-item ${notification.read ? '' : 'unread'}`}>
            <div>
              <strong>{notification.title}</strong>
              <p>{notification.message}</p>
              <small>{new Date(notification.createdAt).toLocaleString()}</small>
            </div>
            {notification.relatedGrievanceId && <ExternalLink size={16} />}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationsPage;
