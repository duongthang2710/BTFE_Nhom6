(function () {
  const clearUserSession = () => {
    localStorage.removeItem("fe01_current_student_id");
    localStorage.removeItem("fe01_selected_exam_id");
  };

  const clearAdminSession = () => {
    localStorage.removeItem("fe01_admin_logged_in");
  };

  const showMessage = (target, text, type) => {
    if (!target) return;
    target.textContent = text;
    target.classList.remove("error", "success");
    if (type) target.classList.add(type);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const getStore = () => window.FE01Store || null;

  const formatExamTime = (exam) => {
    if (exam.type === "free") return "Bất kỳ lúc nào";
    if (!exam.startTime) return "Theo lịch";
    const start = new Date(exam.startTime);
    if (Number.isNaN(start.getTime())) return "Theo lịch";

    const end = new Date(start.getTime() + Number(exam.duration || 0) * 60000);
    const day = start.toLocaleDateString("vi-VN");
    const startHm = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const endHm = end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startHm} - ${endHm}, ${day}`;
  };

  const setupUserAuthPage = () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (!loginForm || !registerForm) return;

    const loginTab = document.getElementById("loginTab");
    const registerTab = document.getElementById("registerTab");

    const switchTab = (tab) => {
      const isLogin = tab === "login";
      loginForm.classList.toggle("hidden", !isLogin);
      registerForm.classList.toggle("hidden", isLogin);
      loginTab.classList.toggle("active", isLogin);
      registerTab.classList.toggle("active", !isLogin);
      loginTab.setAttribute("aria-selected", String(isLogin));
      registerTab.setAttribute("aria-selected", String(!isLogin));
    };

    loginTab?.addEventListener("click", () => switchTab("login"));
    registerTab?.addEventListener("click", () => switchTab("register"));

    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = document.getElementById("loginUsername")?.value.trim();
      const password = document.getElementById("loginPassword")?.value;
      const message = document.getElementById("loginMessage");
      const store = getStore();

      if (!username || !password) {
        showMessage(
          message,
          "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.",
          "error",
        );
        return;
      }

      const students = store?.getStudents?.() || [];
      const found = students.find(
        (student) =>
          student.username === username && student.password === password,
      );

      if (found) {
        localStorage.setItem("fe01_current_student_id", found.id);
        clearAdminSession();
        showMessage(message, "Đăng nhập thành công (demo).", "success");
        setTimeout(() => {
          window.location.href = "user-home.html";
        }, 600);
        return;
      }

      showMessage(
        message,
        "Sai thông tin đăng nhập. Thử student / 123456.",
        "error",
      );
    });

    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = document.getElementById("registerName")?.value.trim();
      const email = document.getElementById("registerEmail")?.value.trim();
      const password = document.getElementById("registerPassword")?.value;
      const confirmPassword = document.getElementById(
        "registerConfirmPassword",
      )?.value;
      const message = document.getElementById("registerMessage");
      const store = getStore();

      if (!name || !email || !password || !confirmPassword) {
        showMessage(
          message,
          "Vui lòng điền đầy đủ thông tin đăng ký.",
          "error",
        );
        return;
      }

      if (name.length < 3) {
        showMessage(
          message,
          "Tên người dùng phải có ít nhất 3 ký tự.",
          "error",
        );
        return;
      }

      if (!isValidEmail(email)) {
        showMessage(message, "Email không hợp lệ.", "error");
        return;
      }

      if (password.length < 6) {
        showMessage(message, "Mật khẩu phải có ít nhất 6 ký tự.", "error");
        return;
      }

      if (password !== confirmPassword) {
        showMessage(message, "Xác nhận mật khẩu chưa khớp.", "error");
        return;
      }

      const students = store?.getStudents?.() || [];
      if (
        students.some(
          (student) => student.email.toLowerCase() === email.toLowerCase(),
        )
      ) {
        showMessage(message, "Email đã tồn tại trong hệ thống demo.", "error");
        return;
      }

      const nextIndex = students.length + 1;
      const studentId = `B21DCCN${String(nextIndex).padStart(3, "0")}`;
      const username = email.split("@")[0].toLowerCase();
      store?.addStudent?.({
        id: studentId,
        name,
        class: "D21CQCN01-B",
        email,
        avatar: name
          .split(" ")
          .map((part) => part[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        username,
        password,
      });

      showMessage(message, "Đăng ký thành công (demo frontend).", "success");
      registerForm.reset();
      setTimeout(() => switchTab("login"), 600);
    });
  };

  const setupUserHomePage = () => {
    const examGrid = document.getElementById("examGrid");
    if (!examGrid) return;

    const searchInput = document.getElementById("searchExam");
    const statusFilter = document.getElementById("statusFilter");
    const emptyMessage = document.getElementById("examEmpty");
    const logoutButton = document.getElementById("userLogoutBtn");
    const store = getStore();

    logoutButton?.addEventListener("click", () => {
      clearUserSession();
      window.location.href = "user-auth.html";
    });

    const renderExams = () => {
      const keyword = (searchInput?.value || "").trim().toLowerCase();
      const status = statusFilter?.value || "all";
      const exams = store?.getExams?.() || [];

      const filtered = exams.filter((exam) => {
        const matchesName = (exam.name || "").toLowerCase().includes(keyword);
        const matchesStatus = status === "all" || exam.type === status;
        return matchesName && matchesStatus;
      });

      examGrid.innerHTML = "";

      filtered.forEach((exam) => {
        const card = document.createElement("article");
        card.className = "exam-card";
        card.innerHTML = `
          <h3 class="exam-title">${exam.name}</h3>
          <div class="exam-tags">
            <span class="badge badge-type ${exam.category || "practice"}">${exam.categoryText || "Luyện tập"}</span>
            <span class="badge badge-status ${exam.type}">${exam.type === "free" ? "Tự do truy cập" : "Theo lịch"}</span>
          </div>
          <p class="exam-meta">Thời gian: ${formatExamTime(exam)}</p>
          <button class="btn btn-primary" data-id="${exam.id}">Bắt đầu làm bài</button>
        `;
        examGrid.appendChild(card);
      });

      emptyMessage?.classList.toggle("hidden", filtered.length > 0);
    };

    examGrid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (!target.matches("button[data-id]")) return;
      localStorage.setItem("fe01_selected_exam_id", target.dataset.id || "");
      window.location.href = "exam.html";
    });

    searchInput?.addEventListener("input", renderExams);
    statusFilter?.addEventListener("change", renderExams);
    renderExams();
  };

  const setupAdminLoginPage = () => {
    const adminForm = document.getElementById("adminLoginForm");
    if (!adminForm) return;

    adminForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const username = document.getElementById("adminUsername")?.value.trim();
      const password = document.getElementById("adminPassword")?.value;
      const message = document.getElementById("adminMessage");

      if (!username || !password) {
        showMessage(message, "Vui lòng nhập đầy đủ thông tin admin.", "error");
        return;
      }

      if (username === "admin" && password === "admin123") {
        localStorage.setItem("fe01_admin_logged_in", "true");
        showMessage(message, "Đăng nhập admin thành công (demo).", "success");
        setTimeout(() => {
          window.location.href = "admin-dashboard.html";
        }, 600);
        return;
      }

      showMessage(
        message,
        "Sai tài khoản admin demo. Thử admin / admin123.",
        "error",
      );
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupUserAuthPage();
    setupUserHomePage();
    setupAdminLoginPage();
  });
})();
