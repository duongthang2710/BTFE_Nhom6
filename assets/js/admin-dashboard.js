document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("fe01_admin_logged_in") !== "true") {
    window.location.href = "admin-login.html";
    return;
  }

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("navbarNav")?.classList.toggle("mobile-open");
  });

  document
    .querySelector('[data-logout="admin"]')
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("fe01_admin_logged_in");
      window.location.href = "admin-login.html";
    });

  const stats = window.FE01Store?.getDashboardStats?.() || {
    totalStudents: 0,
    totalExams: 0,
    totalAttempts: 0,
    avgScore: 0,
    completionRate: 0,
  };

  const exams = window.FE01Store?.getExams?.() || [];
  const resultsMap = window.FE01Store?.getStudentResults?.() || {};
  const attempts = Object.values(resultsMap).flat();
  const students = window.FE01Store?.getStudents?.() || [];

  document.getElementById("metricStudents").textContent = stats.totalStudents;
  document.getElementById("metricExams").textContent = stats.totalExams;
  document.getElementById("metricAttempts").textContent = stats.totalAttempts;
  document.getElementById("metricAvgScore").textContent = Number(
    stats.avgScore,
  ).toFixed(2);

  const attemptsByExam = exams.map((exam) => ({
    label: exam.name,
    value: attempts.filter(
      (attempt) => Number(attempt.examId) === Number(exam.id),
    ).length,
  }));

  const monthLabels = ["T1", "T2", "T3", "T4", "T5", "T6"];
  const trendValues = [10, 18, 15, 22, 19, stats.totalAttempts || 12];

  const passCount = attempts.filter(
    (attempt) => attempt.status === "passed",
  ).length;
  const failCount = attempts.filter(
    (attempt) => attempt.status === "failed",
  ).length;

  const participationCtx = document
    .getElementById("participationChart")
    ?.getContext("2d");
  if (participationCtx) {
    new Chart(participationCtx, {
      type: "bar",
      data: {
        labels: attemptsByExam.map((item) => item.label),
        datasets: [
          {
            label: "Lượt tham gia",
            data: attemptsByExam.map((item) => item.value),
            backgroundColor: "#b2002d",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
      },
    });
  }

  const gradeCtx = document.getElementById("gradeChart")?.getContext("2d");
  if (gradeCtx) {
    new Chart(gradeCtx, {
      type: "doughnut",
      data: {
        labels: ["Hoàn thành", "Chưa đạt"],
        datasets: [
          {
            data: [passCount, failCount || 0],
            backgroundColor: ["#15803d", "#b91c1c"],
            borderWidth: 0,
            cutout: "68%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  const trendCtx = document.getElementById("trendChart")?.getContext("2d");
  if (trendCtx) {
    new Chart(trendCtx, {
      type: "line",
      data: {
        labels: monthLabels,
        datasets: [
          {
            label: "Lượt thi",
            data: trendValues,
            borderColor: "#b2002d",
            backgroundColor: "rgba(178,0,45,0.15)",
            fill: true,
            tension: 0.35,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    });
  }

  const body = document.getElementById("ongoingExamBody");
  if (!body) return;

  const rows = exams
    .map((exam, index) => {
      const count = attempts.filter(
        (attempt) => Number(attempt.examId) === Number(exam.id),
      ).length;
      const statusText = exam.type === "free" ? "Tự do" : "Theo lịch";
      return `
        <tr>
          <td>${index + 1}</td>
          <td style="text-align:left;">${exam.name}</td>
          <td>${exam.categoryText || "Khác"}</td>
          <td>${count}</td>
          <td><span class="badge ${exam.type === "free" ? "badge-success" : "badge-warning"}">${statusText}</span></td>
        </tr>`;
    })
    .join("");

  body.innerHTML =
    rows ||
    '<tr><td colspan="5" class="text-center">Chưa có dữ liệu kỳ thi.</td></tr>';

  renderManageExamTable(exams);
  renderManageStudentTable(students);
});

function renderManageExamTable(exams) {
  const body = document.getElementById("manageExamBody");
  if (!body) return;

  body.innerHTML = exams.length
    ? exams
        .map(
          (exam, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align:left;">${exam.name}</td>
        <td>${exam.categoryText || "Khác"}</td>
        <td>
          <div class="btn-group">
            <a class="btn btn-sm btn-primary" href="exam-management.html?tab=create-exam&examId=${exam.id}" title="Chỉnh sửa"><i class="fas fa-edit"></i></a>
            <button class="btn btn-sm btn-danger" onclick="deleteExamFromDashboard(${exam.id})" title="Xóa"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="text-center">Chưa có kỳ thi.</td></tr>';
}

function deleteExamFromDashboard(examId) {
  const ok = window.confirm("Bạn có chắc chắn muốn xóa kỳ thi này?");
  if (!ok) return;

  const exams = window.FE01Store.getExams().filter(
    (exam) => Number(exam.id) !== Number(examId),
  );
  window.FE01Store.setExams(exams);
  window.location.reload();
}

function renderManageStudentTable(students) {
  const body = document.getElementById("manageStudentBody");
  if (!body) return;

  body.innerHTML = students.length
    ? students
        .map(
          (student, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${student.id}</td>
        <td style="text-align:left;">${student.name}</td>
        <td>${student.class || "--"}</td>
        <td>
          <div class="btn-group">
            <button class="btn btn-sm btn-primary" onclick="openStudentModal('${student.id}')" title="Chỉnh sửa"><i class="fas fa-edit"></i></button>
            <button class="btn btn-sm btn-danger" onclick="deleteStudentFromDashboard('${student.id}')" title="Xóa"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`,
        )
        .join("")
    : '<tr><td colspan="5" class="text-center">Chưa có sinh viên.</td></tr>';
}

function openStudentModal(studentId = "") {
  const modal = document.getElementById("studentCrudModal");
  if (!modal) return;

  const students = window.FE01Store.getStudents();
  const student = students.find((item) => item.id === studentId);

  document.getElementById("studentEditId").value = student?.id || "";
  document.getElementById("studentNameInput").value = student?.name || "";
  document.getElementById("studentClassInput").value = student?.class || "";
  document.getElementById("studentEmailInput").value = student?.email || "";
  document.getElementById("studentModalTitle").textContent = student
    ? "Chỉnh sửa sinh viên"
    : "Thêm sinh viên";

  modal.classList.add("active");
}

function closeStudentModal() {
  document.getElementById("studentCrudModal")?.classList.remove("active");
}

function saveStudentFromDashboard() {
  const editId = document.getElementById("studentEditId").value.trim();
  const name = document.getElementById("studentNameInput").value.trim();
  const className = document.getElementById("studentClassInput").value.trim();
  const email = document.getElementById("studentEmailInput").value.trim();

  if (!name || !className || !email) {
    window.alert("Vui lòng nhập đầy đủ thông tin sinh viên.");
    return;
  }

  const students = window.FE01Store.getStudents();

  if (editId) {
    const found = students.find((student) => student.id === editId);
    if (found) {
      found.name = name;
      found.class = className;
      found.email = email;
    }
  } else {
    const nextIndex = students.length + 1;
    const studentId = `B21DCCN${String(nextIndex).padStart(3, "0")}`;
    students.push({
      id: studentId,
      name,
      class: className,
      email,
      avatar: name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      username: email.split("@")[0].toLowerCase(),
      password: "123456",
    });
  }

  window.FE01Store.setStudents(students);
  closeStudentModal();
  window.location.reload();
}

function deleteStudentFromDashboard(studentId) {
  const ok = window.confirm(
    "Bạn có chắc chắn muốn xóa tài khoản sinh viên này?",
  );
  if (!ok) return;

  const students = window.FE01Store.getStudents().filter(
    (student) => student.id !== studentId,
  );
  window.FE01Store.setStudents(students);

  const results = window.FE01Store.getStudentResults();
  delete results[studentId];
  window.FE01Store.setStudentResults(results);

  window.location.reload();
}

window.openStudentModal = openStudentModal;
window.closeStudentModal = closeStudentModal;
window.saveStudentFromDashboard = saveStudentFromDashboard;
window.deleteStudentFromDashboard = deleteStudentFromDashboard;
window.deleteExamFromDashboard = deleteExamFromDashboard;
