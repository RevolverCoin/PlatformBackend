const nodemailer = require('nodemailer')

const {
  mailer,
  HOME_URL,
  FRONTEND_URL
} = require('../config')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    type: 'OAuth2',
    clientId: mailer.clientId,
    clientSecret: mailer.clientSecret
  }
});


function sendMail({to, subject, text, html}) {
  return transporter.sendMail({
    from: mailer.senderAddress,
    to,
    subject,
    text,
    html,
    auth: {
      user: mailer.senderAddress,
      refreshToken: mailer.refreshToken,
    }
  })
}



function sendPasswordChangeEmail(code, to) {
  const url = `${FRONTEND_URL}/changepassword?code=${encodeURIComponent(code)}`
  const html = `
    <p>Hello,</p>
    <p>Someone has requested to reset password on your Revolver reward platform account.</p>
    <p>To set new password, please click <a href=${url}>here</a> or copy-paste the following url:</p>
    <p>${url}</p>
    <p>If you didn't ask us for help with your password, let us know right away.
    Reporting it is important because it helps us prevent fraudsters from stealing your information.</p>
  `
  return sendMail({to, subject:'Password reset for your Revolver reward platform account', html})
}

function sendVerificationEmail(code, to) {
  const url = `${FRONTEND_URL}/verifyemail?code=${encodeURIComponent(code)}`
  const html = `
    <p>Hello,</p>
    <p>Please click <a href=${url}>here</a> or copy-paste the following url:</p>
    <p>${url}</p>
    <p>to your browser in order to activate your account.</p>
  `
  return sendMail({to, subject:'Verify your Revolver reward platform account', html})
}

module.exports = {
  sendMail,
  sendPasswordChangeEmail,
  sendVerificationEmail
}
