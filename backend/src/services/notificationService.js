const Notification = require('../models/Notification');
const User = require('../models/User');

const createNotification = async ({ userId, title, message, type, relatedGrievanceId = null }) => {
  if (!userId) return null;

  try {
    return await Notification.create({
      userId,
      title,
      message,
      type,
      relatedGrievanceId,
    });
  } catch (error) {
    console.warn('[CivicAI Notifications] Could not create notification:', error.message);
    return null;
  }
};

const createNotifications = async (notifications = []) => {
  const validNotifications = notifications.filter((notification) => notification?.userId);
  if (validNotifications.length === 0) return [];

  try {
    return await Notification.insertMany(validNotifications, { ordered: false });
  } catch (error) {
    console.warn('[CivicAI Notifications] Some notifications could not be created:', error.message);
    return [];
  }
};

const notifyAdmins = async ({ title, message, type = 'admin_alert', relatedGrievanceId }) => {
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    return createNotifications(
      admins.map((admin) => ({
        userId: admin._id,
        title,
        message,
        type,
        relatedGrievanceId,
      }))
    );
  } catch (error) {
    console.warn('[CivicAI Notifications] Could not find admins:', error.message);
    return [];
  }
};

module.exports = { createNotification, createNotifications, notifyAdmins };
