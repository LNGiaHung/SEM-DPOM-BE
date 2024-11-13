// /controllers/user.controller.js
const User = require('../models/user.model');

exports.getStaffUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'staff' }, 'userID firstName lastName mail phoneNumber gender');
    const formattedUsers = users.map(user => ({
      userID: user._id,
      name: `${user.firstName} ${user.lastName}`,
      mail: user.mail,
      phoneNumber: user.phoneNumber,
      gender: user.gender
    }));
    res.json(formattedUsers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, role, password, firstname, lastname, mail, gender, address, phonenumber } = req.body;

    if (!username || !role || !password || !firstname || !lastname || !mail) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newUser = new User({ username, role, password, firstname, lastname, mail, gender, address, phonenumber });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};