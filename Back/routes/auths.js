const express = require('express')
const router = express.Router()
const { verifySignUp } = require('../middlewares/auth')

const controller = require('../controllers/auths')

router.post('/signup', [verifySignUp.checkDuplicateEmail], controller.signup)

module.exports = router