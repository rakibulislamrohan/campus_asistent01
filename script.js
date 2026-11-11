
// =====================================
// SMART CAMPUS ASSISTANT SYSTEM
// =====================================

// Get saved data from localStorage
function getData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch (error) {
        return [];
    }
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function getCurrentUser() {
    try {
        return JSON.parse(sessionStorage.getItem("campusUser"));
    } catch (error) {
        return null;
    }
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(char) {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };
        return entities[char];
    });
}

// =====================================
// PAGE NAVIGATION
// =====================================

function showPage() {
    let page = window.location.hash.replace("#", "") || "home";

    const user = getCurrentUser();

    if (page === "admin" && (!user || user.role !== "admin")) {
        alert("Only admin can access this page.");
        window.location.hash = user ? "home" : "login";
        return;
    }

    document.querySelectorAll(".page").forEach(section => {
        section.classList.remove("active");
    });

    const selectedPage = document.getElementById(page);

    if (selectedPage) {
        selectedPage.classList.add("active");
    } else {
        document.getElementById("home").classList.add("active");
    }

    updateNavigation();
    renderStudentRequests();
    renderAdminDashboard();
}

function updateNavigation() {
    const user = getCurrentUser();

    const adminNav = document.getElementById("adminNav");
    const logoutBtn = document.getElementById("logoutBtn");

    if (user) {
        logoutBtn.classList.remove("hidden");
    } else {
        logoutBtn.classList.add("hidden");
    }

    if (user && user.role === "admin") {
        adminNav.classList.remove("hidden");
    } else {
        adminNav.classList.add("hidden");
    }
}

window.addEventListener("hashchange", showPage);

// =====================================
// STUDENT REGISTRATION
// =====================================

document.getElementById("registerForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const name = document.getElementById("regName").value.trim();
    const studentId = document.getElementById("regStudentId").value.trim();
    const email = document.getElementById("regEmail").value.trim().toLowerCase();
    const password = document.getElementById("regPassword").value;

    if (!name || !studentId || !email || !password) {
        alert("Please fill in all fields.");
        return;
    }

    if (password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
    }

    const users = getData("campusUsers");

    const existingUser = users.find(user =>
        user.email === email || user.studentId === studentId
    );

    if (existingUser) {
        alert("Email or Student ID is already registered.");
        return;
    }

    const newUser = {
        name: name,
        studentId: studentId,
        email: email,
        password: password,
        role: "student"
    };

    users.push(newUser);
    saveData("campusUsers", users);

    alert("Registration successful! Please login.");

    this.reset();
    window.location.hash = "login";
});

// =====================================
// STUDENT AND ADMIN LOGIN
// =====================================

document.getElementById("loginForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    // Demo admin login
    if (email === "admin@campus.com" && password === "admin123") {
        sessionStorage.setItem("campusUser", JSON.stringify({
            name: "Administrator",
            email: email,
            role: "admin"
        }));

        alert("Admin login successful!");

        this.reset();
        window.location.hash = "admin";
        return;
    }

    // Student login
    const users = getData("campusUsers");

    const user = users.find(item =>
        item.email === email && item.password === password
    );

    if (!user) {
        alert("Invalid email or password.");
        return;
    }

    sessionStorage.setItem("campusUser", JSON.stringify({
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        role: "student"
    }));

    alert("Login successful!");

    this.reset();
    window.location.hash = "home";
});

// =====================================
// LOGOUT
// =====================================

document.getElementById("logoutBtn").addEventListener("click", function() {
    sessionStorage.removeItem("campusUser");

    alert("You have logged out successfully.");

    window.location.hash = "home";
});

// =====================================
// SUBMIT CAMPUS REQUEST
// =====================================

document.getElementById("requestForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const user = getCurrentUser();

    if (!user) {
        alert("Please login before submitting a request.");
        window.location.hash = "login";
        return;
    }

    if (user.role !== "student") {
        alert("Only students can submit requests.");
        return;
    }

    const title = document.getElementById("requestTitle").value.trim();
    const category = document.getElementById("requestCategory").value;
    const location = document.getElementById("requestLocation").value.trim();
    const description = document.getElementById("requestDescription").value.trim();

    if (!title || !category || !location || !description) {
        alert("Please fill in all request fields.");
        return;
    }

    const requests = getData("campusRequests");

    const newRequest = {
        id: "REQ-" + Date.now(),
        studentName: user.name,
        studentId: user.studentId,
        email: user.email,
        title: title,
        category: category,
        location: location,
        description: description,
        date: new Date().toLocaleDateString(),
        status: "Pending"
    };

    requests.push(newRequest);
    saveData("campusRequests", requests);

    alert("Your request has been submitted successfully!");

    this.reset();

    renderStudentRequests();
    renderAdminDashboard();

    window.location.hash = "track";
});

// =====================================
// TRACK STUDENT REQUESTS
// =====================================

