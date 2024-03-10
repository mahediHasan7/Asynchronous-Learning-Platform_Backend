const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const studentControllers = require('../Controller/student-controller');
const fileUpload = require('../middlewares/file-upload');

const router = express.Router();

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
    check('grade').not().isEmpty().withMessage('invalid grade!'),
    check('role').not().isEmpty().withMessage('invalid role!'),
  ],
  studentControllers.signup
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
  studentControllers.editProfile
);
router.post(
  '/login',
  [
    check('password').isLength({ min: 4 }),
    check('email').normalizeEmail().isEmail(),
  ],
  studentControllers.login
);

// ! Acc request status
router.get('/acc-status/:studentId', studentControllers.getAccReqStatus);

// ! Subject Enrollment
router.get(
  '/enrolled-subjects/:studentId',
  studentControllers.getEnrolledSubjects
);
router.post(
  '/enroll',
  [check('subId').not().isEmpty()],
  studentControllers.enrollSubject
);

// ! Chapters
router.get('/chapters/:subId', studentControllers.getChapters);

// ! Sections
router.get('/sections/:chapterId', studentControllers.getSections);

// ! Topics
router.get('/topics/:sectionId', studentControllers.getTopics);
router.get('/topic/:topicId', studentControllers.getTopic);

// ! Favorite
router.get('/favorites/:subjectId/:studentId', studentControllers.getFavorites);
router.get(
  '/favorite/:studentId/:topicId',
  studentControllers.getSingleFavorite
);
router.post('/favorite/', studentControllers.addFavorite);
router.delete(
  '/favorite/:studentId/:topicId',
  studentControllers.deleteFavorite
);

// ! Quiz Answer
router.post('/answer/', studentControllers.addAnswer);
router.post('/single-answer/', studentControllers.addSingleAnswer);
router.get('/answer/:quizId', studentControllers.getAnswer);
router.get('/answers/:answerId', studentControllers.getAnswers);

// ! Quiz Record
router.post('/quiz-record/', studentControllers.addQuizRecord);
router.get(
  '/quiz-records/:studentId/:subjectId/',
  studentControllers.getQuizRecords
);
router.get(
  '/quiz-records-for-chapter/:studentId/:subjectId/:chapterId',
  studentControllers.getQuizRecordsForChapter
);
router.get(
  '/quiz-record/:studentId/:sectionId/',
  studentControllers.getQuizRecord
);
router.get('/quiz/:quizId/', studentControllers.getQuiz);

module.exports = router;
