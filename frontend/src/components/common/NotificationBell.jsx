import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const destinationFor = (notification, role) => {
  const grievanceId = notification.relatedGrievanceId?._id;
  if (!grievanceId) return '/notifications';
  if (role === 'admin') return '/admin';
  if (role === 'officer') return `/officer/grievances/${grievanceId}`;
  return `/grievances/${grievanceId}`;
};

const NotificationBell = () => {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getAll(8);
      if (response.success) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    } catch (error) {
      // Notifications are supplementary and should not disrupt the current page.
    }
  };

  useEffect(() => {
    fetchNotifications();
    const intervalId = window.setInterval(fetchNotifications, 30000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const openNotification = async (notification) => {
    if (!notification.read) {
      await notificationService.markRead(notification._id).catch(() => {});
      setNotifications((current) => current.map((item) => item._id === notification._id ? { ...item, read: true } : item));
      setUnreadCount((count) => Math.max(0, count - 1));
    }
    setIsOpen(false);
    navigate(destinationFor(notification, role));
  };

  const markAllRead = async () => {
    setLoading(true);
    await notificationService.markAllRead().catch(() => {});
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    setUnreadCount(0);
    setLoading(false);
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="btn btn-secondary btn-sm notification-bell"
        aria-label="Notifications"
        title="Notifications"
        style={{ position: 'relative', padding: '0.45rem' }}
      >
        <Bell size={17} />
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <strong>Notifications</strong>
            <button type="button" onClick={markAllRead} disabled={loading || unreadCount === 0} className="notification-action">
              {loading ? <Loader2 size={13} /> : <Check size={13} />} Mark all read
            </button>
          </div>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="notification-empty">You are all caught up.</p>
            ) : notifications.map((notification) => (
              <button key={notification._id} type="button" onClick={() => openNotification(notification)} className={`notification-item ${notification.read ? '' : 'unread'}`}>
                <span className="notification-item-title">{notification.title}</span>
                <span className="notification-item-message">{notification.message}</span>
                <span className="notification-item-date">{new Date(notification.createdAt).toLocaleString()}</span>
              </button>
            ))}
          </div>
          <Link to="/notifications" onClick={() => setIsOpen(false)} className="notification-view-all">
            View all notifications <ExternalLink size={13} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
