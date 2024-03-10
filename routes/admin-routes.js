const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const adminControllers = require('../Controller/admin-controller');
const fileUpload = require('../middlewares/file-upload');

const router = express.Router();

// ! Signup and login

router.post(
  '/signup',
  fileUpload.single('image'),
  [
    check('name').not().isEmpty(),
    check('password').isLength({ min: 4 }),
    check('phone').isNumeric().isLength({ min: 8 }),
    check('email').normalizeEmail().isEmail(),
    check('role').not().isEmpty(),
  ],
  adminControllers.signup
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
  adminControllers.editProfile
);
router.post(
  '/login',
  [
    check('password').isLength({ min: 4 }),
    check('email').normalizeEmail().isEmail(),
  ],
  adminControllers.login
);

// ! Dashboard Topic list
router.get('/topics', adminControllers.getTopicsForDashboard);

// ! Subjects
router.get('/subjects', adminControllers.getSubjects);
router.post(
  '/subjects',
  [
    check('name').not().isEmpty(),
    check('code').not().isEmpty(),
    check('grade').not().isEmpty(),
    check('description').not().isEmpty(),
  ],
  adminControllers.addSubject
);
router.patch(
  '/subjects',
  [
    check('name').not().isEmpty(),
    check('code').not().isEmpty(),
    check('grade').not().isEmpty(),
    check('description').not().isEmpty(),
  ],
  adminControllers.editSubject
);
router.delete('/subject/:subId', adminControllers.deleteSubject);

// ! Chapters
router.get('/chapters/:subjectId', adminControllers.getChapters);
router.post(
  '/chapters',
  [check('name').not().isEmpty()],
  adminControllers.addChapter
);
router.patch(
  '/chapters',
  [check('name').not().isEmpty()],
  adminControllers.editChapter
);
router.delete('/chapter/:chapterId', adminControllers.deleteChapter);

// ! Sections

router.get('/sections/:chapterId', adminControllers.getSections);
router.post(
  '/sections',
  [check('name').not().isEmpty()],
  adminControllers.addSection
);
router.patch(
  '/sections',
  [check('name').not().isEmpty()],
  adminControllers.editSection
);
router.delete('/sections/:sectionId', adminControllers.deleteSection);

// ! Topics
router.get('/topics/:sectionId', adminControllers.getTopics);
router.delete('/topic/:topicId', adminControllers.deleteTopic);

router.get('/educator-requests', adminControllers.getEducatorRequests);
router.patch('/educator-requests', adminControllers.handleEducatorRequests);
router.get('/student-requests', adminControllers.getStudentRequests);
router.patch('/student-requests', adminControllers.handleStudentRequests);
router.get('/parent-requests', adminControllers.getParentRequests);
router.patch('/parent-requests', adminControllers.handleParentRequests);

module.exports = router;
