const multer = require('multer');
const { v1 } = require('uuid');

const quizUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      // if (file.mimetype === 'application/json') {
      //   cb(null, 'uploads/contents');
      // } else {
      //   cb(null, 'uploads/lectureNotes');
      // }
      cb(null, 'uploads/quizzes');
    },
    filename: (req, file, cb) => {
      const extArray = file.mimetype.split('/');
      const extension = extArray[extArray.length - 1];

      cb(null, file.originalname.split('.')[0] + ' ' + v1() + '.' + extension);
    },
  }),
});

module.exports = quizUpload;
