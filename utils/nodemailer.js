// nodemailer.js

const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const ejs = require('ejs');
const {
    GOOGLE_REFRESH_TOKEN,
    GOOGLE_SENDER_EMAIL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
} = process.env;

const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });

const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: GOOGLE_SENDER_EMAIL,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
        accessToken: oauth2Client.getAccessToken()
    }
});

module.exports = {
    sendEmail: async (to, subject, html) => {
        try {
            await transport.sendMail({ to, subject, html });
        } catch (error) {
            throw error;
        }
    },

    getHtml: (fileName, data) => {
        return new Promise((resolve, reject) => {
            const path = `${__dirname}/../views/templates/${fileName}`;

            ejs.renderFile(path, data, (err, result) => {
                if (err) {
                    return reject(err);
                }
                return resolve(result);
            });
        });
    },

    sendPasswordResetEmail: async (to, resetUrl) => {
        try {
            const html = await module.exports.getHtml('reset-password.ejs', { resetUrl });
            await module.exports.sendEmail(to, 'Password Reset', html);
        } catch (error) {
            throw error;
        }
    },
};
