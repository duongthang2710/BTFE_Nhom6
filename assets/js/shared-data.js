(function () {
  const KEYS = {
    exams: "fe01_exams",
    students: "fe01_students",
    results: "fe01_student_results",
  };

  const defaultExams = [
    {
      id: 1,
      name: "Luyện tập OOP Java",
      description: "Bài luyện tập tự do cho sinh viên ôn tập Java OOP.",
      category: "practice",
      categoryText: "Luyện tập",
      type: "free",
      duration: 25,
      startTime: "",
      room: "Trực tuyến",
      status: "active",
      questions: [
        {
          content: "Từ khóa nào dùng để tạo lớp trong Java?",
          answers: { A: "class", B: "new", C: "struct", D: "object" },
          correct: "A",
          explanation: "Java dùng từ khóa class để khai báo lớp.",
        },
        {
          content: "Tính đóng gói trong OOP là gì?",
          answers: {
            A: "Ẩn dữ liệu và cung cấp phương thức truy cập",
            B: "Kế thừa class",
            C: "Ghi đè phương thức",
            D: "Tạo nhiều đối tượng",
          },
          correct: "A",
          explanation:
            "Đóng gói giúp ẩn dữ liệu và truy cập qua getter/setter.",
        },
      ],
    },
    {
      id: 2,
      name: "Thi giữa kỳ Cơ sở dữ liệu",
      description: "Bài thi giữa kỳ CSDL gồm các câu hỏi SQL cơ bản.",
      category: "midterm",
      categoryText: "Giữa kỳ",
      type: "scheduled",
      duration: 60,
      startTime: "2026-03-10T08:00",
      room: "P.301 - A2",
      status: "active",
      questions: [
        {
          content: "SQL là viết tắt của gì?",
          answers: {
            A: "Strong Query Language",
            B: "Structured Query Language",
            C: "Simple Query Language",
            D: "Standard Query Language",
          },
          correct: "B",
          explanation: "SQL là Structured Query Language.",
        },
        {
          content: "Lệnh nào dùng để lấy dữ liệu từ bảng?",
          answers: { A: "GET", B: "OPEN", C: "SELECT", D: "READ" },
          correct: "C",
          explanation: "SELECT dùng để truy vấn dữ liệu.",
        },
      ],
    },
    {
      id: 3,
      name: "Thi cuối kỳ Mạng máy tính",
      description: "Bài thi cuối kỳ môn Mạng máy tính.",
      category: "final",
      categoryText: "Cuối kỳ",
      type: "scheduled",
      duration: 90,
      startTime: "2026-03-18T13:30",
      room: "P.205 - A1",
      status: "active",
      questions: [
        {
          content: "Mô hình OSI có bao nhiêu tầng?",
          answers: { A: "5", B: "6", C: "7", D: "8" },
          correct: "C",
          explanation: "Mô hình OSI có 7 tầng.",
        },
        {
          content: "IPv4 có bao nhiêu bit?",
          answers: { A: "16", B: "32", C: "64", D: "128" },
          correct: "B",
          explanation: "IPv4 gồm 32 bit.",
        },
      ],
    },
  ];

  const defaultStudents = [
    {
      id: "B21DCCN001",
      name: "Nguyễn Văn An",
      class: "D21CQCN01-B",
      email: "annv.b21cn001@stu.ptit.edu.vn",
      avatar: "NA",
      username: "student",
      password: "123456",
    },
    {
      id: "B21DCCN002",
      name: "Trần Thị Bình",
      class: "D21CQCN01-B",
      email: "binhtt.b21cn002@stu.ptit.edu.vn",
      avatar: "TB",
      username: "binh",
      password: "123456",
    },
  ];

  const defaultResults = {
    B21DCCN001: [
      {
        examId: 2,
        examName: "Thi giữa kỳ Cơ sở dữ liệu",
        date: "10/03/2026 08:00",
        room: "P.301 - A2",
        timeSpent: "46 phút",
        totalQuestions: 2,
        correctAnswers: 1,
        score: 5,
        status: "passed",
        questions: [
          {
            content: "SQL là viết tắt của gì?",
            answers: {
              A: "Strong Query Language",
              B: "Structured Query Language",
              C: "Simple Query Language",
              D: "Standard Query Language",
            },
            correct: "B",
            selected: "B",
            explanation: "SQL là Structured Query Language.",
          },
          {
            content: "Lệnh nào dùng để lấy dữ liệu từ bảng?",
            answers: { A: "GET", B: "OPEN", C: "SELECT", D: "READ" },
            correct: "C",
            selected: "A",
            explanation: "SELECT dùng để truy vấn dữ liệu.",
          },
        ],
      },
    ],
    B21DCCN002: [],
  };

  const safeParse = (value, fallback) => {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  };

  const read = (key, fallback) =>
    safeParse(localStorage.getItem(key), fallback);
  const write = (key, value) =>
    localStorage.setItem(key, JSON.stringify(value));

  const ensureSeed = () => {
    if (!localStorage.getItem(KEYS.exams)) write(KEYS.exams, defaultExams);
    if (!localStorage.getItem(KEYS.students))
      write(KEYS.students, defaultStudents);
    if (!localStorage.getItem(KEYS.results))
      write(KEYS.results, defaultResults);
  };

  const toLetter = (index) => ["A", "B", "C", "D"][index] || "A";

  const buildDashboardStats = () => {
    const exams = read(KEYS.exams, defaultExams);
    const students = read(KEYS.students, defaultStudents);
    const results = read(KEYS.results, defaultResults);

    const allAttempts = Object.values(results).flat();
    const totalAttempts = allAttempts.length;
    const avgScore =
      totalAttempts > 0
        ? Number(
            (
              allAttempts.reduce(
                (sum, item) => sum + Number(item.score || 0),
                0,
              ) / totalAttempts
            ).toFixed(2),
          )
        : 0;

    const completionRate =
      students.length * exams.length > 0
        ? Math.round((totalAttempts / (students.length * exams.length)) * 100)
        : 0;

    return {
      totalStudents: students.length,
      totalExams: exams.length,
      totalAttempts,
      avgScore,
      completionRate,
    };
  };

  ensureSeed();

  window.FE01Store = {
    getExams() {
      return read(KEYS.exams, defaultExams);
    },
    setExams(exams) {
      write(KEYS.exams, exams);
      return exams;
    },
    getExamById(id) {
      return this.getExams().find((exam) => Number(exam.id) === Number(id));
    },
    getStudents() {
      return read(KEYS.students, defaultStudents);
    },
    setStudents(students) {
      write(KEYS.students, students);
      return students;
    },
    addStudent(student) {
      const students = this.getStudents();
      students.push(student);
      this.setStudents(students);
      return student;
    },
    getStudentResults() {
      return read(KEYS.results, defaultResults);
    },
    setStudentResults(results) {
      write(KEYS.results, results);
      return results;
    },
    appendResult(studentId, result) {
      const results = this.getStudentResults();
      if (!results[studentId]) results[studentId] = [];
      results[studentId].unshift(result);
      this.setStudentResults(results);
      return result;
    },
    mapExamQuestionToRuntime(question) {
      const options = [
        question.answers.A,
        question.answers.B,
        question.answers.C,
        question.answers.D,
      ];
      const correctIndex = ["A", "B", "C", "D"].indexOf(question.correct);
      return {
        text: question.content,
        options,
        correct: correctIndex < 0 ? 0 : correctIndex,
        explain: question.explanation || "",
      };
    },
    mapRuntimeToResultQuestion(runtimeQuestion, selectedAnswer) {
      return {
        content: runtimeQuestion.text,
        answers: {
          A: runtimeQuestion.options[0],
          B: runtimeQuestion.options[1],
          C: runtimeQuestion.options[2],
          D: runtimeQuestion.options[3],
        },
        correct: toLetter(runtimeQuestion.correct),
        selected: selectedAnswer === null ? "" : toLetter(selectedAnswer),
        explanation: runtimeQuestion.explain || "",
      };
    },
    getDashboardStats() {
      return buildDashboardStats();
    },
  };
})();
