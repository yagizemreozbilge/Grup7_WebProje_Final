const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma');

const authenticate = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        try {
            const decoded = verifyAccessToken(token);

            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } });
            }

            req.user = {
                id: user.id,
                email: user.email,
                role: user.role
            };

            next();
        } catch (error) {
            return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' } });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'Authentication error' } });
    }
};

module.exports = { authenticate };