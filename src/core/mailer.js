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


function sendMail(to, subject, text) {
  return transporter.sendMail({
    from: mailer.senderAddress,
    to,
    subject: 'Message',
    text,
    auth: {
      user: mailer.senderAddress,
      refreshToken: mailer.refreshToken,
    }
  })
}



function sendPasswordChangeEmail(code, to) {
  const url = `${FRONTEND_URL}\\changepassword?code=${code}`
  return sendMail(to, 'Password reset for your Revolver reward platform account', url)
}

function sendVerificationEmail(code, to) {
  const url = `${HOME_URL}\\verify?code=${code}`
  return sendMail(to, 'Verify your Revolver reward platform account', url)
}

module.exports = {
  sendMail,
  sendPasswordChangeEmail,
  sendVerificationEmail
}
