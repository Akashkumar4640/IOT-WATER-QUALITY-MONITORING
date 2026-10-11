const express = require('express');
const router = express.Router();
const SampleController = require('../controllers/sampleController');

router.get('/', SampleController.getAll);
router.get('/locations/compare', SampleController.compareLocations);
router.get('/:id', SampleController.getById);
router.post('/', SampleController.create);
router.delete('/:id', SampleController.delete);

module.exports = router;
