const Lead = require('../models/Lead');
const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

// GET /api/management/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const now = new Date();
    
    // Overall Stats
    const totalCalls = await ActivityLog.countDocuments({ actionType: 'CallLog' });
    const activeLeads = await Lead.countDocuments({ 
      isDeleted: { $ne: true }, 
      status: { $nin: ['Closed', 'Rejected'] } 
    });
    const closedDeals = await Lead.countDocuments({ 
      isDeleted: { $ne: true }, 
      status: 'Closed' 
    });
    const pendingFollowUps = await Lead.countDocuments({ 
      isDeleted: { $ne: true }, 
      followUpDate: { $gte: now } 
    });

    // Lead Status breakdown
    const statusBreakdown = {
      new: await Lead.countDocuments({ isDeleted: { $ne: true }, status: 'New' }),
      contacted: await Lead.countDocuments({ isDeleted: { $ne: true }, status: 'Contacted' }),
      followUp: await Lead.countDocuments({ isDeleted: { $ne: true }, status: 'Follow Up' }),
      interested: await Lead.countDocuments({ isDeleted: { $ne: true }, status: 'Interested' }),
      closed: closedDeals,
      rejected: await Lead.countDocuments({ isDeleted: { $ne: true }, status: 'Rejected' })
    };

    return res.status(200).json({
      success: true,
      stats: {
        totalCalls,
        activeLeads,
        closedDeals,
        pendingFollowUps
      },
      statusBreakdown
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/management/productivity
const getProductivity = async (req, res, next) => {
  try {
    // 1. Fetch all users
    const users = await User.find({ isApproved: true }, 'name email picture role');
    
    // 2. Aggregate calls per user
    const callAgg = await ActivityLog.aggregate([
      { $match: { actionType: 'CallLog' } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    
    // 3. Aggregate closed deals per user
    const closeAgg = await ActivityLog.aggregate([
      { $match: { actionType: 'StatusChange', details: /to Closed/i } },
      { $group: { _id: '$userId', count: { $sum: 1 } } }
    ]);
    
    // 4. Aggregate assigned leads count per user
    const assignAgg = await Lead.aggregate([
      { $match: { isDeleted: { $ne: true }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);

    // Convert arrays to easy lookup maps
    const callsMap = {};
    callAgg.forEach(item => { callsMap[item._id.toString()] = item.count; });

    const closesMap = {};
    closeAgg.forEach(item => { closesMap[item._id.toString()] = item.count; });

    const assignsMap = {};
    assignAgg.forEach(item => { assignsMap[item._id.toString()] = item.count; });

    // 5. Combine user details with metrics
    const performance = users.map(user => {
      const userIdStr = user._id.toString();
      return {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role,
        callsCount: callsMap[userIdStr] || 0,
        closedCount: closesMap[userIdStr] || 0,
        assignedCount: assignsMap[userIdStr] || 0
      };
    });

    // Sort by Closed Deals first, then by Calls made
    performance.sort((a, b) => {
      if (b.closedCount !== a.closedCount) {
        return b.closedCount - a.closedCount;
      }
      return b.callsCount - a.callsCount;
    });

    return res.status(200).json({
      success: true,
      performance
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/management/timeline
const getGlobalTimeline = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(30)
      .populate('userId', 'name email picture role')
      .populate('leadId', 'businessName category status');

    return res.status(200).json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/management/schedule
const getFollowUpSchedule = async (req, res, next) => {
  try {
    const now = new Date();
    // Fetch future scheduled follow-ups
    const schedule = await Lead.find({
      isDeleted: { $ne: true },
      followUpDate: { $ne: null, $gte: now }
    }, 'businessName phone website address category opportunityLevel status followUpDate assignedTo owner')
    .sort({ followUpDate: 1 })
    .populate('assignedTo', 'name email picture')
    .populate('owner', 'name email picture');

    return res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
  getProductivity,
  getGlobalTimeline,
  getFollowUpSchedule
};
