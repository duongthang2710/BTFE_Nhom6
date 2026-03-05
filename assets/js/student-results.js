const store = window.FE01Store;
let selectedStudent = null;

document.addEventListener("DOMContentLoaded", function () {
  renderAdminHeaderInfo();
  setupLogout();
  renderAllStudents();
  setupEventListeners();

  const params = new URLSearchParams(window.location.search);
  const studentId = params.get("student");
  if (studentId) {
    const student = store.getStudents().find((item) => item.id === studentId);
    if (student) selectStudent(student.id);
  }
});

function renderAdminHeaderInfo() {
  const adminHeaderInfo = document.getElementById("adminHeaderInfo");
  if (adminHeaderInfo) {
    adminHeaderInfo.textContent = "Quản trị viên - AD001";
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
  const searchInput = document.getElementById("studentSearch");
  searchInput?.addEventListener("input", function () {
    const value = this.value.trim();
    if (value.length >= 1) showSuggestions(value);
    else hideSuggestions();
  });

  searchInput?.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      searchStudent();
    }
  });

  document.addEventListener("click", function (event) {
    if (!event.target.closest(".search-section")) hideSuggestions();
  });

  document.getElementById("menuToggle")?.addEventListener("click", function () {
    document.getElementById("navbarNav")?.classList.toggle("mobile-open");
  });
}

