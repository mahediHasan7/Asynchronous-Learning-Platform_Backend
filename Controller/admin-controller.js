const CustomError = require('../Model/Error');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { v4 } = require('uuid');

const Subject = require('../Model/Subject');
const Chapter = require('../Model/Chapter');
const Section = require('../Model/Section');
const UserAdmin = require('../Model/UserAdmin');
const AccReqEducator = require('../Model/AccReqEducator');
const AccReqStudent = require('../Model/AccReqStudent');
const Topic = require('../Model/Topic');
const AccReqParent = require('../Model/AccReqParent');

// ! Dashboard Topic list

// router.get('/admin/topics/',)
const getTopicsForDashboard = async (req, res, next) => {
  let topics;
  try {
    topics = await Topic.findAll({ limit: 10, order: [['createdAt', 'DESC']] });
    if (!topics) {
      throw new Error('Topic list not found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  const topicsWithSubInfo = await Promise.all(
    topics.map(async (topic) => {
      const section = await Section.findByPk(topic.SectionId);
      const chapter = await Chapter.findByPk(section.ChapterId);
      const subject = await Subject.findByPk(chapter.SubjectId);

      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        lectureNote: topic.lectureNote,
        content: topic.content,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        SectionId: topic.SectionId,
        subject: subject.name,
        grade: subject.grade,
        educator: subject.educator,
      };
    })
  );

  res.status(201).json({ topics: topicsWithSubInfo });
};

// ! Subjects

// router.get('/admin/subjects')
const getSubjects = async (req, res, next) => {
  const subjects = await Subject.findAll();

  res.status(200).json({ subjects: subjects });
};

// router.post('/admin/subjects',)
const addSubject = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, code, grade, description } = req.body;

  try {
    const subjectExisting = await Subject.findOne({ where: { code: code } });
    if (subjectExisting) {
      throw new Error(
        'Subject already exists with this code. Please try adding a new subject'
      );
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newSubject;
  try {
    newSubject = await Subject.create({
      name,
      code,
      grade,
      description,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ subject: newSubject });
};

// router.patch('/admin/subjects',)
const editSubject = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { id, name, code, grade, description } = req.body;

  let subject;
  try {
    subject = await Subject.findOne({ where: { id: id } });
    if (!subject) {
      throw new Error('No subject found for updating');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  subject.set({
    name,
    code,
    grade,
    description,
  });

  await subject.save();

  res.status(201).json({ subject: subject });
};

// router.delete('/admin/subject/:subId',)
const deleteSubject = async (req, res, next) => {
  const id = req.params.subId;

  try {
    const subject = await Subject.findOne({ where: { id: id } });
    if (!subject) {
      throw new Error('No subject found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  try {
    Subject.destroy({
      where: {
        id: id,
      },
    });
  } catch (error) {
    return next(new CustomError(error.message, 404));
  }

  res.status(201).json({ message: 'Subject has been deleted' });
};

// !Chapters

// router.get('/admin/chapters/:subjectId')
const getChapters = async (req, res, next) => {
  const subId = req.params.subjectId;

  const chapters = await Chapter.findAll({ where: { subjectId: subId } });

  res.status(200).json({ chapters: chapters });
};

// router.post('/admin/chapters',)
const addChapter = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, subId } = req.body;

  let subject;
  try {
    subject = await Subject.findOne({ where: { id: subId } });
    if (!subject) {
      throw new Error('No subject found for adding the chapter');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newChapter;
  try {
    newChapter = await subject.createChapter({
      name,
    });
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ chapter: newChapter });
};

// router.patch('/admin/chapters',)
const editChapter = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, chapterId } = req.body;
  console.log(name, chapterId);
  let chapter;
  try {
    chapter = await Chapter.findOne({ where: { id: chapterId } });
    if (!chapter) {
      throw new Error('No chapter found for editing');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  chapter.set({
    name,
  });

  await chapter.save();

  res.status(201).json({ chapter: chapter });
};

// router.delete('/admin/chapter/:chapterId',)
const deleteChapter = async (req, res, next) => {
  const chapterId = req.params.chapterId;

  let chapter;
  try {
    chapter = await Chapter.findOne({ where: { id: chapterId } });
    if (!chapter) {
      throw new Error('No chapter found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  chapter.destroy();

  res.status(201).json({ message: 'The chapter has been deleted' });
};

// !Section

// router.get('/admin/sections/:chapterId')
const getSections = async (req, res, next) => {
  const chapterId = req.params.chapterId;

  const sections = await Section.findAll({ where: { chapterId: chapterId } });

  res.status(200).json({ sections: sections });
};

// router.post('/admin/sections',)
const addSection = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, chapterId } = req.body;

  let chapter;
  try {
    chapter = await Chapter.findOne({
      where: { id: chapterId },
    });
    if (!chapter) {
      throw new Error('No chapter found for adding the section');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newSection;
  try {
    newSection = await chapter.createSection({
      name,
    });

    chapter.totalSections++;
    chapter.save();
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ section: newSection });
};

// router.patch('/admin/sections',)
const editSection = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, sectionId } = req.body;

  let section;
  try {
    section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new Error('No section found for editing');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  section.set({
    name,
  });

  await section.save();

  res.status(201).json({ section: section });
};

// router.delete('/admin/sections/:sectionId',)
const deleteSection = async (req, res, next) => {
  const sectionId = req.params.sectionId;

  let section;
  try {
    section = await Section.findOne({ where: { id: sectionId } });
    if (!section) {
      throw new Error('No section found for deleting');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  section.destroy();

  res.status(201).json({ message: 'The section has been deleted' });
};

// ! Topics

// router.get('/admin/topics/:sectionId',)
const getTopics = async (req, res, next) => {
  const sectionId = req.params.sectionId;

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

  const topicsWithProperContent = await Promise.all(
    topics.map(async (topic) => {
      // Converting Content json file to object
      let rawContent = fs.readFileSync(path.resolve(topic.content));
      let parsedContent = JSON.parse(rawContent);
      // console.log(parsedContent);
      return {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        lectureNote: topic.lectureNote,
        content: parsedContent,
        createdAt: topic.createdAt,
        updatedAt: topic.updatedAt,
        SectionId: topic.SectionId,
      };
    })
  );

  res.status(201).json({ topics: topicsWithProperContent });
};

// router.delete('/admin/topic/:topicId',)
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

// ! Account Requests from Educator

// router.get('/admin/educator-requests',)
const getEducatorRequests = async (req, res, next) => {
  let accReqsFromEducator;
  try {
    accReqsFromEducator = await AccReqEducator.findAll();
    if (!accReqsFromEducator) {
      throw new Error('No requests found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ eduAccReq: accReqsFromEducator });
};

// router.patch('/admin/educator-requests',)
const handleEducatorRequests = async (req, res, next) => {
  const { userId, action } = req.body;

  let accReqFromEducator;
  try {
    accReqFromEducator = await AccReqEducator.findOne({
      where: { usereducatorId: userId },
    });
    if (!accReqFromEducator) {
      throw new Error('Educator account request could not found!');
    }

    if (action === 'approved') {
      accReqFromEducator.approval = 'approved';
      accReqFromEducator.save();
    } else {
      accReqFromEducator.approval = 'declined';
      accReqFromEducator.save();
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ accReq: accReqFromEducator });
};

// ! Account Requests from Student

// router.get('/admin/student-requests',)
const getStudentRequests = async (req, res, next) => {
  let accReqsFromStudent;
  try {
    accReqsFromStudent = await AccReqStudent.findAll();
    if (!accReqsFromStudent) {
      throw new Error('No requests found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ stuAccReq: accReqsFromStudent });
};

// router.patch('/admin/student-requests',)
const handleStudentRequests = async (req, res, next) => {
  const { userId, action } = req.body;

  let accReqFromStudent;
  try {
    accReqFromStudent = await AccReqStudent.findOne({
      where: { userstudentId: userId },
    });
    if (!accReqFromStudent) {
      throw new Error('Student account request could not found!');
    }

    if (action === 'approved') {
      accReqFromStudent.approval = 'approved';
      accReqFromStudent.save();
    } else {
      accReqFromStudent.approval = 'declined';
      accReqFromStudent.save();
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ accReq: accReqFromStudent });
};

// ! Account Requests from Parents

// router.get('/admin/parent-requests',)
const getParentRequests = async (req, res, next) => {
  let accReqsFromParent;
  try {
    accReqsFromParent = await AccReqParent.findAll();
    if (!accReqsFromParent) {
      throw new Error('No requests found!');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ parentAccReq: accReqsFromParent });
};

// router.patch('/admin/parent-requests',)
const handleParentRequests = async (req, res, next) => {
  const { userId, action } = req.body;

  let accReqFromParent;
  try {
    accReqFromParent = await AccReqParent.findOne({
      where: { UserParentId: userId },
    });
    if (!accReqFromParent) {
      throw new Error('Parent account request could not found!');
    }

    if (action === 'approved') {
      accReqFromParent.approval = 'approved';
      accReqFromParent.save();
    } else {
      accReqFromParent.approval = 'declined';
      accReqFromParent.save();
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ accReq: accReqFromParent });
};

// ! Signup and Login

// router.post('/admin/signup',)
const signup = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { name, email, phone, password, role } = req.body;

  try {
    const userExisting = await UserAdmin.findOne({ where: { email: email } });
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
    newUser = await UserAdmin.create({
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

  let token;
  try {
    const userAfterCreatingAcc = await UserAdmin.findOne({
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

// router.patch('/admin/edit-profile',)
const editProfile = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }

  const { adminId, name, email, phone, password } = req.body;

  try {
    const admin = await UserAdmin.findByPk(adminId);
    if (!admin) {
      throw new Error('Admin could not found for updating data');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  let newImage;
  if (req.file) {
    newImage = req.file.path !== '' ? req.file.path : admin.image;
  }

  try {
    await UserAdmin.update(
      { name, email, phone, password, image: newImage },
      {
        where: {
          id: adminId,
        },
      }
    );
  } catch (error) {
    return next(new CustomError(error, 404));
  }

  let updatedAdmin;
  try {
    updatedAdmin = await UserAdmin.findByPk(adminId);
    if (!updatedAdmin) {
      throw new Error('Admin could not found for returning');
    }
  } catch (error) {
    return next(new CustomError(error.message, 422));
  }

  res.status(201).json({ updatedUser: updatedAdmin });
};

// login
const login = async (req, res, next) => {
  const validationError = validationResult(req);

  if (!validationError.isEmpty()) {
    return next(new CustomError('Input data are not valid!', 422));
  }
  const { email, password } = req.body;

  const user = await UserAdmin.findOne({ where: { email: email } });

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

exports.getTopicsForDashboard = getTopicsForDashboard;

exports.getSubjects = getSubjects;
exports.addSubject = addSubject;
exports.editSubject = editSubject;
exports.deleteSubject = deleteSubject;

exports.getChapters = getChapters;
exports.addChapter = addChapter;
exports.editChapter = editChapter;
exports.deleteChapter = deleteChapter;

exports.getSections = getSections;
exports.addSection = addSection;
exports.editSection = editSection;
exports.deleteSection = deleteSection;

exports.getTopics = getTopics;
exports.deleteTopic = deleteTopic;

exports.getEducatorRequests = getEducatorRequests;
exports.handleEducatorRequests = handleEducatorRequests;
exports.getStudentRequests = getStudentRequests;
exports.handleStudentRequests = handleStudentRequests;
exports.getParentRequests = getParentRequests;
exports.handleParentRequests = handleParentRequests;

exports.signup = signup;
exports.editProfile = editProfile;
exports.login = login;
