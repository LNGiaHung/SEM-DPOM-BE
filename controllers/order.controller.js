const Order = require('../models/order.model');
const Product = require('../models/product.model');

exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress } = req.body;

    if (!items || !shippingAddress) {
      return res.status(400).json({ message: 'Items and shipping address are required' });
    }

    let totalAmount = 0;
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.product} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
      totalAmount += product.price * item.quantity;

      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity }
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      totalAmount,
      shippingAddress
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderID, status } = req.body; // status should be either 'In-transit' or 'Cancel'
    const order = await Order.findByIdAndUpdate(orderID, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPendingOrders = async (req, res) => {
  try {
    const orders = await Order.find({ status: 'Pending' }, 'orderID orderDate total status');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
