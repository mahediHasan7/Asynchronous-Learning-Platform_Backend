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
const UserParent = require('../Model/UserParent');
const EducatorSubject = require('../Model/EducatorSubject');
const UserEducator = require('../Model/UserEducator');
const AccReqParent = require('../Model/AccReqParent');

// ! Acc request status

// router.get('/parent/acc-status/:parentId',)
const getAccReqStatus = async (req, res, next) => {
  const parentId = req.params.parentId;

  let accReq;
  try {
    accReq = await AccReqParent.findOne({
      where: { UserParentId: parentId },
    });
    if (!accReq) {
      throw new Error('The parent acc request could not found!');
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

// ! Signup and login

// router.post('/parent/signup',)
const signup = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, email, phone, password, studentId, role } = req.body;

  console.log(name, email, phone, password, studentId, role);
  try {
    const userExisting = await UserParent.findOne({
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

  try {
    const existingStudent = await UserStudent.findByPk(studentId);
    if (!existingStudent) {
      throw new Error('Provided Student Id is not registered with the system.');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newUser;
  try {
    newUser = await UserParent.create({
      name,
      email,
      phone,
      studentId,
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
  const newParent = await UserParent.findOne({ where: { email: email } });

  // Adding the new account request into database
  let newParentRequest;
  try {
    const student = await UserStudent.findByPk(studentId);

    newParentRequest = await newParent.createAccReqParent({
      role,
      name,
      email,
      phone,
      studentId,
      studentName: student.name,
    });
  } catch (error) {
    // deleting the new educator account from the UserStudent table
    newUser.destroy();
    console.log(error);
    return next(new CustomError(error.message, 422));
  }

  let token;
  try {
    const userAfterCreatingAcc = await UserParent.findOne({
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

// router.patch('/parent/edit-profile',)
const editProfile = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { parentId, name, email, phone, password } = req.body;

  let parent;
  try {
    parent = await UserParent.findByPk(parentId);
    if (!parent) {
      throw new Error('Parent could not found for updating data');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newImage;
  if (req.file) {
    newImage = req.file.path !== '' ? req.file.path : parent.image;
  }

  try {
    await UserParent.update(
      { name, email, phone, password, image: newImage },
      {
        where: {
          id: parentId,
        },
      }
    );
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  let updatedParent;
  try {
    updatedParent = await UserParent.findByPk(parentId);
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ updatedUser: updatedParent });
};

// router.post('/parent/login',)
const login = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }
  const { email, password } = req.body;

  const user = await UserParent.findOne({ where: { email: email } });

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

// ! Student Progress

// router.get('/parent/student-progress/:studentId',)
const getStudentProgress = async (req, res, next) => {
  const studentId = req.params.studentId;

  const studentSubjects = await StudentSubject.findAll({
    where: { UserStudentId: studentId },
  });

  const subjects = await Promise.all(
    studentSubjects.map(async (stuSubject) => {
      const subject = await Subject.findByPk(stuSubject.SubjectId);
      return subject;
    })
  );

  const chaptersOfAllSubjects = await Promise.all(
    subjects.map(async (subject) => {
      const chapters = await Chapter.findAndCountAll({
        where: { SubjectId: subject.id },
      });
      return {
        subject: subject.name,
        totalChapters: chapters.count,
        chapters: chapters,
      };
    })
  );

  const sectionsOfAllSubjects = await Promise.all(
    chaptersOfAllSubjects.map(async (chaptersOfOneSub) => {
      const sectionsOfOneSub = await Promise.all(
        chaptersOfOneSub.chapters.rows.map(async (chapter) => {
          const sections = await Section.findAndCountAll({
            where: { ChapterId: chapter.id },
          });
          return sections;
        })
      );

      return {
        subject: chaptersOfOneSub.subject,
        totalChapters: chaptersOfOneSub.totalChapters,
        sections: sectionsOfOneSub,
      };
    })
  );

  const topicsOfAllSubjects = await Promise.all(
    sectionsOfAllSubjects.map(async (sectionsOfOneSub) => {
      const sectionsOfOneChapter = await Promise.all(
        sectionsOfOneSub.sections.map(async (section) => {
          const topicsOfOneSection = await Promise.all(
            section.rows.map(async (section) => {
              const topics = await Topic.findAndCountAll({
                where: { SectionId: section.id },
              });
              return topics.count;
            })
          );
          return topicsOfOneSection;
        })
      );

      return {
        subject: sectionsOfOneSub.subject,
        totalChapters: sectionsOfOneSub.totalChapters,
        topics: sectionsOfOneChapter,
      };
    })
  );

  const totalTopicsOfAllSubjects = topicsOfAllSubjects.map((topicsOfOneSub) => {
    let totalTopics = 0;
    const total = topicsOfOneSub.topics.forEach((topic) => {
      const sum = topic.reduce((pv, cv) => pv + cv, 0);
      totalTopics += sum;
    });
    return {
      subject: topicsOfOneSub.subject,
      totalChapters: topicsOfOneSub.totalChapters,
      totalTopics: totalTopics,
    };
  });

  const sectionsOfAllSubjects_OnlyCounts = await Promise.all(
    sectionsOfAllSubjects.map(async (sectionsOfOneSub) => {
      const totalSectionsOfOneSub = await Promise.all(
        sectionsOfOneSub.sections.map(async (section) => {
          return section.count;
        })
      );
      return {
        subject: sectionsOfOneSub.subject,
        totalChapters: sectionsOfOneSub.totalChapters,
        sectionsCounts: totalSectionsOfOneSub,
      };
    })
  );

  const totalSectionsOfAllSubjects = sectionsOfAllSubjects_OnlyCounts.map(
    (oneSub) => {
      const total = oneSub.sectionsCounts.reduce((prev, curr) => {
        return prev + curr;
      }, 0);
      return {
        subject: oneSub.subject,
        totalChapters: oneSub.totalChapters,
        totalSections: total,
        total: total,
      };
    }
  );

  // Finding the quiz Records for the student for all his enrolled subjects
  const quizRecordsOfAllSubjects = await Promise.all(
    subjects.map(async (subject) => {
      const quizRecordsOfOneSubject = await QuizRecord.findAll({
        where: { subject: subject.id, UserStudentId: studentId },
      });
      return quizRecordsOfOneSubject;
    })
  );

  const quizRecordsOfAllSubjects_OnlyMarks = await Promise.all(
    quizRecordsOfAllSubjects.map(async (recordsOfOneSub) => {
      const totalSectionsOfOneSub = await Promise.all(
        recordsOfOneSub.map(async (record) => {
          return record.marks;
        })
      );
      return totalSectionsOfOneSub;
    })
  );

  const totalMarksOfAllSubjects = quizRecordsOfAllSubjects_OnlyMarks.map(
    (oneSub) => {
      const total = oneSub.reduce((prev, curr) => {
        return prev + curr;
      }, 0);
      return total;
    }
  );

  // progress In percentage
  const progressOfAllSubjects = totalSectionsOfAllSubjects.map(
    (totalSectionsOfOneSubject, index, arr) => {
      const totalMarks = totalSectionsOfOneSubject.total * 10;
      const totalAchievedMarks = totalMarksOfAllSubjects[index];
      const percentage = Math.round((totalAchievedMarks / totalMarks) * 100);
      return {
        subject: totalSectionsOfOneSubject.subject,
        totalChapters: totalSectionsOfOneSubject.totalChapters,
        totalSections: totalSectionsOfOneSubject.totalSections,
        progress: percentage,
      };
    }
  );

  // Adding the total topics with  the progressOfAllSubjects
  const progressOfAllSubjectsWithTotalTopics = progressOfAllSubjects.map(
    (progressOfOneSubject, index, arr) => {
      let totalTopicsOfOneSub;
      if (
        totalTopicsOfAllSubjects[index].subject ===
          progressOfOneSubject.subject &&
        totalTopicsOfAllSubjects[index].chapter === progressOfOneSubject.chapter
      ) {
        totalTopicsOfOneSub = totalTopicsOfAllSubjects[index].totalTopics;
      }
      return {
        subject: progressOfOneSubject.subject,
        totalChapters: progressOfOneSubject.totalChapters,
        totalSections: progressOfOneSubject.totalSections,
        totalTopics: totalTopicsOfOneSub ? totalTopicsOfOneSub : undefined,
        progress: progressOfOneSubject.progress,
      };
    }
  );

  // res.status(201).json({ progress: progressOfAllSubjects });
  res.status(201).json({ progress: progressOfAllSubjectsWithTotalTopics });
};

// ! Student details

// router.get('/parent/student-details/:studentId',)
const getStudentDetails = async (req, res, next) => {
  const studentId = req.params.studentId;

  const student = await UserStudent.findByPk(studentId);

  res.status(201).json({ student: student });
};

// ! Quiz Records

// router.get('/quiz-records/subjects/:studentId',)
const getSubjects = async (req, res, next) => {
  const studentId = req.params.studentId;

  const studentSubjects = await StudentSubject.findAll({
    where: { UserStudentId: studentId },
  });

  const subjects = await Promise.all(
    studentSubjects.map(async (stuSubject) => {
      const subject = await Subject.findByPk(stuSubject.SubjectId);
      return subject;
    })
  );

  res.status(201).json({ subjects: subjects });
};

// ! Contacts

// router.get('/parent/get-contacts/:studentId',)
const getContacts = async (req, res, next) => {
  const studentId = req.params.studentId;

  const studentSubjects = await StudentSubject.findAll({
    where: { UserStudentId: studentId },
  });

  const educatorsWithSubject = await Promise.all(
    studentSubjects.map(async (stSubject) => {
      const educatorSubject = await EducatorSubject.findOne({
        where: { SubjectId: stSubject.SubjectId },
      });

      const subject = await Subject.findByPk(stSubject.SubjectId);
      return {
        subject: subject.name,
        educatorId: educatorSubject.UserEducatorId,
      };
    })
  );

  const educators = await Promise.all(
    educatorsWithSubject.map(async (educatorWithSub) => {
      const educator = await UserEducator.findByPk(educatorWithSub.educatorId);
      return {
        subject: educatorWithSub.subject,
        educator: educator,
      };
    })
  );

  res.status(201).json({ contacts: educators });
};

// ! Signup and login
exports.signup = signup;
exports.editProfile = editProfile;
exports.login = login;

// ! Student Details
exports.getStudentDetails = getStudentDetails;

// ! Contacts
exports.getContacts = getContacts;

// ! Student Progress
exports.getStudentProgress = getStudentProgress;

// ! Acc request status
exports.getAccReqStatus = getAccReqStatus;

// ! Quiz Records

exports.getSubjects = getSubjects;
