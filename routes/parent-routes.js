const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const parentControllers = require('../Controller/parent-controller');
const fileUpload = require('../middlewares/file-upload');

const router = express.Router();

// ! Acc request status
router.get('/acc-status/:parentId', parentControllers.getAccReqStatus);

// ! Signup and login
router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty().withMessage('invalid name!'),
    check('password').isLength({ min: 4 }).withMessage('invalid password!'),
    check('phone')
      .isNumeric()
      .isLength({ min: 8 })
      .withMessage('invalid phone!'),
    check('email').normalizeEmail().isEmail().withMessage('invalid email!'),
    check('studentId').not().isEmpty().withMessage('invalid student Id!'),
    check('role').not().isEmpty().withMessage('invalid role!'),
  ],
  parentControllers.signup
);
router.patch(
  '/edit-profile',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty().withMessage('invalid name!'),
    check('password').isLength({ min: 4 }).withMessage('invalid password!'),
    check('phone')
      .isNumeric()
      .isLength({ min: 8 })
      .withMessage('invalid phone!'),
    check('email').normalizeEmail().isEmail().withMessage('invalid email!'),
  ],
  parentControllers.editProfile
);
router.post(
  '/login',
  [
    check('password').isLength({ min: 4 }),
    check('email').normalizeEmail().isEmail(),
  ],
  parentControllers.login
);

// ! Student details
router.get('/student-details/:studentId', parentControllers.getStudentDetails);

// ! Student Progress
router.get(
  '/student-progress/:studentId',
  parentControllers.getStudentProgress
);

// ! Quiz Records
router.get('/quiz-records/subjects/:studentId', parentControllers.getSubjects);

// ! Contacts
router.get('/get-contacts/:studentId', parentControllers.getContacts);

module.exports = router;
