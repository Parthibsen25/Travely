const express = require('express');
const router = express.Router();
const { autocomplete, advancedSearch, trending } = require('../controllers/searchController');

router.get('/autocomplete', autocomplete);
router.get('/trending', trending);
router.get('/', advancedSearch);

module.exports = router;
