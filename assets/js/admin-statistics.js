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

  const exams = window.FE01Store?.getExams?.() || [];
  const resultsMap = window.FE01Store?.getStudentResults?.() || {};
  const attempts = Object.values(resultsMap).flat();

  const examFilter = document.getElementById("examFilter");
  if (examFilter) {
    examFilter.innerHTML =
      '<option value="all">Tất cả kỳ thi</option>' +
      exams
        .map((exam) => `<option value="${exam.id}">${exam.name}</option>`)
        .join("");
  }

  const statusFilter = document.getElementById("statusFilter");
  const fromDateInput = document.getElementById("fromDate");
  const toDateInput = document.getElementById("toDate");

  const parseAttemptDate = (attempt) => {
    const isoDate = attempt?.submittedAt;
    if (isoDate) return new Date(isoDate);
    const raw = attempt?.date || "";
    const [datePart] = raw.split(" ");
    if (!datePart) return null;
    const parts = datePart.split("/");
    if (parts.length !== 3) return null;
    const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const applyFilters = () => {
    const selectedExam = examFilter?.value || "all";
    const selectedStatus = statusFilter?.value || "all";
    const fromDate = fromDateInput?.value
      ? new Date(`${fromDateInput.value}T00:00:00`)
      : null;
    const toDate = toDateInput?.value
      ? new Date(`${toDateInput.value}T23:59:59`)
      : null;

    let filtered =
      selectedExam === "all"
        ? attempts
        : attempts.filter(
            (item) => Number(item.examId) === Number(selectedExam),
          );

    if (selectedStatus !== "all") {
      filtered = filtered.filter((item) => item.status === selectedStatus);
    }

    if (fromDate || toDate) {
      filtered = filtered.filter((item) => {
        const d = parseAttemptDate(item);
        if (!d) return false;
        if (fromDate && d < fromDate) return false;
        if (toDate && d > toDate) return false;
        return true;
      });
    }

    return filtered;
  };

  const render = () => {
    const filtered = applyFilters();

    const completed = filtered.filter(
      (item) => item.status === "passed",
    ).length;
    const notCompleted = Math.max(0, filtered.length - completed);
    const avgScore = filtered.length
      ? filtered.reduce((sum, item) => sum + Number(item.score || 0), 0) /
        filtered.length
      : 0;

    document.getElementById("metricAttemptCount").textContent = filtered.length;
    document.getElementById("metricCompletion").textContent =
      `${filtered.length ? Math.round((completed / filtered.length) * 100) : 0}%`;
    document.getElementById("metricAvg").textContent = avgScore.toFixed(2);

    const scoreBands = [0, 0, 0, 0];
    filtered.forEach((item) => {
      const score = Number(item.score || 0);
      if (score < 5) scoreBands[0] += 1;
      else if (score < 7) scoreBands[1] += 1;
      else if (score < 9) scoreBands[2] += 1;
      else scoreBands[3] += 1;
    });

    renderCompletionChart(completed, notCompleted);
    renderTrendChart(filtered);
    renderHistogramChart(scoreBands);
    renderStatsTable(filtered);
  };

  examFilter?.addEventListener("change", render);
  statusFilter?.addEventListener("change", render);
  document
    .getElementById("applyStatsFilter")
    ?.addEventListener("click", render);

  const buildExportRows = () => {
    const filtered = applyFilters();
    return filtered.map((item, index) => ({
      STT: index + 1,
      "Ky thi": item.examName,
      "Ngay thi": item.date,
      Dung_Tong: `${item.correctAnswers}/${item.totalQuestions}`,
      Diem: Number(item.score).toFixed(2),
      TrangThai: item.status === "passed" ? "Hoàn thành" : "Không đạt",
    }));
  };

  document
    .getElementById("exportExcelBtn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      const rows = buildExportRows();
      const headers = [
        "STT",
        "Ky thi",
        "Ngay thi",
        "Dung_Tong",
        "Diem",
        "TrangThai",
      ];
      const csv = [headers.join(",")]
        .concat(
          rows.map((r) =>
            headers
              .map((h) => `"${String(r[h] ?? "").replaceAll('"', '""')}"`)
              .join(","),
          ),
        )
        .join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "bao-cao-thong-ke.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    });

  document
    .getElementById("exportPdfBtn")
    ?.addEventListener("click", (event) => {
      event.preventDefault();
      window.print();
    });

  render();
});

let completionChart;
let trendChart;
let histogramChart;

const chartFont = {
  family: "Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif",
  size: 13,
};

function renderCompletionChart(completed, notCompleted) {
  const ctx = document.getElementById("completionChart")?.getContext("2d");
  if (!ctx) return;
  if (completionChart) completionChart.destroy();

  completionChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["Hoàn thành", "Không đạt"],
      datasets: [
        {
          data: [completed, notCompleted],
          backgroundColor: ["#15803d", "#b91c1c"],
          borderWidth: 0,
          cutout: "75%",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: true, labels: { font: chartFont } } },
    },
  });
}

function renderTrendChart(filtered) {
  const ctx = document.getElementById("scoreLineChart")?.getContext("2d");
  if (!ctx) return;
  if (trendChart) trendChart.destroy();

  const labels = filtered.map((item, idx) => `Lần ${idx + 1}`);
  const scores = filtered.map((item) => Number(item.score || 0));

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Điểm",
          data: scores,
          borderColor: "#b2002d",
          backgroundColor: "rgba(178,0,45,0.15)",
          fill: true,
          tension: 0.3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { font: chartFont } } },
      scales: {
        x: { ticks: { font: chartFont } },
        y: { min: 0, max: 10, ticks: { font: chartFont } },
      },
    },
  });
}

function renderHistogramChart(scoreBands) {
  const ctx = document.getElementById("histogramChart")?.getContext("2d");
  if (!ctx) return;
  if (histogramChart) histogramChart.destroy();

  histogramChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["0-4", "5-6", "7-8", "9-10"],
      datasets: [
        {
          label: "Số lượt",
          data: scoreBands,
          backgroundColor: ["#fecaca", "#fde68a", "#bfdbfe", "#86efac"],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { font: chartFont } },
        y: { ticks: { font: chartFont } },
      },
    },
  });
}

function renderStatsTable(filtered) {
  const body = document.getElementById("statsTableBody");
  if (!body) return;
  body.innerHTML = filtered.length
    ? filtered
        .map(
          (item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td style="text-align:left;">${item.examName}</td>
        <td>${item.date}</td>
        <td>${item.correctAnswers}/${item.totalQuestions}</td>
        <td>${Number(item.score).toFixed(2)}</td>
        <td><span class="badge ${item.status === "passed" ? "badge-success" : "badge-danger"}">${
          item.status === "passed" ? "Hoàn thành" : "Không đạt"
        }</span></td>
      </tr>`,
        )
        .join("")
    : '<tr><td colspan="6" class="text-center">Không có dữ liệu theo bộ lọc.</td></tr>';
}
