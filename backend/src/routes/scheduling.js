const express = require('express');
const router = express.Router();
const schedulingController = require('../controllers/schedulingController');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/authorization');

router.post('/generate', authenticate, authorize(['admin']), schedulingController.generateSchedule);
router.get('/:scheduleId', authenticate, schedulingController.getSchedule);
router.get('/my-schedule', authenticate, schedulingController.getMySchedule);
router.get('/my-schedule/ical', authenticate, schedulingController.getMyScheduleICal);

module.exports = router;


