const CustomError = require('../Model/Error');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const { v4 } = require('uuid');
const Subject = require('../Model/Subject');
const UserStudent = require('../Model/UserStudent');
const StudentSubject = require('../Model/StudentSubject');
const Chapter = require('../Model/Chapter');
const Section = require('../Model/Section');
const Topic = require('../Model/Topic');
const Quiz = require('../Model/Quiz');
const Favorite = require('../Model/Favorite');
const Answer = require('../Model/Answer');
const QuizRecord = require('../Model/QuizRecord');
const AccReqStudent = require('../Model/AccReqStudent');

// ! Acc request status

// router.get('/student/acc-status/:studentId',)
const getAccReqStatus = async (req, res, next) => {
  const studentId = req.params.studentId;

  let accReq;
  try {
    accReq = await AccReqStudent.findOne({
      where: { UserStudentId: studentId },
    });
    if (!accReq) {
      throw new Error('The student acc request could not found!');
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
  console.log(status);

  res.status(201).json({ status: status });
};

// ! Subject Enrollment

// router.get('/student/registered-subjects/:studentId',)
const getEnrolledSubjects = async (req, res, next) => {
  const studentId = req.params.studentId;

  console.log(studentId);

  let student;
  try {
    student = await UserStudent.findByPk(studentId);
    if (!student) {
      throw new Error('The student could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const subjects = await student.getSubjects();

  res.status(201).json({ subjects: subjects });
};

// router.post('/student/enroll',)
const enrollSubject = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { subId, studentId } = req.body;

  let student;
  try {
    student = await UserStudent.findOne({ where: { id: studentId } });
    if (!student) {
      throw new Error('No student found for enrollment!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let subjectForEnrollment;
  try {
    subjectForEnrollment = await Subject.findOne({ where: { id: subId } });
    if (!subjectForEnrollment) {
      throw new Error('No subject found for enrollment!');
    }

    const totalEnrollment = subjectForEnrollment.enrollment;
    if (!totalEnrollment) {
      subjectForEnrollment.enrollment = 1;
      await subjectForEnrollment.save();
    } else {
      subjectForEnrollment.enrollment = totalEnrollment + 1;
      await subjectForEnrollment.save();
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let studentSubject;
  try {
    studentSubject = await StudentSubject.create({
      UserStudentId: student.id,
      SubjectId: subjectForEnrollment.id,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ subject: studentSubject });
};

// ! Chapters

// router.get('/student/chapters/:subId',)
const getChapters = async (req, res, next) => {
  const subId = req.params.subId;

  let chapters;
  try {
    chapters = await Chapter.findAll({ where: { SubjectId: subId } });
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
        totalSections: chapter.totalSections,
        createdAt: chapter.createdAt,
        updatedAt: chapter.updatedAt,
        SubjectId: chapter.SubjectId,
        totalSection: sections.count,
        totalTopics: totalTopics,
        totalQuizzes: totalQuizzes,
      };

      return chapterWithOtherData;
    })
  );

  res.status(201).json({ chapters: modifiedChapters });
};

// ! Sections

// router.get('/student/sections/:chapterId',)
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

// ! Topics

// router.get('/student/topics/:sectionId',)
const getTopics = async (req, res, next) => {
  const sectionId = req.params.sectionId;

  let topics;
  try {
    topics = await Topic.findAll({ where: { sectionId: sectionId } });
    if (!topics) {
      throw new Error('Topic list not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ topics: topics });
};

// router.get('/student/topic/:topicId',)
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
    // console.log(key);
    if (key === 'content') {
      topic['content'] = parsedContent;
    }
  });

  res.status(201).json({ topic: topic });
};

// ! Favorite

// router.get('/student/favorites/:subjectId/:studentId',)
const getFavorites = async (req, res, next) => {
  const subjectId = req.params.subjectId;
  const studentId = req.params.studentId;

  // Finding the subject and its topics
  let subject;
  try {
    subject = await Subject.findByPk(subjectId);
    if (!subject) {
      throw new Error('Subject for Favorite could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let chapters;
  try {
    chapters = await subject.getChapters();
    if (!chapters) {
      throw new Error('Chapters for the subject could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const sections = await Promise.all(
    chapters.map(async (chapter) => {
      let section;
      try {
        section = await chapter.getSections();
        if (!section) {
          throw new Error('Sections for the chapter could not found!');
        }
      } catch (error) {
        return next(new CustomError(error.message, 422));
      }
      return section;
    })
  );

  const topics = await Promise.all(
    sections.map(async (groupedSections) => {
      const topicList = await Promise.all(
        groupedSections.map(async (section) => {
          let topicListItems;
          try {
            topicListItems = await section.getTopics();
            if (!topicListItems) {
              throw new Error('Topics for the section could not found!');
            }
          } catch (error) {
            return next(new CustomError(error.message, 422));
          }
          return topicListItems;
        })
      );
      return topicList;
    })
  );

  //* Merging the topics into one array
  const topicsReducedArr_first = topics.reduce((accum, item) => {
    accum = [...accum, ...item];
    return accum;
  }, []);

  const topicsReducedArr_final = topicsReducedArr_first.reduce(
    (accum, item) => {
      accum = [...accum, ...item];
      return accum;
    },
    []
  );

  // Finding the favorite for the student
  let student;
  try {
    student = await UserStudent.findOne({ where: { id: studentId } });
    if (!student) {
      throw new Error('No student found for retrieving the favorite list');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let favorites;
  try {
    favorites = await student.getTopics();
    if (!favorites) {
      throw new Error('No Favorite list found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  // *******************************

  // ! finding the matched favorite topics
  const matchedTopics = topicsReducedArr_final.filter(function (o1) {
    return favorites.some(function (o2) {
      return o1.id === o2.id; // return the ones with equal id
    });
  });

  let allSections;
  try {
    allSections = await Section.findAll();
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const topicsWithSectionName = matchedTopics.map((topic) => {
    // console.log(topic);
    let sectionId;
    let sectionName;
    let chapterId;
    allSections.forEach((section) => {
      section.id === topic.SectionId
        ? ((sectionName = section.name),
          (sectionId = section.id),
          (chapterId = section.ChapterId))
        : '';
    });
    return {
      topicId: topic.id,
      topicTitle: topic.title,
      sectionId: sectionId,
      sectionName: sectionName,
      chapterId: chapterId,
    };
  });

  let allChapters;
  try {
    allChapters = await Chapter.findAll({ raw: true });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const topicsWithChapterName = topicsWithSectionName.map((topic) => {
    let chapterName;
    allChapters.forEach((chapter) => {
      topic.chapterId === chapter.id ? (chapterName = chapter.name) : '';
    });
    // console.log(chapterName);
    return {
      topicId: topic.topicId,
      topicTitle: topic.topicTitle,
      sectionName: topic.sectionName,
      chapterName: chapterName,
    };
  });

  res.status(201).json({ favorites: topicsWithChapterName });
};

// router.get('/student/favorite/:studentId/:topicId',)
const getSingleFavorite = async (req, res, next) => {
  const topicId = req.params.topicId;
  const studentId = req.params.studentId;
  console.log(studentId, topicId);

  let favorite;
  try {
    favorite = await Favorite.findOne({
      where: { UserStudentId: studentId, topicId: topicId },
    });
    if (!favorite) {
      throw new Error('Favorite item could not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ favorite: favorite });
};

// router.post('/student/favorite',)
const addFavorite = async (req, res, next) => {
  const { studentId, topicId } = req.body;

  let student;
  try {
    student = await UserStudent.findOne({ where: { id: studentId } });
    if (!student) {
      throw new Error('No student found for adding the favorite for.');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let topic;
  try {
    topic = await Topic.findOne({ where: { id: topicId } });
    if (!topic) {
      throw new Error('Topic could not found for adding as favorite.');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let favorite;
  try {
    favorite = await Favorite.create({
      UserStudentId: student.id,
      TopicId: topic.id,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ favorite: favorite });
};

// router.delete('/student/favorite/:studentId/:topicId',)
const deleteFavorite = async (req, res, next) => {
  const topicId = req.params.topicId;
  const studentId = req.params.studentId;

  try {
    const deletedFav = await Favorite.destroy({
      where: { topicId: topicId, UserStudentId: studentId },
    });
    if (!deletedFav) {
      throw new Error('Favorite could not found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ message: 'Removed from the favorite list' });
};

// ! Signup and login

// router.post('/student/signup',)
const signup = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, email, phone, password, grade, role } = req.body;

  try {
    const userExisting = await UserStudent.findOne({
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
    newUser = await UserStudent.create({
      name,
      email,
      phone,
      grade,
      password,
      role,
      image: req.file ? req.file.path : '',
      // image: 'demo path',
    });
  } catch (error) {
    console.log(error);
    return next(new CustomError(error.message, 422));
  }

  //  Finding the latest educator account
  const newStudent = await UserStudent.findOne({ where: { email: email } });

  // Adding the new account request into database
  let newStudentRequest;
  try {
    newStudentRequest = await newStudent.createAccReqStudent({
      role,
      name,
      email,
      phone,
    });
  } catch (error) {
    // deleting the new educator account from the UserStudent db table
    newUser.destroy();
    console.log(error);
    return next(new CustomError(error.message, 422));
  }

  let token;
  try {
    const userAfterCreatingAcc = await UserStudent.findOne({
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
  } catch (error) {
    console.log(error);
  }

  res.status(201).json({ user: newUser, token: token });
};

// router.patch('/student/edit-profile',)
const editProfile = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { stuId, name, email, phone, password } = req.body;

  try {
    const student = await UserStudent.findByPk(stuId);
    if (!student) {
      throw new Error('Student could not found for updating data');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newImage;
  if (req.file) {
    newImage = req.file.path !== '' ? req.file.path : student.image;
  }

  try {
    await UserStudent.update(
      { name, email, phone, password, image: newImage },
      {
        where: {
          id: stuId,
        },
      }
    );
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  let updatedStudent;
  try {
    updatedStudent = await UserStudent.findByPk(stuId);
    if (!updatedStudent) {
      throw new Error('Student could not found for updating data');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ updatedUser: updatedStudent });
};

// router.post('/student/login',)
const login = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }
  const { email, password } = req.body;

  const user = await UserStudent.findOne({ where: { email: email } });

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

// ! Quiz Answer
// router.post('/student/answer',)
const addAnswer = async (req, res, next) => {
  const { studentId, quizId } = req.body;

  // First find if already answer exist for this quiz attempted by the same student

  let existAnswer;
  try {
    existAnswer = await Answer.findOne({
      where: { UserStudentId: studentId, QuizId: quizId },
    });
    if (existAnswer) {
      throw new Error(
        'No need to create an Answer for this student and quiz combination'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let student;
  try {
    student = await UserStudent.findByPk(studentId);
    if (!student) {
      throw new Error('No student found for creating the Answer');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let answer;
  try {
    answer = await student.createAnswer();
    if (!answer) {
      throw new Error('Answer could not be created');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  answer.QuizId = quizId;
  answer.save();

  res.status(201).json({ answer: answer });
};

// router.post('/student/single-answer',)
const addSingleAnswer = async (req, res, next) => {
  const { answer, answerId, counter } = req.body;

  let masterAnswer;
  try {
    masterAnswer = await Answer.findOne({
      where: { id: answerId },
    });
    if (!masterAnswer) {
      throw new Error('No master answer found for adding the answer');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let existingSingleAnswers;
  try {
    existingSingleAnswers = await masterAnswer.getSingleAnswers();
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let singleAnswer;
  if (existingSingleAnswers.length > 0 && counter !== 99) {
    singleAnswer = existingSingleAnswers[counter];
    singleAnswer.answer = answer;
    singleAnswer.save();
  } else {
    try {
      singleAnswer = await masterAnswer.createSingleAnswer({
        answer,
      });
    } catch (error) {
      return next(new CustomError(error.message, 422));
    }
  }

  res.status(201).json({ singleAnswer: singleAnswer });
};

// router.get('/student/answer/:answerId',)
const getAnswer = async (req, res, next) => {
  const quizId = req.params.quizId;

  let masterAnswer;
  try {
    masterAnswer = await Answer.findOne({
      where: { QuizId: quizId },
    });
    if (!masterAnswer) {
      throw new Error('No master answer found');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ answer: masterAnswer });
};

// router.get('/student/answers/:answerId',)
const getAnswers = async (req, res, next) => {
  const answerId = req.params.answerId;

  let masterAnswer;
  try {
    masterAnswer = await Answer.findOne({
      where: { id: answerId },
    });
    if (!masterAnswer) {
      throw new Error('No master answer found for getting the answers');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let answers;
  try {
    answers = await masterAnswer.getSingleAnswers();
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ answers: answers });
};

// ! Quiz record

// router.post('/student/quiz-record',)
const addQuizRecord = async (req, res, next) => {
  const { studentId, quizId, subjectId, chapterId, sectionId, marks } =
    req.body;

  // First find if already QuizRecord exist for this quiz attempted by the same student

  let existRecord;
  try {
    existRecord = await QuizRecord.findOne({
      where: { UserStudentId: studentId, QuizId: quizId },
    });
    // if (existRecord) {
    //   throw new Error(
    //     'No need to create an QuizRecord for this student and quiz combination'
    //   );
    // }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newRecord;
  if (!existRecord) {
    let quiz;
    try {
      quiz = await Quiz.findByPk(quizId);
      if (!quiz) {
        throw new Error('No quiz found for creating the record');
      }
    } catch (error) {
      return next(new CustomError(error.message, 422));
    }

    try {
      newRecord = await quiz.createQuizRecord({
        subject: subjectId,
        chapter: chapterId,
        section: sectionId,
        marks: marks,
      });
      if (!newRecord) {
        throw new Error('Quiz record could not be created');
      }
    } catch (error) {
      return next(new CustomError(error.message, 422));
    }

    newRecord.UserStudentId = studentId;
    newRecord.save();
  } else {
    existRecord.marks = marks;
    existRecord.save();
  }

  res.status(201).json({ record: existRecord ? existRecord : newRecord });
};

// router.get('/student/quiz-records/:studentId/:subjectId/',)
const getQuizRecords = async (req, res, next) => {
  const studentId = req.params.studentId;
  const subjectId = req.params.subjectId;

  let records;
  try {
    records = await QuizRecord.findAll({
      where: { UserStudentId: studentId, subject: subjectId },
      raw: true,
    });
    if (!records) {
      throw new Error(
        'Quiz record could not found for this student and subject id'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const recordsWithNames = await Promise.all(
    records.map(async (record) => {
      const chapter = await Chapter.findByPk(record.chapter);
      const section = await Section.findByPk(record.section);

      return {
        id: record.id,
        subject: record.subject,
        chapter: chapter.name,
        section: section.name,
        marks: record.marks,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        UserStudentId: record.UserStudentId,
        QuizId: record.QuizId,
      };
    })
  );

  res.status(201).json({ records: recordsWithNames });
};

// router.get('/student/quiz-records-for-chapter/:studentId/:subjectId/:chapterId',)
const getQuizRecordsForChapter = async (req, res, next) => {
  const studentId = req.params.studentId;
  const subjectId = req.params.subjectId;
  const chapterId = req.params.chapterId;

  let totalSections;
  try {
    const sections = await Section.findAndCountAll({
      where: {
        ChapterId: chapterId,
      },
    });
    totalSections = sections.count;
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let records;
  try {
    records = await QuizRecord.findAll({
      where: {
        UserStudentId: studentId,
        subject: subjectId,
        chapter: chapterId,
      },
    });
    if (!records) {
      throw new Error(
        'Quiz record could not found for this student and subject id and chapter id'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ records: records, totalSections: totalSections });
};

// router.get('/student/quiz-record/:studentId/:sectionId/',)
const getQuizRecord = async (req, res, next) => {
  const studentId = req.params.studentId;
  const sectionId = req.params.sectionId;

  let quiz;
  try {
    quiz = await Quiz.findOne({
      where: { SectionId: sectionId },
    });
    if (!quiz) {
      throw new Error('Quiz could not found for this section');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let record;
  try {
    record = await QuizRecord.findOne({
      where: { UserStudentId: studentId, QuizId: quiz.id },
    });
    if (!record) {
      throw new Error(
        'Quiz record could not found for this student and quiz id'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ record: record });
};

// router.get('/student/quiz/:quizId',)
const getQuiz = async (req, res, next) => {
  const quizId = parseInt(req.params.quizId);

  let quiz;
  try {
    quiz = await Quiz.findByPk(quizId);
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

// ! Acc request status
exports.getAccReqStatus = getAccReqStatus;

// ! Subject Enrollment
exports.getEnrolledSubjects = getEnrolledSubjects;
exports.enrollSubject = enrollSubject;

// ! Signup and login
exports.signup = signup;
exports.editProfile = editProfile;
exports.login = login;

// ! Chapters
exports.getChapters = getChapters;

// ! Sections
exports.getSections = getSections;

// ! Topics
exports.getTopics = getTopics;
exports.getTopic = getTopic;

// ! Favorite
exports.getFavorites = getFavorites;
exports.getSingleFavorite = getSingleFavorite;
exports.addFavorite = addFavorite;
exports.deleteFavorite = deleteFavorite;

// ! Quiz Answer
exports.addAnswer = addAnswer;
exports.addSingleAnswer = addSingleAnswer;
exports.getAnswer = getAnswer;
exports.getAnswers = getAnswers;
exports.addQuizRecord = addQuizRecord;
exports.getQuizRecords = getQuizRecords;
exports.getQuizRecordsForChapter = getQuizRecordsForChapter;
exports.getQuizRecord = getQuizRecord;
exports.getQuiz = getQuiz;
