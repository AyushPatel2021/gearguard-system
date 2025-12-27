import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const resetUrl = `${process.env.APP_URL || "http://localhost:5000"}/reset-password/${token}`;

  const mailOptions = {
    from: process.env.SMTP_FROM || "noreply@gearguard.com",
    to: email,
    subject: "GearGuard - Password Reset Request",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">🔧 GearGuard</h1>
        </div>
        <div style="padding: 30px; background: #f8fafc;">
          <h2 style="color: #1e293b; margin-top: 0;">Password Reset Request</h2>
          <p style="color: #475569; line-height: 1.6;">
            We received a request to reset your password. Click the button below to create a new password.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="display: inline-block; background: #3b82f6; color: white; 
                      padding: 14px 32px; text-decoration: none; border-radius: 8px;
                      font-weight: 600; font-size: 16px;">
              Reset Password
            </a>
          </div>
          <p style="color: #64748b; font-size: 14px; line-height: 1.6;">
            This link will expire in <strong>1 hour</strong>. If you didn't request this, 
            you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">
            © 2025 GearGuard Systems Inc.
          </p>
        </div>
      </div>
    `,
    text: `
GearGuard - Password Reset Request

We received a request to reset your password. 
Click the link below to create a new password:

${resetUrl}

This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.

© 2025 GearGuard Systems Inc.
    `,
  };

  await transporter.sendMail(mailOptions);
}