function renderStudentRequests() {
    const table = document.getElementById("studentRequestTable");
    const message = document.getElementById("trackLoginMessage");
    const user = getCurrentUser();

    if (!table || !message) return;

    if (!user || user.role !== "student") {
        message.classList.remove("hidden");
        table.innerHTML = '<tr><td colspan="5">Login as a student to view your requests.</td></tr>';
        return;
    }

    message.classList.add("hidden");

    const requests = getData("campusRequests");

    const myRequests = requests.filter(request =>
        request.email === user.email
    );

    if (myRequests.length === 0) {
        table.innerHTML = '<tr><td colspan="5">You have not submitted any requests yet.</td></tr>';
        return;
    }

    table.innerHTML = myRequests.map(request => `
        <tr>
            <td>${escapeHTML(request.id)}</td>
            <td>${escapeHTML(request.title)}</td>
            <td>${escapeHTML(request.category)}</td>
            <td>${escapeHTML(request.date)}</td>
            <td>
                <span class="status status-${request.status.toLowerCase().replace(/\s+/g, "-")}">
                    ${escapeHTML(request.status)}
                </span>
            </td>
        </tr>
    `).join("");
}

// =====================================
// ADMIN DASHBOARD AND SEARCH
// =====================================

function renderAdminDashboard() {
    const table = document.getElementById("adminRequestTable");

    if (!table) return;

    const user = getCurrentUser();

    if (!user || user.role !== "admin") {
        table.innerHTML = '<tr><td colspan="8">Admin login required.</td></tr>';
        return;
    }

    const requests = getData("campusRequests");

    document.getElementById("totalCount").textContent = requests.length;

    document.getElementById("pendingCount").textContent =
        requests.filter(r => r.status === "Pending").length;

    document.getElementById("progressCount").textContent =
        requests.filter(r => r.status === "In Progress").length;

    document.getElementById("resolvedCount").textContent =
        requests.filter(r => r.status === "Resolved").length;

    const search = document.getElementById("searchInput").value.toLowerCase();
    const status = document.getElementById("statusFilter").value;
    const category = document.getElementById("categoryFilter").value;

    const filteredRequests = requests.filter(request => {
        const searchText = [
            request.id,
            request.title,
            request.studentName,
            request.studentId
        ].join(" ").toLowerCase();

        const matchesSearch = searchText.includes(search);
        const matchesStatus = status === "All" || request.status === status;
        const matchesCategory = category === "All" || request.category === category;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    if (filteredRequests.length === 0) {
        table.innerHTML = '<tr><td colspan="8">No matching requests found.</td></tr>';
        return;
    }

    table.innerHTML = filteredRequests.map(request => `
        <tr>
            <td>${escapeHTML(request.id)}</td>
            <td>
                ${escapeHTML(request.studentName)}
                <br>
                <small>${escapeHTML(request.studentId)}</small>
            </td>
            <td>${escapeHTML(request.title)}</td>
            <td>${escapeHTML(request.category)}</td>
            <td>${escapeHTML(request.description)}</td>
            <td>${escapeHTML(request.date)}</td>
            <td>
                <span class="status status-${request.status.toLowerCase().replace(/\s+/g, "-")}">
                    ${escapeHTML(request.status)}
                </span>
            </td>
            <td>
                <select class="status-select" data-request-id="${escapeHTML(request.id)}">
                    <option value="Pending" ${request.status === "Pending" ? "selected" : ""}>Pending</option>
                    <option value="In Progress" ${request.status === "In Progress" ? "selected" : ""}>In Progress</option>
                    <option value="Resolved" ${request.status === "Resolved" ? "selected" : ""}>Resolved</option>
                    <option value="Rejected" ${request.status === "Rejected" ? "selected" : ""}>Rejected</option>
                </select>
            </td>
        </tr>
    `).join("");
}

// Search and filter events
document.getElementById("searchInput").addEventListener("input", renderAdminDashboard);
document.getElementById("statusFilter").addEventListener("change", renderAdminDashboard);
document.getElementById("categoryFilter").addEventListener("change", renderAdminDashboard);

// =====================================
// ADMIN UPDATE REQUEST STATUS
// =====================================

document.getElementById("adminRequestTable").addEventListener("change", function(event) {
    if (!event.target.classList.contains("status-select")) return;

    const user = getCurrentUser();

    if (!user || user.role !== "admin") {
        alert("Admin permission required.");
        return;
    }

    const requestId = event.target.dataset.requestId;
    const newStatus = event.target.value;

    const requests = getData("campusRequests");

    const request = requests.find(item => item.id === requestId);

    if (!request) {
        alert("Request not found.");
        return;
    }

    request.status = newStatus;

    saveData("campusRequests", requests);

    alert("Request status updated successfully!");

    renderAdminDashboard();
    renderStudentRequests();
});

// =====================================
// INITIALIZE APPLICATION
// =====================================

showPage();
