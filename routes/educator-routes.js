const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');

const educatorControllers = require('../Controller/educator-controller');
const contentUpload = require('../middlewares/content-upload');
const fileUpload = require('../middlewares/file-upload');
const quizUpload = require('../middlewares/quiz-upload');

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
  educatorControllers.signup
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
  educatorControllers.editProfile
);
router.post(
  '/login',
  [
    check('password').isLength({ min: 4 }),
    check('email').normalizeEmail().isEmail(),
  ],
  educatorControllers.login
);

// ! Acc request status
router.get('/acc-status/:educatorId', educatorControllers.getAccReqStatus);

// ! Subject registration
router.get('/subjects', educatorControllers.getSubjects);
router.get(
  '/registered-subjects/:educatorId',
  educatorControllers.getRegisteredSubjects
);
router.post(
  '/register',
  [check('subId').not().isEmpty()],
  educatorControllers.registerSubject
);
router.delete(
  '/unregister/:educatorId/:subId',
  educatorControllers.unregisterSubject
);
router.get('/view-students/:subId', educatorControllers.viewStudents);

// ! Chapters
router.get('/chapters/:subId', educatorControllers.getChapters);

// ! Sections
router.get('/sections/:chapterId', educatorControllers.getSections);

// ! Topics
router.get('/topics/:sectionId', educatorControllers.getTopics);
router.get('/topic/:topicId', educatorControllers.getTopic);
router.post(
  '/topic',
  contentUpload.fields([
    {
      name: 'lectureNote',
      maxCount: 1,
    },
    {
      name: 'content',
      maxCount: 1,
    },
  ]),
  [check('title').not().isEmpty()],
  educatorControllers.addTopic
);
router.patch(
  '/topic/:topicId',
  contentUpload.fields([
    {
      name: 'lectureNote',
      maxCount: 1,
    },
    {
      name: 'content',
      maxCount: 1,
    },
  ]),
  [check('title').not().isEmpty()],
  educatorControllers.editTopic
);
router.delete('/topic/:topicId', educatorControllers.deleteTopic);

// ! Comment
router.get('/comments/:sectionId', educatorControllers.getComments);
router.post(
  '/comment',
  contentUpload.fields([]),
  [check('commentText').not().isEmpty()],
  educatorControllers.addComment
);
router.patch(
  '/comment/:commentId',
  [check('commentText').not().isEmpty()],
  educatorControllers.editComment
);
router.delete('/comment/:commentId', educatorControllers.deleteComment);

// ! Quiz
router.post('/quiz', educatorControllers.addQuiz);
router.get('/quiz/:sectionId', educatorControllers.getQuiz);
router.post(
  '/question',
  quizUpload.fields([
    {
      name: 'question',
      maxCount: 1,
    },
    {
      name: 'solution',
      maxCount: 1,
    },
  ]),
  educatorControllers.addQuestion
);
router.delete('/quiz/:quizId', educatorControllers.deleteQuiz);
router.get(
  '/quiz-stats-students/:subjectId/:quizId',
  educatorControllers.getQuizStatsOfStudents
);

module.exports = router;
