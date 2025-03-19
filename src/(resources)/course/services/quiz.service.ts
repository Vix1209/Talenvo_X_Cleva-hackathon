import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Quiz } from '../entities/quiz.entity';
import { Course } from '../entities/course.entity';
import { CreateQuizDto, UpdateQuizDto } from '../dto/quiz.dto';
import { QuizSubmission } from '../entities/quiz-submission.entity';
import { SubmitQuizDto } from '../dto/quiz-submission.dto';
import { User } from '../../users/entities/user.entity';
import { StudentProfile } from '../../users/entities/user-profile.entity';

@Injectable()
export class QuizService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    @InjectRepository(QuizSubmission)
    private readonly quizSubmissionRepository: Repository<QuizSubmission>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private readonly studentProfileRepository: Repository<StudentProfile>,
  ) {}

  async createQuiz(createQuizDto: CreateQuizDto) {
    const course = await this.courseRepository.findOne({
      where: { id: createQuizDto.courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const assessmentData = createQuizDto.assessment.map((question) => ({
      question: question.question,
      options: [...question.options],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    }));

    const quiz = this.quizRepository.create({
      title: createQuizDto.title,
      description: createQuizDto.description,
      assessment: assessmentData,
      duration: createQuizDto.duration,
      course,
      courseId: course.id,
    });

    return await this.quizRepository.save(quiz);
  }

  async getQuizzes(courseId: string) {
    return await this.quizRepository.find({
      where: { course: { id: courseId } },
    });
  }

  async getQuiz(quizId: string) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    return quiz;
  }

  async updateQuiz(quizId: string, updateQuizDto: UpdateQuizDto) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    if (updateQuizDto.title) quiz.title = updateQuizDto.title;
    if (updateQuizDto.description) quiz.description = updateQuizDto.description;
    if (updateQuizDto.duration) quiz.duration = updateQuizDto.duration;

    if (updateQuizDto.assessment && updateQuizDto.assessment.length > 0) {
      const assessmentData = updateQuizDto.assessment.map((question) => ({
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      }));

      quiz.assessment = assessmentData;
    }

    return await this.quizRepository.save(quiz);
  }

  async deleteQuiz(quizId: string) {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    await this.quizRepository.remove(quiz);
    return { message: 'Quiz deleted successfully' };
  }

  // Quiz Submission Methods
  async submitQuiz(submitQuizDto: SubmitQuizDto, userId: string) {
    // Get the quiz
    const quiz = await this.quizRepository.findOne({
      where: { id: submitQuizDto.quizId },
    });

    if (!quiz) {
      throw new NotFoundException('Quiz not found');
    }

    // Get the user
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Process the submission and calculate the score
    const processedAnswers = submitQuizDto.answers.map((answer) => {
      const questionData = quiz.assessment.find(
        (q) => q.question === answer.questionText,
      );

      if (!questionData) {
        throw new BadRequestException(
          `Question "${answer.questionText}" not found in quiz`,
        );
      }

      const isCorrect = questionData.correctAnswer === answer.selectedAnswer;

      return {
        questionId: quiz.assessment.indexOf(questionData).toString(),
        questionText: answer.questionText,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: questionData.correctAnswer,
        isCorrect,
      };
    });

    const totalQuestions = quiz.assessment.length;
    const correctAnswers = processedAnswers.filter((a) => a.isCorrect).length;
    const score = (correctAnswers / totalQuestions) * 100;

    // Create the submission
    const quizSubmission = this.quizSubmissionRepository.create({
      quiz,
      quizId: quiz.id,
      student: user,
      studentId: user.id,
      answers: processedAnswers,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken: submitQuizDto.timeTaken || 0,
      isCompleted: true,
    });

    // Save the submission
    await this.quizSubmissionRepository.save(quizSubmission);

    // Update the student's average quiz score
    await this.updateStudentQuizScores(user.id);

    // Return the submission with calculated data
    return {
      id: quizSubmission.id,
      quizId: quiz.id,
      studentId: user.id,
      score,
      totalQuestions,
      correctAnswers,
      timeTaken: quizSubmission.timeTaken,
      answers: processedAnswers,
      createdAt: quizSubmission.createdAt,
    };
  }

  async getStudentQuizSubmissions(userId: string) {
    const submissions = await this.quizSubmissionRepository.find({
      where: { studentId: userId },
      relations: {
        quiz: true,
      },
      order: { createdAt: 'DESC' },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      quizId: submission.quizId,
      quizTitle: submission.quiz.title,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      timeTaken: submission.timeTaken,
      createdAt: submission.createdAt,
    }));
  }

  async getQuizSubmission(submissionId: string) {
    const submission = await this.quizSubmissionRepository.findOne({
      where: { id: submissionId },
      relations: ['quiz', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('Quiz submission not found');
    }

    return {
      id: submission.id,
      quizId: submission.quizId,
      quizTitle: submission.quiz.title,
      studentId: submission.studentId,
      studentName: `${submission.student.firstName} ${submission.student.lastName}`,
      score: submission.score,
      totalQuestions: submission.totalQuestions,
      correctAnswers: submission.correctAnswers,
      timeTaken: submission.timeTaken,
      answers: submission.answers,
      createdAt: submission.createdAt,
    };
  }

  async updateStudentQuizScores(studentId: string) {
    // Get all submissions for this student
    const submissions = await this.quizSubmissionRepository.find({
      where: { studentId },
    });

    if (submissions.length === 0) {
      return; // No submissions yet
    }

    // Calculate average score
    const totalScore = submissions.reduce(
      (sum, submission) => sum + submission.score,
      0,
    );
    const averageScore = totalScore / submissions.length;

    // Update student profile
    const studentProfile = await this.studentProfileRepository.findOne({
      where: { user: { id: studentId } },
    });

    if (studentProfile) {
      studentProfile.averageQuizScore = `${averageScore.toFixed(1)}%`;
      await this.studentProfileRepository.save(studentProfile);
    }

    return averageScore;
  }
}
