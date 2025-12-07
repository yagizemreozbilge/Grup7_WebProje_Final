const express = require('express');
const router = express.Router();
const { Department } = require('../models');

router.get('/', async(req, res, next) => {
    try {
        const departments = await Department.findAll({
            order: [
                ['name', 'ASC']
            ]
        });
        res.status(200).json(departments);
    } catch (error) {
        next(error);
    }
});

module.exports = router;