function normalizeStr(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function showSuggestions(query) {
  const container = document.getElementById("searchSuggestions");
  const students = store.getStudents();
  const q = normalizeStr(query);

  const matches = students.filter(
    (student) =>
      normalizeStr(student.name).includes(q) ||
      student.id.toLowerCase().includes(query.toLowerCase()),
  );

  if (matches.length === 0) {
    container.innerHTML =
      '<div class="suggestion-item"><span class="text-secondary">Không tìm thấy sinh viên nào</span></div>';
    container.classList.add("active");
    return;
  }

  container.innerHTML = matches
    .map(
      (student) => `
      <div class="suggestion-item" onclick="selectStudent('${student.id}')">
        <div class="suggestion-avatar">${escapeHtml(student.avatar || "SV")}</div>
        <div class="suggestion-info">
          <div class="suggestion-name">${escapeHtml(student.name)}</div>
          <div class="suggestion-id">${escapeHtml(student.id)} - ${escapeHtml(student.class || "--")}</div>
        </div>
      </div>`,
    )
    .join("");

  container.classList.add("active");
}

function hideSuggestions() {
  document.getElementById("searchSuggestions")?.classList.remove("active");
}

function searchStudent() {
  const input = document.getElementById("studentSearch").value.trim();
  if (!input) {
    showToast("Vui lòng nhập tên hoặc MSSV để tìm kiếm!", "error");
    return;
  }

  const students = store.getStudents();
  const q = normalizeStr(input);
  const exact = students.find(
    (student) => student.id.toLowerCase() === input.toLowerCase(),
  );
  if (exact) {
    selectStudent(exact.id);
    return;
  }

  const matches = students.filter(
    (student) =>
      normalizeStr(student.name).includes(q) ||
      student.id.toLowerCase().includes(input.toLowerCase()),
  );

  if (matches.length === 1) {
    selectStudent(matches[0].id);
  } else if (matches.length > 1) {
    showSuggestions(input);
    showToast(
      `Tìm thấy ${matches.length} sinh viên, vui lòng chọn cụ thể.`,
      "info",
    );
  } else {
    showToast("Không tìm thấy sinh viên phù hợp!", "error");
  }
}

function selectStudent(studentId) {
  const students = store.getStudents();
  const student = students.find((item) => item.id === studentId);
  if (!student) return;
  selectedStudent = student;
  document.getElementById("studentSearch").value =
    `${student.name} (${student.id})`;
  hideSuggestions();
  showStudentResults(student);
}

function renderAllStudents() {
  const tbody = document.getElementById("allStudentsBody");
  const students = store.getStudents();
  const results = store.getStudentResults();

  tbody.innerHTML = students
    .map((student, index) => {
      const total = (results[student.id] || []).length;
      return `
      <tr>
        <td>${index + 1}</td>
        <td><strong>${escapeHtml(student.id)}</strong></td>
        <td>${escapeHtml(student.name)}</td>
        <td>${escapeHtml(student.class || "--")}</td>
        <td>${total}</td>
        <td><button class="btn btn-sm btn-primary" onclick="selectStudent('${student.id}')"><i class="fas fa-eye"></i> Xem kết quả</button></td>
      </tr>`;
    })
    .join("");
}

function showStudentResults(student) {
  const allResults = store.getStudentResults();
  const results = allResults[student.id] || [];

  document.getElementById("studentInfoSection").style.display = "";
  document.getElementById("allStudentsSection").style.display = "none";

  document.getElementById("studentAvatarLarge").textContent =
    student.avatar || "SV";
  document.getElementById("studentFullName").textContent = student.name;
  document.getElementById("studentId").textContent = student.id;
  document.getElementById("studentClass").textContent = student.class || "--";
  document.getElementById("studentEmail").textContent = student.email || "--";

  const passed = results.filter((item) => item.status === "passed").length;
  const failed = results.filter((item) => item.status === "failed").length;

  document.getElementById("totalExams").textContent = results.length;
  document.getElementById("passedExams").textContent = passed;
  document.getElementById("failedExams").textContent = failed;

  const tbody = document.getElementById("examResultsBody");
  if (results.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="9" class="text-center text-secondary" style="padding:30px;">Sinh viên chưa tham gia kỳ thi nào.</td></tr>';
    return;
  }

  tbody.innerHTML = results
    .map((result, index) => {
      const statusBadge =
        result.status === "passed"
          ? '<span class="badge badge-success">Hoàn thành</span>'
          : '<span class="badge badge-danger">Không đạt</span>';
      return `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align:left;"><strong>${escapeHtml(result.examName)}</strong></td>
        <td>${escapeHtml(result.room || "--")}</td>
        <td>${result.date}</td>
        <td>${result.timeSpent}</td>
        <td>${result.correctAnswers}/${result.totalQuestions}</td>
        <td><strong>${Number(result.score).toFixed(2)}</strong></td>
        <td>${statusBadge}</td>
        <td class="no-print"><button class="btn btn-sm btn-primary" onclick="viewExamDetail('${student.id}', ${index})"><i class="fas fa-eye"></i> Xem</button></td>
      </tr>`;
    })
    .join("");
}

function viewExamDetail(studentId, examIndex) {
  const results = store.getStudentResults()[studentId] || [];
  const result = results[examIndex];
  if (!result) return;

  document.getElementById("detailExamName").textContent = result.examName;

  document.getElementById("resultSummary").innerHTML = `
    <div class="result-summary-item"><div class="summary-value">${result.totalQuestions}</div><div class="summary-label">Tổng câu hỏi</div></div>
    <div class="result-summary-item"><div class="summary-value text-success">${result.correctAnswers}</div><div class="summary-label">Câu đúng</div></div>
    <div class="result-summary-item"><div class="summary-value text-danger">${result.totalQuestions - result.correctAnswers}</div><div class="summary-label">Câu sai</div></div>
    <div class="result-summary-item ${Number(result.score) >= 5 ? "score-pass" : "score-fail"}"><div class="summary-value">${Number(
      result.score,
    ).toFixed(2)}</div><div class="summary-label">Điểm số</div></div>
  `;

  const letters = ["A", "B", "C", "D"];
  document.getElementById("questionDetails").innerHTML = (
    result.questions || []
  )
    .map((question, index) => {
      const isCorrect = question.selected === question.correct;
      const answersHtml = letters
        .map((letter) => {
          let classes = "qd-answer";
          if (letter === question.correct) classes += " is-correct";
          if (
            letter === question.selected &&
            question.selected !== question.correct
          )
            classes += " is-selected is-wrong";
          if (
            letter === question.selected &&
            question.selected === question.correct
          )
            classes += " is-selected is-correct";
          return `<div class="${classes}"><span class="answer-letter">${letter}</span><span>${escapeHtml(
            question.answers[letter],
          )}</span></div>`;
        })
        .join("");

      return `
      <div class="question-detail ${isCorrect ? "correct-answer" : "wrong-answer"}">
        <div class="qd-header">
          <span class="qd-number">Câu ${index + 1}</span>
          <span class="qd-status ${isCorrect ? "correct" : "wrong"}">${isCorrect ? "Đúng" : "Sai"}</span>
        </div>
        <div class="qd-question">${escapeHtml(question.content)}</div>
        <div class="qd-answers">${answersHtml}</div>
        <div class="qd-explanation"><i class="fas fa-lightbulb"></i> ${escapeHtml(question.explanation || "Không có giải thích")}</div>
      </div>`;
    })
    .join("");

  document.getElementById("examDetailModal").classList.add("active");
}

function closeExamDetailModal() {
  document.getElementById("examDetailModal").classList.remove("active");
}

function exportStudentReport() {
  if (!selectedStudent) {
    showToast("Vui lòng chọn sinh viên trước khi xuất báo cáo!", "error");
    return;
  }
  window.print();
}

function printExamDetail() {
  window.print();
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
  div.textContent = String(text || "");
  return div.innerHTML;
}
