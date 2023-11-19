const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = process.env;

module.exports = {
    restrict: async (req, res, next) => {
        try {
            let { authorization } = req.headers;
            if (!authorization) {
                return res.status(401).json({
                    status: false,
                    message: 'Unauthorized',
                    err: 'Missing token in the header!',
                    data: null
                });
            }

            const decoded = jwt.verify(authorization, JWT_SECRET_KEY);
            req.user = await prisma.user.findUnique({ where: { id: decoded.id, select: {
                id: true,
                username: true,
                email: true,
                password: true,
                notification: true,
              }, } });

            if (!req.user.is_verified) {
                return res.status(401).json({
                    status: false,
                    message: 'Unauthorized',
                    err: 'You need to verify your email to continue',
                    data: null
                });
            }

            next();
        } catch (err) {
            return res.status(401).json({
                status: false,
                message: 'Unauthorized',
                err: err.message,
                data: null
            });
        }
    }
};
