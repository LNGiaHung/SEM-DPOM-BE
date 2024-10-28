const Notification = require('../models/notification.model');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.createNotification = async (userId, title, message, type) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type
    });
  } catch (error) {
    console.error('Notification creation failed:', error);
  }
};

exports.sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html
    });
  } catch (error) {
    console.error('Email sending failed:', error);
  }
};
