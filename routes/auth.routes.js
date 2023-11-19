const router = require('express').Router();
const { register, login, whoami, activate, forgotPassword, resetPassword } = require('../controllers/auth.controllers');
const { restrict } = require('../middlewares/auth.middlewares');

router.post('/register', register);
router.post('/login', login);
router.get('/whoami', restrict, whoami);

// render halaman aktivasi
router.get('/email-activation', (req, res) => {
    let { token } = req.query;
    res.render('email-activation', { token });
});

// update user.is_verified
router.post('/email-activation', activate);

// forgot password
router.post('/forgot-password', forgotPassword);

// render halaman reset password
router.get('/reset-password', (req, res) => {
    let { token } = req.query;
    res.render('reset-password', { token });
});

// reset password
router.post('/reset-password', resetPassword);

router.get('/notifications', restrict, (req, res) => {
    res.render('notifications', { user: req.user });
  });

module.exports = router;
