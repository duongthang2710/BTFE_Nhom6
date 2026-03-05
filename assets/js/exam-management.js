let currentQuestions = [];
let deleteTarget = null;
let deleteType = "";

const store = window.FE01Store;

const getExams = () => store.getExams();
const setExams = (exams) => store.setExams(exams);

document.addEventListener("DOMContentLoaded", function () {
  setupLogout();
  renderExamTable();
  renderStudentsTable();
  setupEventListeners();
  applyInitialRouteParams();
});

function applyInitialRouteParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab");
  const examId = params.get("examId");

  if (tab) {
    switchTab(tab);
  }

  if (examId) {
    editExam(Number(examId));
  }
}

function setupLogout() {
  const logout = document.querySelector('[data-logout="admin"]');
  logout?.addEventListener("click", (event) => {
    event.preventDefault();
    localStorage.removeItem("fe01_admin_logged_in");
    window.location.href = "admin-login.html";
  });
}

function setupEventListeners() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      switchTab(this.dataset.tab);
    });
  });

  document.getElementById("examType")?.addEventListener("change", function () {
    document.getElementById("timedFields").style.display =
      this.value === "scheduled" ? "" : "none";
  });

  document.getElementById("searchExam")?.addEventListener("input", function () {
    renderExamTable(this.value.trim());
  });

  document
    .getElementById("searchStudent")
    ?.addEventListener("input", function () {
      renderStudentsTable(this.value.trim());
    });

  document.getElementById("menuToggle")?.addEventListener("click", function () {
    document.getElementById("navbarNav")?.classList.toggle("mobile-open");
  });
}

function switchTab(tabId) {
  document
    .querySelectorAll(".tab")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((c) => c.classList.remove("active"));
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add("active");
  document.getElementById(tabId)?.classList.add("active");
}

function getExamStatusBadge(exam) {
  if (exam.type === "free")
    return '<span class="badge badge-success">Tự do truy cập</span>';
  const now = new Date();
  const start = new Date(exam.startTime || "");
  const end = new Date(start.getTime() + Number(exam.duration || 0) * 60000);
  if (Number.isNaN(start.getTime()))
    return '<span class="badge badge-warning">Theo lịch</span>';
  if (now < start)
    return '<span class="badge badge-warning">Chưa bắt đầu</span>';
  if (now > end) return '<span class="badge badge-danger">Đã kết thúc</span>';
  return '<span class="badge badge-success">Đang diễn ra</span>';
}

