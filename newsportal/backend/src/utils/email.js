const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTPEmail = async (email, firstName, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify Your Account - News Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #e11d48, #be123c); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { color: rgba(255,255,255,0.8); margin: 8px 0 0; }
          .body { padding: 40px; }
          .otp-box { background: #fef2f2; border: 2px dashed #e11d48; border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 48px; font-weight: 900; color: #e11d48; letter-spacing: 12px; margin: 0; }
          .otp-label { color: #6b7280; font-size: 14px; margin: 8px 0 0; }
          .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          .btn { display: inline-block; background: #e11d48; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
          h2 { color: #111827; margin: 0 0 12px; }
          p { color: #4b5563; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📰 News Portal</h1>
            <p>Your trusted source for breaking news</p>
          </div>
          <div class="body">
            <h2>Hello, ${firstName}! 👋</h2>
            <p>Welcome to <strong>News Portal</strong>! To complete your registration and verify your email address, please use the OTP code below:</p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-label">This code expires in <strong>10 minutes</strong></p>
            </div>
            <p>If you didn't create an account with us, you can safely ignore this email.</p>
            <p>For security, never share this OTP with anyone.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} News Portal. All rights reserved.</p>
            <p>This is an automated email, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  return transporter.sendMail(mailOptions);
};

const sendPasswordResetEmail = async (email, firstName, otp) => {
  const transporter = createTransporter();
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset Your Password - News Portal',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1d4ed8, #1e40af); padding: 40px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 800; }
          .body { padding: 40px; }
          .otp-box { background: #eff6ff; border: 2px dashed #1d4ed8; border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0; }
          .otp-code { font-size: 48px; font-weight: 900; color: #1d4ed8; letter-spacing: 12px; margin: 0; }
          .otp-label { color: #6b7280; font-size: 14px; margin: 8px 0 0; }
          .footer { background: #f9fafb; padding: 24px 40px; text-align: center; color: #9ca3af; font-size: 12px; }
          h2 { color: #111827; margin: 0 0 12px; }
          p { color: #4b5563; line-height: 1.6; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset</h1>
          </div>
          <div class="body">
            <h2>Hello, ${firstName}!</h2>
            <p>You requested to reset your password. Use this OTP to proceed:</p>
            <div class="otp-box">
              <p class="otp-code">${otp}</p>
              <p class="otp-label">Expires in <strong>10 minutes</strong></p>
            </div>
            <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} News Portal. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };
  return transporter.sendMail(mailOptions);
};

const sendApprovalEmail = async (email, firstName, type, status, reason = '') => {
  const transporter = createTransporter();
  const isApproved = status === 'approved';
  const color = isApproved ? '#16a34a' : '#dc2626';
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `${type === 'reporter' ? 'Reporter Application' : 'News Article'} ${isApproved ? 'Approved' : 'Rejected'} - News Portal`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: ${color}; padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">${isApproved ? '✅ Approved!' : '❌ Not Approved'}</h1>
        </div>
        <div style="padding: 40px;">
          <h2 style="color: #111827;">Hello, ${firstName}!</h2>
          <p style="color: #4b5563; line-height: 1.6;">
            Your ${type === 'reporter' ? 'reporter application' : 'news article'} has been <strong>${status}</strong>.
            ${reason ? `<br><br><strong>Reason:</strong> ${reason}` : ''}
          </p>
          ${isApproved ? '<p style="color: #4b5563;">You can now access your new privileges. Thank you!</p>' : '<p style="color: #4b5563;">Please review our guidelines and try again.</p>'}
        </div>
        <div style="background: #f9fafb; padding: 20px 40px; text-align: center; color: #9ca3af; font-size: 12px;">
          <p>© ${new Date().getFullYear()} News Portal</p>
        </div>
      </div>
    `,
  };
  return transporter.sendMail(mailOptions);
};

module.exports = { generateOTP, sendOTPEmail, sendPasswordResetEmail, sendApprovalEmail };
