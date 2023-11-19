const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('../utils/nodemailer');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
    register: async (req, res, next) => {
        try {
            let { name, email, password, password_confirmation } = req.body;
            if (password != password_confirmation) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'please ensure that the password and password confirmation match!',
                    data: null
                });
            }

            let userExist = await prisma.user.findUnique({ where: { email } });
            if (userExist) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'user has already been used!',
                    data: null
                });
            }

            let encryptedPassword = await bcrypt.hash(password, 10);
            let user = await prisma.user.create({
                data: {
                    name,
                    email,
                    password: encryptedPassword,
                    notification: {
                        create: {
                          title: `Hai ${username}!`,
                          body: 'berhasil aktivasi',
                        },
                      },
                }
            });

            // kirim email
            let token = jwt.sign({ email: user.email }, JWT_SECRET_KEY);
            let url = `http://localhost:3000/api/v1/auth/email-activation?token=${token}`;

            const html = await nodemailer.getHtml('activation-email.ejs', { name, url });
            nodemailer.sendEmail(email, 'Email Activation', html);

            return res.status(201).json({
                status: true,
                message: 'Created',
                err: null,
                data: { user }
            });
        } catch (err) {
            next(err);
        }
    },

    login: async (req, res, next) => {
        try {
            let { email, password } = req.body;

            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'invalid email or password!',
                    data: null
                });
            }

            let isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad Request',
                    err: 'invalid email or password!',
                    data: null
                });
            }

            let token = jwt.sign({ id: user.id }, JWT_SECRET_KEY);

            return res.status(200).json({
                status: true,
                message: 'OK',
                err: null,
                data: { user, token }
            });
        } catch (err) {
            next(err);

        }
    },

    whoami: (req, res, next) => {
        return res.status(200).json({
            status: true,
            message: 'OK',
            err: null,
            data: { user: req.user }
        });
    },

    activate: (req, res) => {
        let { token } = req.query;

        jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
            if (err) {
                return res.status(400).json({
                    status: false,
                    message: 'Bad request',
                    err: err.message,
                    data: null
                });
            }

            let updated = await prisma.user.update({
                where: { email: decoded.email },
                data: { is_verified: true }
            });

            res.json({ status: true, message: 'OK', err: null, data: updated });
        });
    },

    forgotPassword: async (req, res, next) => {
        try {
            const { email } = req.body;

            // Check if the user exists
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.status(404).json({
                    status: false,
                    message: 'Not Found',
                    err: 'User not found',
                    data: null
                });
            }

            // Generate a reset token
            const resetToken = jwt.sign({ email: user.email }, JWT_SECRET_KEY, { expiresIn: '1h' });

            // Update user's resetToken field in the database
            await prisma.user.update({
                where: { email },
                data: { resetToken }
            });

            // Send the password reset link via email
            const resetUrl = `http://localhost:3000/api/v1/auth/reset-password?token=${resetToken}`;
            const html = await nodemailer.getHtml('reset-password.ejs', { name: user.name, resetUrl });
            nodemailer.sendEmail(email, 'Password Reset', html);

            // return res.redirect('/')
            return res.status(200).json({
                status: true,
                message: 'a password reset link has been sent to your email',
                err: null,
                data: resetUrl
            });
        } catch (err) {
            next(err);
        }
    },
    resetPassword: async (req, res, next) => {
        try {
            const { token, newPassword } = req.body;

            // Verify the reset token
            jwt.verify(token, JWT_SECRET_KEY, async (err, decoded) => {
                if (err) {
                    return res.status(400).json({
                        status: false,
                        message: 'Bad request',
                        err: err.message,
                        data: null
                    });
                }

                // Update the user's password in the database
                const encryptedPassword = await bcrypt.hash(newPassword, 10);
                await prisma.user.update({
                    where: { email: decoded.email },
                    data: { password: encryptedPassword, resetToken: null }
                });

                return res.status(200).json({
                    status: true,
                    message: 'Password reset successful',
                    err: null,
                    data: encryptedPassword
                });
            });
        } catch (err) {
            next(err);
        }
    }
};