function renderExamTable(search) {
  const tbody = document.getElementById("examTableBody");
  if (!tbody) return;

  const exams = getExams();
  const filtered = search
    ? exams.filter((exam) =>
        exam.name.toLowerCase().includes(search.toLowerCase()),
      )
    : exams;

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" class="text-center text-secondary" style="padding:30px;">Không tìm thấy kỳ thi nào.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((exam, i) => {
      const startTimeStr = exam.startTime
        ? new Date(exam.startTime).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "--";

      return `
      <tr>
        <td>${i + 1}</td>
        <td style="text-align:left;"><strong>${escapeHtml(exam.name)}</strong><br/><small>${escapeHtml(
          exam.categoryText || "",
        )}</small></td>
        <td>${exam.duration} phút</td>
        <td>${startTimeStr}</td>
        <td>${escapeHtml(exam.room || "--")}</td>
        <td>${getExamStatusBadge(exam)}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-primary" onclick="editExam(${exam.id})" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteExam(${exam.id})" title="Xóa"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function editExam(id) {
  const exam = getExams().find((item) => item.id === id);
  if (!exam) return;

  switchTab("create-exam");

  document.getElementById("examId").value = exam.id;
  document.getElementById("examName").value = exam.name;
  document.getElementById("examDescription").value = exam.description || "";
  document.getElementById("examType").value = exam.type;
  document.getElementById("examDuration").value = exam.duration;
  document.getElementById("examRoom").value = exam.room || "";
  document.getElementById("examCategory").value = exam.category || "practice";
  document.getElementById("timedFields").style.display =
    exam.type === "scheduled" ? "" : "none";
  document.getElementById("examStartTime").value = exam.startTime || "";

  currentQuestions = JSON.parse(JSON.stringify(exam.questions || []));
  renderQuestionsList();
}

function deleteExam(id) {
  deleteTarget = id;
  deleteType = "exam";
  document.getElementById("deleteMessage").textContent =
    "Bạn có chắc chắn muốn xóa kỳ thi này?";
  document.getElementById("deleteModal").classList.add("active");
}

function confirmDelete() {
  if (deleteType === "exam") {
    const exams = getExams().filter((item) => item.id !== deleteTarget);
    setExams(exams);
    renderExamTable();
    showToast("Đã xóa kỳ thi thành công!", "success");
  } else if (deleteType === "question") {
    currentQuestions.splice(deleteTarget, 1);
    renderQuestionsList();
    showToast("Đã xóa câu hỏi!", "success");
  } else if (deleteType === "student") {
    const students = store
      .getStudents()
      .filter((student) => student.id !== deleteTarget);
    store.setStudents(students);

    const results = store.getStudentResults();
    delete results[deleteTarget];
    store.setStudentResults(results);

    renderStudentsTable();
    showToast("Đã xóa tài khoản sinh viên!", "success");
  }
  closeDeleteModal();
}

function closeDeleteModal() {
  document.getElementById("deleteModal").classList.remove("active");
  deleteTarget = null;
  deleteType = "";
}

function renderQuestionsList() {
  const container = document.getElementById("questionsList");
  const empty = document.getElementById("emptyQuestions");

  if (currentQuestions.length === 0) {
    container.innerHTML = "";
    empty.style.display = "";
    return;
  }

  empty.style.display = "none";
  container.innerHTML = currentQuestions
    .map((question, i) => {
      const letters = ["A", "B", "C", "D"];
      const answersHtml = letters
        .map((letter) => {
          const isCorrect = question.correct === letter ? " correct" : "";
          return `<div class="answer-item${isCorrect}"><span class="answer-letter">${letter}</span><span>${escapeHtml(
            question.answers[letter],
          )}</span></div>`;
        })
        .join("");

      return `
      <div class="question-item">
        <div class="question-header">
          <div class="d-flex align-center">
            <span class="question-number">Câu ${i + 1}</span>
            <span class="question-text">${escapeHtml(question.content)}</span>
          </div>
          <div class="question-actions">
            <button class="btn btn-sm btn-outline" onclick="editQuestion(${i})"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteQuestion(${i})"><i class="fas fa-trash"></i></button>
          </div>
        </div>
        <div class="question-answers">${answersHtml}</div>
      </div>`;
    })
    .join("");
}

function openAddQuestionModal() {
  document.getElementById("questionModalTitle").textContent =
    "Thêm câu hỏi mới";
  document.getElementById("editQuestionIndex").value = -1;
  clearQuestionModal();
  document.getElementById("questionModal").classList.add("active");
}

function editQuestion(index) {
  const question = currentQuestions[index];
  document.getElementById("questionModalTitle").textContent =
    "Chỉnh sửa câu hỏi";
  document.getElementById("editQuestionIndex").value = index;
  document.getElementById("questionContent").value = question.content;
  document.getElementById("answerA").value = question.answers.A;
  document.getElementById("answerB").value = question.answers.B;
  document.getElementById("answerC").value = question.answers.C;
  document.getElementById("answerD").value = question.answers.D;
  document.getElementById("questionExplanation").value =
    question.explanation || "";
  const radio = document.getElementById(`correct${question.correct}`);
  if (radio) radio.checked = true;
  document.getElementById("questionModal").classList.add("active");
}

function deleteQuestion(index) {
  deleteTarget = index;
  deleteType = "question";
  document.getElementById("deleteMessage").textContent =
    `Bạn có chắc chắn muốn xóa câu hỏi #${index + 1}?`;
  document.getElementById("deleteModal").classList.add("active");
}

