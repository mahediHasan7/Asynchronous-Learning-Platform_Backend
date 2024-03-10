const CustomError = require('../Model/Error');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const { v4 } = require('uuid');
const multer = require('multer');
const { v1 } = require('uuid');
const fs = require('fs');
const path = require('path');

const Subject = require('../Model/Subject');
const UserEducator = require('../Model/UserEducator');
const AccReqEducator = require('../Model/AccReqEducator');
const EducatorSubject = require('../Model/EducatorSubject');
const UserStudent = require('../Model/UserStudent');
const Section = require('../Model/Section');
const Topic = require('../Model/Topic');
const Comment = require('../Model/Comment');
const Quiz = require('../Model/Quiz');
const Chapter = require('../Model/Chapter');
const Question = require('../Model/Question');
const UserAdmin = require('../Model/UserAdmin');
const StudentSubject = require('../Model/StudentSubject');
const QuizRecord = require('../Model/QuizRecord');

// ! Acc request status

// router.get('/educator/acc-status/:studentId',)
const getAccReqStatus = async (req, res, next) => {
  const educatorId = req.params.educatorId;

  let accReq;
  try {
    accReq = await AccReqEducator.findOne({
      where: { UserEducatorId: educatorId },
    });
    if (!accReq) {
      throw new Error('The educator acc request could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let status;

  if (!accReq.approval) {
    status = 'pending';
  } else if (accReq.approval === 'declined') {
    status = 'declined';
  } else if (accReq.approval === 'approved') {
    status = 'approved';
  }

  res.status(201).json({ status: status });
};

// ! Subject registration

// router.get('/educator/subjects',)
const getSubjects = async (req, res, next) => {
  let subjects;
  try {
    subjects = await Subject.findAll();
    if (!subjects) {
      throw new Error('The subject list could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ subjects: subjects });
};

// router.get('/educator/registered-subjects/:educatorId',)
const getRegisteredSubjects = async (req, res, next) => {
  const educatorId = req.params.educatorId;

  let educator;
  try {
    educator = await UserEducator.findByPk(educatorId);
    if (!educator) {
      throw new Error('The educator could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const subjects = await educator.getSubjects();

  res.status(201).json({ subjects: subjects });
};

// router.post('/educator/register',)
const registerSubject = async (req, res, next) => {
  const { subId, educatorId } = req.body;

  let educator;
  try {
    educator = await UserEducator.findOne({ where: { id: educatorId } });
    if (!educator) {
      throw new Error('The eductor could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let subject;
  try {
    subject = await Subject.findOne({ where: { id: subId } });
    if (!subject) {
      throw new Error('No subject found for registering!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let subjectRegisteredAlready;
  try {
    subjectRegisteredAlready = await EducatorSubject.findOne({
      where: { SubjectId: subId },
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let eductorSubject;
  if (!subjectRegisteredAlready) {
    try {
      eductorSubject = await EducatorSubject.create({
        UserEducatorId: educator.id,
        SubjectId: subject.id,
      });
    } catch (error) {
      console.log(error);
      return next(new CustomError(error.message, 422));
    }

    // updating the educator filed in Subject
    subject.educator = educator.name;
    await subject.save();
  }

  res.status(201).json({ EducatorSubject: eductorSubject });
};

// router.delete('/educator/unregister/:educatorId/:subId',)
const unregisterSubject = async (req, res, next) => {
  const educatorId = req.params.educatorId;
  const subId = req.params.subId;

  let educator;
  try {
    educator = await UserEducator.findOne({ where: { id: educatorId } });
    if (!educator) {
      throw new Error('The eductor could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let subject;
  try {
    subject = await Subject.findOne({ where: { id: subId } });
    if (!subject) {
      throw new Error('No subject found for registering!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let eductorSubject;
  try {
    eductorSubject = await EducatorSubject.destroy({
      where: {
        UserEducatorId: educator.id,
        SubjectId: subject.id,
      },
    });
  } catch (error) {
    console.log(error);
    return next(new CustomError(error.message, 422));
  }

  // updating the educator filed in Subject
  subject.educator = null;
  await subject.save();

  res.status(201).json({ message: 'Subject has been unregistered' });
};

// router.post('/educator/view-students/:subId',)
const viewStudents = async (req, res, next) => {
  const subId = req.params.subId;

  let subject;
  try {
    subject = await Subject.findOne({
      where: { id: subId },
    });
    if (!subject) {
      throw new Error('No subject found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let students;
  try {
    students = await subject.getUserStudents();
    if (!students) {
      throw new Error('No students found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  // let students;
  // try {
  //   students = await Subject.findAll({
  //     include: [
  //       {
  //         model: UserStudent,
  //         // attributes: ['id', 'name', 'email', 'phone'],
  //         through: { where: { SubjectId: subId } },
  //       },
  //     ],
  //   });
  //   if (!students) {
  //     throw new Error('No students found for this subject');
  //   }
  // } catch (error) {
  //   return next(new CustomError(error.message, 422));
  // }

  res.status(201).json({ students: students });
};

// ! Chapters *******

// router.get('/educator/chapters/:subId',)
const getChapters = async (req, res, next) => {
  const subId = req.params.subId;

  let chapters;
  try {
    chapters = await Chapter.findAll({ where: { subjectId: subId } });
    if (!chapters) {
      throw new Error('Chapter list not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const modifiedChapters = await Promise.all(
    chapters.map(async (chapter) => {
      let sections;
      let totalTopics = 0;
      let totalQuizzes = 0;

      try {
        sections = await Section.findAndCountAll({
          where: { chapterId: chapter.id },
        });
        if (!sections) {
          throw new Error(
            'Something wrong when trying to count total sections'
          );
        }

        let modifiedSections;
        try {
          let topics;
          modifiedSections = await Promise.all(
            sections.rows.map(async (section) => {
              try {
                topics = await Topic.findAndCountAll({
                  where: { sectionId: section.id },
                });
                if (!topics) {
                  throw new Error(
                    'Something wrong when trying to count total topics'
                  );
                }
              } catch (error) {
                return next(new CustomError(error.message, 422));
              }

              totalTopics += topics.count;

              let quizzes;
              try {
                quizzes = await Quiz.findAndCountAll({
                  where: { sectionId: section.id },
                });
                if (!quizzes) {
                  throw new Error(
                    'Something wrong when trying to count total quizzes'
                  );
                }
              } catch (error) {
                return next(new CustomError(error.message, 422));
              }

              totalQuizzes += quizzes.count;

              // not used but for kept for future use
              const sectionWithOtherData = {
                id: section.id,
                name: section.name,
                createdAt: section.createdAt,
                updatedAt: section.updatedAt,
                ChapterId: section.ChapterId,
                totalTopics: topics.count,
                totalQuizzes: quizzes.count,
              };

              // not used but for kept for future use
              return sectionWithOtherData;
            })
          );
        } catch (error) {
          return next(new CustomError(error.message, 422));
        }
      } catch (error) {
        return next(new CustomError(error.message, 422));
      }

      const chapterWithOtherData = {
        id: chapter.id,
        name: chapter.name,
        totalSections: sections.count,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        SubjectId: chapter.SubjectId,
        totalSection: sections.count,
        totalTopics: totalTopics,
        quiz: totalQuizzes,
      };

      return chapterWithOtherData;
    })
  );

  res.status(201).json({ chapters: modifiedChapters });
};

// ! Sections

// router.get('/educator/sections/:chapterId',)
const getSections = async (req, res, next) => {
  const chapterId = req.params.chapterId;

  let sections;
  try {
    sections = await Section.findAll({ where: { chapterId: chapterId } });
    if (!sections) {
      throw new Error('Section list not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const modifiedSections = await Promise.all(
    sections.map(async (section) => {
      let topics;
      try {
        topics = await Topic.findAndCountAll({
          where: { sectionId: section.id },
        });
        if (!topics) {
          throw new Error(
            'Something wrong when trying to count total sections'
          );
        }
        // totalTopics += topics.count;
      } catch (error) {
        return next(new CustomError(error.message, 422));
      }

      let quizAvailable;
      try {
        const quiz = await Quiz.findOne({
          where: { sectionId: section.id },
        });
        if (quiz) {
          quizAvailable = 1;
        } else {
          quizAvailable = 0;
        }
      } catch (error) {
        return next(new CustomError(error.message, 422));
      }

      const sectionWithOtherData = {
        id: section.id,
        name: section.name,
        createdAt: section.createdAt,
        updatedAt: section.updatedAt,
        ChapterId: section.ChapterId,
        totalTopics: topics.count,
        quiz: quizAvailable === 1 ? 'Available' : 'Unavailable',
      };

      return sectionWithOtherData;
    })
  );

  res.status(201).json({ sections: modifiedSections });
};

// ! Topics *******

// router.get('/educator/topics/:sectionId',)
const getTopics = async (req, res, next) => {
  const sectionId = parseInt(req.params.sectionId);

  let section;
  try {
    section = await Section.findByPk(sectionId);
    if (!section) {
      throw new Error('No section found to retrieve the topic list');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let topics;
  try {
    topics = await section.getTopics();
    if (!topics) {
      throw new Error('No topics found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ topics: topics });
};

// router.get('/educator/topic/:topicId',)
const getTopic = async (req, res, next) => {
  const topicId = parseInt(req.params.topicId);

  let topic;
  try {
    topic = await Topic.findByPk(topicId);
    if (!topic) {
      throw new Error('No topic found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  // Converting Content json file to object
  let rawContent = fs.readFileSync(path.resolve(topic.content));
  let parsedContent = JSON.parse(rawContent);
  // console.log(parsedContent);

  // Modifying the topic with content and lectureNote
  Object.keys(topic.dataValues).map(function (key, index) {
    if (key === 'content') {
      topic['content'] = parsedContent;
    }
  });

  res.status(201).json({ topic: topic });
};

// router.post('/educator/topic',)
const addTopic = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { sectionId, title, description } = req.body;

  let lectureNote;
  if (req.files.lectureNote) {
    lectureNote = req.files.lectureNote[0].path;
  }

  let content;
  if (req.files.content) {
    content = req.files.content[0].path;
  }

  let section;
  try {
    section = await Section.findOne({
      where: { id: sectionId },
    });
    if (!section) {
      throw new Error('No section found for adding the topic');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let topic;
  try {
    topic = await section.createTopic({
      title,
      description,
      lectureNote,
      content,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ topic: topic });
};

// router.patch('/educator/topic/:topicId',)
const editTopic = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const topicId = req.params.topicId;

  const { title, description } = req.body;

  let newLectureNote;
  if (req.files.lectureNote) {
    newLectureNote = req.files.lectureNote[0].path;
  }

  let newContent;
  if (req.files.content) {
    newContent = req.files.content[0].path;
  }

  const topic = await Topic.findByPk(topicId);
  if (!topic) {
    return next(new CustomError('Topic could not found!', 404));
  }

  const oldLectureNote = topic.lectureNote;
  const oldContent = topic.content;

  let updatedTopic;
  try {
    await Topic.update(
      { title, description, lectureNote: newLectureNote, content: newContent },
      {
        where: {
          id: topicId,
        },
      }
    );
    //removing the lecture note and the content file
    if (oldLectureNote && newLectureNote) {
      fs.unlink(oldLectureNote, (err) => {});
    }
    if (oldContent) {
      fs.unlink(oldContent, (err) => {});
    }

    updatedTopic = await Topic.findByPk(topicId);
    if (!updatedTopic) {
      return next(new CustomError('Topic could not found!', 404));
    }
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  res.status(201).json({ topic: updatedTopic });
};

// router.delete('/educator/topic/:topicId',)
const deleteTopic = async (req, res, next) => {
  const topicId = req.params.topicId;

  let topic;
  try {
    topic = await Topic.findOne({
      where: { id: topicId },
    });
    if (!topic) {
      throw new Error('No topic found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  //removing the lecture note and the content file
  if (topic.lectureNote) {
    fs.unlink(topic.lectureNote, (err) => {});
  }
  if (topic.content) {
    fs.unlink(topic.content, (err) => {});
  }

  topic.destroy();
  res.status(201).json({ message: 'Topic has been deleted' });
};

// ! Comment *******

// router.get('/educator/comments/:sectionId',)
const getComments = async (req, res, next) => {
  const sectionId = parseInt(req.params.sectionId);

  let section;
  try {
    section = await Section.findByPk(sectionId);
    if (!section) {
      throw new Error('No section found to retrieve the comment list');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let commentsWithImage;
  try {
    const comments = await section.getComments({ raw: true });
    if (!comments) {
      throw new Error('No comments found');
    }

    commentsWithImage = await Promise.all(
      comments.map(async (comment) => {
        const userId = comment.userId;
        const firstDigitUserId = String(userId)[0];
        let userModel;
        if (firstDigitUserId === '1') {
          userModel = UserAdmin;
        } else if (firstDigitUserId === '2') {
          userModel = UserEducator;
        } else {
          userModel = UserStudent;
        }

        let userImage;
        try {
          const user = await userModel.findByPk(userId);
          if (user) {
            userImage = user.image;
          } else {
            userImage = '';
          }
        } catch (error) {
          return next(new CustomError(error.message, 422));
        }

        const tempComment = {
          ...comment,
          userImage: userImage,
        };

        return tempComment;
      })
    );
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ comments: commentsWithImage });
};

// router.post('/educator/comment',)
const addComment = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { sectionId, userName, userId, userRole, commentText } = req.body;

  let section;
  try {
    section = await Section.findOne({
      where: { id: sectionId },
    });
    if (!section) {
      throw new Error('No section found for adding the comment');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let comment;
  try {
    comment = await section.createComment({
      commentText,
      userName,
      userId,
      userRole,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ comment: comment });
};

// router.patch('/educator/comment/:commentId',)
const editComment = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const topicId = req.params.topicId;

  const { title, description } = req.body;

  let lectureNote;
  if (req.files.lectureNote) {
    lectureNote = req.files.lectureNote[0].path;
  }

  let content;
  if (req.files.content) {
    content = req.files.content[0].path;
  }

  const topic = await Topic.findByPk(topicId);
  if (!topic) {
    return next(new CustomError('Topic could not found!', 404));
  }

  const oldLectureNote = topic.lectureNote;
  const oldContent = topic.content;

  try {
    await Topic.update(
      { title, description, lectureNote, content },
      {
        where: {
          id: topicId,
        },
      }
    );
    //removing the lecture note and the content file
    if (oldLectureNote) {
      fs.unlink(oldLectureNote, (err) => {});
    }
    if (oldContent) {
      fs.unlink(oldContent, (err) => {});
    }
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  res.status(201).json({ topic: topic });
};

// router.delete('/educator/comment/:commentId',)
const deleteComment = async (req, res, next) => {
  const commentId = req.params.commentId;

  let comment;
  try {
    comment = await Comment.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new Error('No comment found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  comment.destroy();

  res.status(201).json({ message: 'Comment has been deleted' });
};

// ! Quiz *******

// router.post('/educator/quiz',)
const addQuiz = async (req, res, next) => {
  const { sectionId } = req.body;

  let section;
  try {
    section = await Section.findOne({
      where: { id: sectionId },
    });
    if (!section) {
      throw new Error('No section found for adding the quiz');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let existingQuiz;
  try {
    existingQuiz = await Quiz.findOne({
      where: { sectionId: sectionId },
    });
    if (existingQuiz) {
      throw new Error('Quiz already added for this section');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let quiz;
  try {
    quiz = await section.createQuiz();
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ quiz: quiz });
};

// router.get('/educator/quiz/:sectionId',)
const getQuiz = async (req, res, next) => {
  const sectionId = parseInt(req.params.sectionId);

  let quiz;
  try {
    quiz = await Quiz.findOne({
      where: {
        sectionId: sectionId,
      },
    });
    if (!quiz) {
      throw new Error('No quiz found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let quizWithQuestions;
  try {
    quizWithQuestions = await quiz.getQuestions();
    if (!quizWithQuestions) {
      throw new Error('No questions found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const modifiedQuizWithQuestions = quizWithQuestions.map((question) => {
    // Converting Question json file to object
    let rawQuestion = fs.readFileSync(path.resolve(question.question));
    let parsedQuestion = JSON.parse(rawQuestion);

    // Modifying the quiz with parsed question
    Object.keys(quiz.dataValues).map(function (key, index) {
      if (key === 'content') {
        quiz['content'] = parsedQuestion;
      }
    });
    return {
      id: question.id,
      question: parsedQuestion,
      solution: question.solution,
      option1: question.option1,
      option2: question.option2,
      option3: question.option3,
      option4: question.option4,
      answer: question.answer,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      QuizId: question.QuizId,
    };
  });

  res.status(201).json({ quiz: modifiedQuizWithQuestions });
};

// router.post('/educator/question',)
const addQuestion = async (req, res, next) => {
  const { quizId, option1, option2, option3, option4, answer } = req.body;

  let question;
  if (req.files.question) {
    question = req.files.question[0].path;
  }

  let solution;
  if (req.files.solution) {
    solution = req.files.solution[0].path;
  }

  let quiz;
  try {
    quiz = await Quiz.findOne({
      where: { id: quizId },
    });
    if (!quiz) {
      throw new Error('No quiz found for adding the questions');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let questionItem;
  try {
    questionItem = await quiz.createQuestion({
      question,
      solution,
      option1,
      option2,
      option3,
      option4,
      answer,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ question: questionItem });
};

// router.delete('/educator/quiz/:quizId',)
const deleteQuiz = async (req, res, next) => {
  const quizId = req.params.quizId;

  let quiz;
  try {
    quiz = await Quiz.findOne({
      where: { id: quizId },
    });
    if (!quiz) {
      throw new Error('No quiz found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  //removing the lecture note and the content file
  let questions;
  try {
    questions = await Question.findAll({
      where: { quizId: quizId },
    });
    if (!questions) {
      throw new Error(
        'No questions found for deleting its content from the server'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  questions.forEach((questionItem) => {
    if (questionItem.question) {
      fs.unlink(questionItem.question, (err) => {});
    }
    if (questionItem.solution) {
      fs.unlink(questionItem.solution, (err) => {});
    }
  });

  quiz.destroy();

  res.status(201).json({ message: 'Quiz has been deleted' });
};

// router.get('/educator/quiz-stats-students/:subjectId/:quizId',)
const getQuizStatsOfStudents = async (req, res, next) => {
  const subjectId = req.params.subjectId;
  const quizId = req.params.quizId;

  // Finding how many student enroll for that subject
  let totalEnrolledStudents;
  let enrolledStudents;
  try {
    enrolledStudents = await StudentSubject.findAndCountAll({
      where: { SubjectId: subjectId },
    });
    if (!enrolledStudents) {
      throw new Error('No Enrolled Students');
    }
    totalEnrolledStudents = enrolledStudents.count;
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  // Finding how many student attempted quiz for that quizId
  let totalAttemptedStudents;
  let quizAttempted;
  try {
    quizAttempted = await QuizRecord.findAndCountAll({
      where: { QuizId: quizId, subject: subjectId },
      raw: true,
    });
    if (!quizAttempted) {
      throw new Error('No Quiz record found');
    }
    totalAttemptedStudents = quizAttempted.count;
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  // Calculating the accuracy
  const totalMarks = totalAttemptedStudents * 10;
  let totalMarksByStudents = 0;
  const total = quizAttempted.rows.forEach((a) => {
    totalMarksByStudents += a.marks;
  });

  let accuracy;
  if (totalMarks === 0) {
    accuracy = 0;
  } else {
    accuracy = Math.round((totalMarksByStudents / totalMarks) * 100);
  }

  res.status(201).json({
    quizStats: {
      assigned: totalEnrolledStudents,
      completed: totalAttemptedStudents,
      incomplete: totalEnrolledStudents - totalAttemptedStudents,
      studentPercentage: Math.round(
        (totalAttemptedStudents / totalEnrolledStudents) * 100
      ),
      accuracyPercentage: accuracy,
    },
  });
};

// ! Signup and Login *******

// router.post('/educator/signup',)
const signup = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, email, phone, password, role } = req.body;

  try {
    const userExisting = await UserEducator.findOne({
      where: { email: email },
    });
    if (userExisting) {
      throw new Error(
        'User already exists with this email address. Please try with another email'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newUser;
  try {
    newUser = await UserEducator.create({
      name,
      email,
      phone,
      password,
      role,
      image: req.file ? req.file.path : '',
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  //  Finding the latest educator account
  const newEducator = await UserEducator.findOne({ where: { email: email } });

  // Adding the new account request into database
  let newEducatorRequest;
  try {
    newEducatorRequest = await newEducator.createAccReqEducator({
      role,
      name,
      email,
      phone,
    });
  } catch (error) {
    // deleting the new educator account from the UserEducator db table
    newUser.destroy();

    return next(new CustomError(error.message, 422));
  }

  let token;
  try {
    const userAfterCreatingAcc = await UserEducator.findOne({
      where: { email: email },
      raw: true,
    });

    token = jwt.sign(
      {
        userId: userAfterCreatingAcc.id.toString(),
        email: userAfterCreatingAcc.email.toString(),
      },
      'the_secret_key',
      {}
    );
  } catch (error) {}

  res.status(201).json({ user: newUser, token: token });
};

// router.patch('/educator/edit-profile',)
const editProfile = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { eduId, name, email, phone, password } = req.body;

  try {
    const educator = await UserEducator.findByPk(eduId);
    if (!educator) {
      throw new Error('Educator could not found for updating data');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newImage;
  if (req.file) {
    newImage = req.file.path !== '' ? req.file.path : educator.image;
  }

  try {
    await UserEducator.update(
      { name, email, phone, password, image: newImage },
      {
        where: {
          id: eduId,
        },
      }
    );
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  let updatedEducator;
  try {
    updatedEducator = await UserEducator.findByPk(eduId);
    if (!updatedEducator) {
      throw new Error('Educator could not found for returning');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ updatedUser: updatedEducator });
};

// router.post('/educator/login',)
const login = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }
  const { email, password } = req.body;

  const user = await UserEducator.findOne({ where: { email: email } });

  if (!user || user.password !== password) {
    if (!user) {
      return next(new CustomError('User is not registered!', 401));
    } else {
      return next(new CustomError('Invalid password!', 401));
    }
  }

  let token;
  try {
    token = jwt.sign(
      { userId: user.id, email: user.email },
      'the_secret_key',
      {}
    );
  } catch (error) {
    console.log(error.message);
    return next(new Error('Something wrong with the token creation'));
  }

  if (user.password === password) {
    res
      .status(200)
      .json({ message: 'login successful!', user: user, token: token });
  }
};

exports.signup = signup;
exports.editProfile = editProfile;
exports.login = login;

exports.getAccReqStatus = getAccReqStatus;

exports.getSubjects = getSubjects;
exports.getRegisteredSubjects = getRegisteredSubjects;
exports.registerSubject = registerSubject;
exports.unregisterSubject = unregisterSubject;
exports.viewStudents = viewStudents;

exports.getChapters = getChapters;
exports.getSections = getSections;

exports.getTopics = getTopics;
exports.getTopic = getTopic;
exports.addTopic = addTopic;
exports.editTopic = editTopic;
exports.deleteTopic = deleteTopic;

exports.getComments = getComments;
exports.addComment = addComment;
exports.editComment = editComment;
exports.deleteComment = deleteComment;

exports.addQuestion = addQuestion;
exports.getQuiz = getQuiz;
exports.addQuiz = addQuiz;
exports.deleteQuiz = deleteQuiz;
exports.getQuizStatsOfStudents = getQuizStatsOfStudents;
