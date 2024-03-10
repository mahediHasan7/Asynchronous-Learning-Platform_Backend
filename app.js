const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const CustomError = require('./Model/Error');

const adminRoutes = require('./routes/admin-routes');
const educatorRoutes = require('./routes/educator-routes');
const studentRoutes = require('./routes/student-routes');
const parentRoutes = require('./routes/parent-routes');

//! Database setup and MODELS
const db = require('./util/database');

const UserAdmin = require('./Model/UserAdmin');
const UserEducator = require('./Model/UserEducator');
const UserStudent = require('./Model/UserStudent');
const UserParent = require('./Model/UserParent');
const AccReqEducator = require('./Model/AccReqEducator');
const AccReqStudent = require('./Model/AccReqStudent');
const AccReqParent = require('./Model/AccReqParent');
const StudentSubject = require('./Model/StudentSubject');
const EducatorSubject = require('./Model/EducatorSubject');
const Subject = require('./Model/Subject');
const Chapter = require('./Model/Chapter');
const Section = require('./Model/Section');
const Topic = require('./Model/Topic');
const Comment = require('./Model/Comment');
const Favorite = require('./Model/Favorite');
const Quiz = require('./Model/Quiz');
const Question = require('./Model/Question');
const Answer = require('./Model/Answer');
const SingleAnswer = require('./Model/SingleAnswer');
const QuizRecord = require('./Model/QuizRecord');

UserStudent.hasMany(QuizRecord, { onDelete: 'cascade' });
QuizRecord.belongsTo(UserStudent);
Quiz.hasMany(QuizRecord);
QuizRecord.belongsTo(Quiz);

UserStudent.hasMany(Answer, { onDelete: 'cascade' });
Answer.belongsTo(UserStudent);
Quiz.hasMany(Answer);
Answer.belongsTo(Quiz);

Answer.hasMany(SingleAnswer, { onDelete: 'cascade' });
SingleAnswer.belongsTo(Answer);

UserEducator.hasOne(AccReqEducator, { onDelete: 'cascade' });
AccReqEducator.belongsTo(UserEducator);
UserStudent.hasOne(AccReqStudent, { onDelete: 'cascade' });
AccReqStudent.belongsTo(UserStudent);
UserParent.hasOne(AccReqParent, { onDelete: 'cascade' });
AccReqParent.belongsTo(UserParent);

UserEducator.belongsToMany(Subject, { through: EducatorSubject });
Subject.belongsToMany(UserEducator, { through: EducatorSubject });
UserStudent.belongsToMany(Subject, { through: StudentSubject });
Subject.belongsToMany(UserStudent, { through: StudentSubject });

UserStudent.belongsToMany(Topic, { through: Favorite });
Topic.belongsToMany(UserStudent, { through: Favorite });

Subject.hasMany(Chapter, { onDelete: 'cascade' });
Chapter.belongsTo(Subject);

Chapter.hasMany(Section, { onDelete: 'cascade' });
Section.belongsTo(Chapter);

Section.hasMany(Topic, { onDelete: 'cascade' });
Topic.belongsTo(Section);

Section.hasMany(Comment, { onDelete: 'cascade' });
Comment.belongsTo(Section);

Quiz.hasMany(Question, { onDelete: 'cascade' });
Question.belongsTo(Quiz);
Section.hasOne(Quiz, { onDelete: 'cascade' });
Quiz.belongsTo(Section);

const app = express();

app.use(bodyParser.json());

// open the uploads/images folder statically for using from outside
// for accessing http://localhost:5000/uploads/images/....
app.use('/uploads/images', express.static(path.join('uploads', 'images')));
app.use(
  '/uploads/lectureNotes',
  express.static(path.join('uploads', 'lectureNotes'))
);
app.use('/uploads/quizzes', express.static(path.join('uploads', 'quizzes')));

//Solving the CORS error that produces by the browser
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE');

  next();
});

app.use('/api/admin', adminRoutes);
app.use('/api/educator', educatorRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/parent', parentRoutes);

app.use((req, res, next) => {
  const httpError = new CustomError('Could not found this route!', 404);
  return next(httpError);
});

//Error middleware
app.use((error, req, res, next) => {
  //roll back the images that saved into the uploads/images folder when there is an error
  // multer put file in req.file
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      // console.log(err);
    });

    console.log(error);

    const status = error.status || 500;
  }

  //If response already sent then just pass the error to the next middleware
  if (res.headerSent) {
    return next(error);
  }

  res.locals.error = error;
  const status = error.status || 500;
  res.status(status);
  res.json({ message: error.message || 'An error occurred!' });

  // res
  //   .status(error.code || 500)
  //   .json({ message: error.message || 'An error occurred!' });
});

db.sequelize
  .sync() //{ force: true }
  .then((result) => {
    app.listen(5000);
  })
  .catch((err) => {
    console.log(err);
  });