function saveQuestion() {
  const content = document.getElementById("questionContent").value.trim();
  const answers = {
    A: document.getElementById("answerA").value.trim(),
    B: document.getElementById("answerB").value.trim(),
    C: document.getElementById("answerC").value.trim(),
    D: document.getElementById("answerD").value.trim(),
  };
  const explanation = document
    .getElementById("questionExplanation")
    .value.trim();
  const correctEl = document.querySelector(
    'input[name="correctAnswer"]:checked',
  );

  if (!content || !answers.A || !answers.B || !answers.C || !answers.D) {
    showToast("Vui lòng điền đầy đủ nội dung câu hỏi và các đáp án!", "error");
    return;
  }
  if (!correctEl) {
    showToast("Vui lòng chọn đáp án đúng!", "error");
    return;
  }

  const question = {
    content,
    answers,
    correct: correctEl.value,
    explanation,
  };

  const editIndex = Number(document.getElementById("editQuestionIndex").value);
  if (editIndex >= 0) {
    currentQuestions[editIndex] = question;
    showToast("Đã cập nhật câu hỏi!", "success");
  } else {
    currentQuestions.push(question);
    showToast("Đã thêm câu hỏi mới!", "success");
  }

  renderQuestionsList();
  closeQuestionModal();
}

function closeQuestionModal() {
  document.getElementById("questionModal").classList.remove("active");
}

function clearQuestionModal() {
  document.getElementById("questionContent").value = "";
  document.getElementById("answerA").value = "";
  document.getElementById("answerB").value = "";
  document.getElementById("answerC").value = "";
  document.getElementById("answerD").value = "";
  document.getElementById("questionExplanation").value = "";
  document.querySelectorAll('input[name="correctAnswer"]').forEach((radio) => {
    radio.checked = false;
  });
}

function saveExam() {
  const name = document.getElementById("examName").value.trim();
  const description = document.getElementById("examDescription").value.trim();
  const type = document.getElementById("examType").value;
  const duration = Number(document.getElementById("examDuration").value);
  const startTime = document.getElementById("examStartTime").value;
  const room = document.getElementById("examRoom").value.trim();
  const category = document.getElementById("examCategory").value;
  const categoryMap = {
    practice: "Luyện tập",
    midterm: "Giữa kỳ",
    final: "Cuối kỳ",
    other: "Khác",
  };

  if (!name) {
    showToast("Vui lòng nhập tên kỳ thi!", "error");
    return;
  }
  if (!duration || duration < 1) {
    showToast("Vui lòng nhập thời gian làm bài hợp lệ!", "error");
    return;
  }
  if (type === "scheduled" && !startTime) {
    showToast("Vui lòng nhập thời gian bắt đầu cho kỳ thi theo lịch!", "error");
    return;
  }
  if (currentQuestions.length === 0) {
    showToast("Vui lòng thêm ít nhất 1 câu hỏi!", "error");
    return;
  }

  const exams = getExams();
  const editId = Number(document.getElementById("examId").value);

  if (editId) {
    const exam = exams.find((item) => item.id === editId);
    if (exam) {
      exam.name = name;
      exam.description = description;
      exam.type = type;
      exam.duration = duration;
      exam.startTime = type === "scheduled" ? startTime : "";
      exam.room = room || "Trực tuyến";
      exam.category = category;
      exam.categoryText = categoryMap[category] || "Khác";
      exam.questions = JSON.parse(JSON.stringify(currentQuestions));
    }
    showToast("Đã cập nhật kỳ thi thành công!", "success");
  } else {
    const newId =
      exams.length > 0 ? Math.max(...exams.map((item) => item.id)) + 1 : 1;
    exams.push({
      id: newId,
      name,
      description,
      category,
      categoryText: categoryMap[category] || "Khác",
      type,
      duration,
      startTime: type === "scheduled" ? startTime : "",
      room: room || "Trực tuyến",
      status: "active",
      questions: JSON.parse(JSON.stringify(currentQuestions)),
    });
    showToast("Đã tạo kỳ thi mới thành công!", "success");
  }

  setExams(exams);
  renderExamTable();
  resetExamForm();
  switchTab("exam-list");
}

