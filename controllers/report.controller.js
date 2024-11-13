// /controllers/report.controller.js
const Order = require('../models/order.model');

exports.getOrderReport = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const averageOrderValue = totalOrders > 0 ? totalRevenue[0].total / totalOrders : 0;

    res.json({
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};