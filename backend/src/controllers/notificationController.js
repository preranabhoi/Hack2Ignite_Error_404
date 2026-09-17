const Notification = require('../models/Notification');

const getNotifications = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 30, 100);
    const notifications = await Notification.find({ userId: req.user._id })
      .populate('relatedGrievanceId', 'trackingId title status')
      .sort({ createdAt: -1 })
      .limit(limit);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json({ success: true, unreadCount, notifications });
  } catch (error) {
    next(error);
  }
};

const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    ).populate('relatedGrievanceId', 'trackingId title status');

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

const markAllNotificationsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );
    res.json({ success: true, markedRead: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markNotificationRead, markAllNotificationsRead };
