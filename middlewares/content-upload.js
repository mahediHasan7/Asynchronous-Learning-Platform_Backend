const multer = require('multer');
const { v1 } = require('uuid');

const contentUpload = multer({
  // limits: 500000,

  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.mimetype === 'application/json') {
        cb(null, 'uploads/contents');
      } else {
        cb(null, 'uploads/lectureNotes');
      }
    },
    filename: (req, file, cb) => {
      let extension;
      if (
        file.mimetype ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        extension = 'docx';
      } else if (file.mimetype === 'application/msword') {
        extension = 'doc';
      } else {
        let extArray = file.mimetype.split('/');
        extension = extArray[extArray.length - 1];
      }

      cb(null, file.originalname.split('.')[0] + ' ' + v1() + '.' + extension);
    },
  }),
});

module.exports = contentUpload;
