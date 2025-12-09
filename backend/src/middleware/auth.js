const { verifyAccessToken } = require('../utils/jwt');
const prisma = require('../prisma');

const authenticate = async(req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        console.log('Auth Header:', authHeader); // DEBUG

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No token or invalid format'); // DEBUG
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        console.log('Token:', token); // DEBUG

        try {
            const decoded = verifyAccessToken(token);
            console.log('Decoded:', decoded); // DEBUG

            const user = await prisma.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                console.log('User not found in DB'); // DEBUG
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