function resetExamForm() {
  document.getElementById("examId").value = "";
  document.getElementById("examName").value = "";
  document.getElementById("examDescription").value = "";
  document.getElementById("examType").value = "free";
  document.getElementById("examDuration").value = "";
  document.getElementById("examRoom").value = "";
  document.getElementById("examStartTime").value = "";
  document.getElementById("examCategory").value = "practice";
  document.getElementById("timedFields").style.display = "none";
  currentQuestions = [];
  renderQuestionsList();
}

function handleExcelImport(event) {
  const file = event.target.files[0];
  if (!file) return;

  const fileName = file.name.toLowerCase();
  if (
    !fileName.endsWith(".csv") &&
    !fileName.endsWith(".xlsx") &&
    !fileName.endsWith(".xls")
  ) {
    showToast("Vui lòng chọn file Excel (.xlsx, .xls) hoặc CSV!", "error");
    return;
  }

  if (fileName.endsWith(".csv")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      parseCSV(e.target.result || "");
    };
    reader.readAsText(file, "UTF-8");
  } else {
    showToast(
      "Demo hỗ trợ trực tiếp CSV. Với .xlsx, hãy lưu thành CSV rồi import.",
      "warning",
    );
  }

  event.target.value = "";
}

function parseCSV(csvText) {
  const lines = csvText.split("\n").filter((line) => line.trim());
  let imported = 0;
  let startRow = 0;
  if (lines.length > 0 && lines[0].toLowerCase().includes("câu hỏi"))
    startRow = 1;

  for (let i = startRow; i < lines.length; i += 1) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 6) continue;

    const question = {
      content: cols[0].trim(),
      answers: {
        A: cols[1].trim(),
        B: cols[2].trim(),
        C: cols[3].trim(),
        D: cols[4].trim(),
      },
      correct: cols[5].trim().toUpperCase(),
      explanation: cols[6] ? cols[6].trim() : "",
    };

    if (question.content && ["A", "B", "C", "D"].includes(question.correct)) {
      currentQuestions.push(question);
      imported += 1;
    }
  }

  renderQuestionsList();
  if (imported > 0)
    showToast(`Đã nhập ${imported} câu hỏi từ file CSV!`, "success");
  else showToast("Không tìm thấy câu hỏi hợp lệ trong file!", "error");
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else current += ch;
  }
  result.push(current);
  return result;
}

function renderStudentsTable(search) {
  const tbody = document.getElementById("studentTableBody");
  if (!tbody) return;

  const students = store.getStudents();
  const results = store.getStudentResults();
  const filtered = search
    ? students.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.id.toLowerCase().includes(search.toLowerCase()),
      )
    : students;

  if (filtered.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center text-secondary" style="padding:30px;">Không tìm thấy sinh viên nào.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered
    .map((student, index) => {
      const attempts = results[student.id] || [];
      const avg =
        attempts.length > 0
          ? (
              attempts.reduce((sum, item) => sum + Number(item.score || 0), 0) /
              attempts.length
            ).toFixed(2)
          : "0.00";
      return `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(student.id)}</td>
        <td style="text-align:left;">${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.class || "--")}</td>
        <td>${attempts.length}</td>
        <td>${avg}</td>
        <td>
          <div class="btn-group">
            <a class="btn btn-sm btn-primary" href="results-management.html?student=${encodeURIComponent(student.id)}"><i class="fas fa-eye"></i></a>
            <button class="btn btn-sm btn-danger" onclick="deleteStudent('${student.id}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function deleteStudent(studentId) {
  deleteTarget = studentId;
  deleteType = "student";
  document.getElementById("deleteMessage").textContent =
    "Bạn có chắc chắn muốn xóa tài khoản sinh viên này?";
  document.getElementById("deleteModal").classList.add("active");
}

function showToast(message, type) {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const icons = {
    success: "fas fa-check-circle",
    error: "fas fa-exclamation-circle",
    warning: "fas fa-exclamation-triangle",
    info: "fas fa-info-circle",
  };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<i class="${icons[type] || icons.info}"></i> ${escapeHtml(message)}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
