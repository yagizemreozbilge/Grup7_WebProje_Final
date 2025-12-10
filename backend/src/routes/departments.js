const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async(req, res, next) => {
    try {
        const departments = await prisma.department.findMany({
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: departments });
    } catch (error) {
        next(error);
    }
});

module.exports = router;