const BASE_URL = "http://127.0.0.1:8080/api";

/* ======================================
   PHONE HELPERS
====================================== */
function onlyDigits(input) {
    input.value = input.value.replace(/[^0-9]/g, "");
}

function updatePhoneCounter(input) {
    const len     = input.value.length;
    const counter = document.getElementById("phoneCounter");
    const hint    = document.getElementById("phoneHint");
    const wrapper = input.closest(".phone-wrapper");

    counter.textContent = len + " / 10";
    counter.className   = len === 10 ? "phone-counter complete"
                        : len >  0  ? "phone-counter typing"
                        :             "phone-counter";
    if (len === 0) {
        hint.textContent = "";
        hint.className   = "phone-hint";
        wrapper.classList.remove("error-border", "success-border");
    } else if (len < 10) {
        hint.textContent = (10 - len) + " more digit" + (10 - len > 1 ? "s" : "") + " needed";
        hint.className   = "phone-hint error";
        wrapper.classList.add("error-border");
        wrapper.classList.remove("success-border");
    } else {
        hint.textContent = "Valid phone number";
        hint.className   = "phone-hint success";
        wrapper.classList.add("success-border");
        wrapper.classList.remove("error-border");
    }
}

function handlePhonePaste(event) {
    event.preventDefault();
    const pasted = (event.clipboardData || window.clipboardData).getData("text");
    const digits = pasted.replace(/[^0-9]/g, "").slice(0, 10);
    const input  = document.getElementById("phone");
    input.value  = digits;
    updatePhoneCounter(input);
}

/* ======================================
   COURSE + DURATION MULTI-ENTRY
   Rules:
   - Each course can only be added ONCE
   - Each course has its own chosen duration
   - Duration options: 15 Days, 1-6 Months
   - At least 1 entry required to submit
====================================== */
let courseEntries = [];

function addCourseEntry() {
    const courseVal   = document.getElementById("courseSelect").value;
    const durationVal = document.getElementById("durationSelect").value;
    const hint        = document.getElementById("courseHint");

    // Validate
    if (!courseVal && !durationVal) {
        showCourseHint("Please select a Course and Duration.", "error");
        document.getElementById("courseSelect").focus();
        return;
    }
    if (!courseVal) {
        showCourseHint("Please select a Course.", "error");
        document.getElementById("courseSelect").focus();
        return;
    }
    if (!durationVal) {
        showCourseHint("Please select a Duration for this course.", "error");
        document.getElementById("durationSelect").focus();
        return;
    }

    // Block duplicate course
    if (courseEntries.find(e => e.course === courseVal)) {
        showCourseHint("'" + courseVal + "' is already added. Each course can only be selected once.", "error");
        document.getElementById("courseSelect").value = "";
        return;
    }

    // Add entry
    courseEntries.push({ course: courseVal, duration: durationVal });

    // Reset selects
    document.getElementById("courseSelect").value   = "";
    document.getElementById("durationSelect").value = "";

    showCourseHint("", "");
    updateCourseDropdown();
    renderCourseList();
    syncHiddenInput();
}

function removeCourseEntry(index) {
    courseEntries.splice(index, 1);
    updateCourseDropdown();
    renderCourseList();
    syncHiddenInput();
}

// Disable already-added options in dropdown; re-enable removed ones
function updateCourseDropdown() {
    const select  = document.getElementById("courseSelect");
    const added   = courseEntries.map(e => e.course);
    select.querySelectorAll("option").forEach(opt => {
        if (!opt.value) return;
        if (added.includes(opt.value)) {
            opt.disabled    = true;
            opt.textContent = opt.value + " (already added)";
        } else {
            opt.disabled    = false;
            opt.textContent = opt.value;
        }
    });
}

function renderCourseList() {
    const list = document.getElementById("courseList");
    if (!list) return;

    if (courseEntries.length === 0) {
        list.innerHTML = `
            <p class="course-list-empty">
                <i class="fa-solid fa-circle-info"></i>&nbsp;
                No courses added yet. Select a course and duration, then click Add.
            </p>`;
        return;
    }

    list.innerHTML = courseEntries.map((entry, i) => `
        <div class="course-entry">
            <div class="course-entry-left">
                <span class="entry-index">${i + 1}</span>
                <span class="entry-course">
                    <i class="fa-solid fa-laptop-code"></i> ${entry.course}
                </span>
                <span class="entry-arrow">&#8594;</span>
                <span class="entry-duration">
                    <i class="fa-solid fa-clock"></i> ${entry.duration}
                </span>
            </div>
            <button type="button" class="remove-entry-btn" onclick="removeCourseEntry(${i})">
                <i class="fa-solid fa-trash"></i> Remove
            </button>
        </div>
    `).join("");
}

function syncHiddenInput() {
    const hidden = document.getElementById("courseDurationData");
    if (hidden) hidden.value = JSON.stringify(courseEntries);
}

function showCourseHint(text, type) {
    const hint = document.getElementById("courseHint");
    if (!hint) return;
    hint.textContent = text;
    hint.className   = "course-hint " + (type || "");
}

/* ======================================
   PAGE LOAD — fetch user details
====================================== */
document.addEventListener("DOMContentLoaded", function () {
    const userId = localStorage.getItem("userId");
    if (!userId) {
        alert("Session expired. Please log in again.");
        window.location.href = "login.html";
        return;
    }
    const headerEl = document.getElementById("headerUserId");
    if (headerEl) headerEl.textContent = "User: " + userId;

    loadUserDetails(userId);
    setupFileInput("resume",    "resumeName");
    setupFileInput("aadhar",    "aadharName");
    setupFileInput("marksheet", "marksheetName");
});

async function loadUserDetails(userId) {
    try {
        const response = await fetch(`${BASE_URL}/user/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user");
        const data = await response.json();

        document.getElementById("userId").value = data.userId || "";
        document.getElementById("email").value  = data.email  || "";
        document.getElementById("name").value   = data.name   || "";

        if (data.dob) {
            const parts = data.dob.split("-");
            document.getElementById("dob").value = parts[2] + "-" + parts[1] + "-" + parts[0];
            calculateAge(data.dob);
        }
    } catch (err) {
        console.error("Error loading user:", err);
        alert("Unable to load your details. Please refresh or log in again.");
    }
}

function calculateAge(dob) {
    if (!dob) return;
    const birth = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    document.getElementById("age").value = age + " years";
}

function setupFileInput(inputId, nameId) {
    const input  = document.getElementById(inputId);
    const nameEl = document.getElementById(nameId);
    if (!input || !nameEl) return;
    input.addEventListener("change", function () {
        if (input.files.length > 0) {
            nameEl.textContent = "✔ " + input.files[0].name;
            nameEl.classList.add("uploaded");
        } else {
            nameEl.textContent = "No file chosen";
            nameEl.classList.remove("uploaded");
        }
    });
}

/* ======================================
   MESSAGES
====================================== */
function showDashMsg(text, type = "error") {
    const el = document.getElementById("dashboardMsg");
    if (!el) return;
    el.textContent = text;
    el.className   = "dash-msg " + type;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ======================================
   VALIDATION
====================================== */
function validateDashboard() {
    const textFields = [
        { id: "phone",           label: "Phone Number" },
        { id: "address",         label: "Street Address" },
        { id: "city",            label: "City" },
        { id: "state",           label: "State" },
        { id: "country",         label: "Country" },
        { id: "pinCode",         label: "Pin Code" },
        { id: "degree",          label: "Degree" },
        { id: "department",      label: "Department" },
        { id: "collegeName",     label: "College Name" },
        { id: "collegeLocation", label: "College Location" },
    ];

    for (const f of textFields) {
        if (!document.getElementById(f.id)?.value.trim()) {
            showDashMsg(`"${f.label}" is required.`, "error");
            document.getElementById(f.id)?.focus();
            return false;
        }
    }

    if (!/^\d{10}$/.test(document.getElementById("phone").value.trim())) {
        showDashMsg("Phone number must be exactly 10 digits.", "error");
        document.getElementById("phone").focus();
        return false;
    }
    if (!/^\d{6}$/.test(document.getElementById("pinCode").value.trim())) {
        showDashMsg("Pin code must be exactly 6 digits.", "error");
        document.getElementById("pinCode").focus();
        return false;
    }
    if (!document.getElementById("title").value) {
        showDashMsg("Please select a Title.", "error");
        return false;
    }
    if (!document.getElementById("year").value) {
        showDashMsg("Please select your current Year of study.", "error");
        return false;
    }
    if (!document.querySelector('input[name="gender"]:checked')) {
        showDashMsg("Please select your Gender.", "error");
        return false;
    }

    // At least one course+duration must be added
    if (courseEntries.length === 0) {
        showDashMsg("Please add at least one Course and Duration.", "error");
        document.getElementById("courseSelect")?.scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
    }

    if (!document.getElementById("referralSource").value) {
        showDashMsg("Please select how you heard about us.", "error");
        return false;
    }
    if (!document.getElementById("resume").files[0]) {
        showDashMsg("Please upload your Resume.", "error");
        return false;
    }
    if (!document.getElementById("aadhar").files[0]) {
        showDashMsg("Please upload your Aadhar Card.", "error");
        return false;
    }
    if (!document.getElementById("marksheet").files[0]) {
        showDashMsg("Please upload your Marksheet.", "error");
        return false;
    }

    return true;
}

/* ======================================
   SUBMIT — navigate to payment on success
====================================== */
async function submitDashboard() {
    showDashMsg("", "");
    if (!validateDashboard()) return;

    const confirmed = confirm(
        "Please review all your details carefully.\n\n" +
        "Once submitted, the application CANNOT be edited.\n\n" +
        "Click OK to submit, or Cancel to go back and review."
    );
    if (!confirmed) return;

    const btn     = document.getElementById("submitBtn");
    const btnText = document.getElementById("submitBtnText");
    const spinner = document.getElementById("submitSpinner");
    btn.disabled  = true;
    btnText.classList.add("hidden");
    spinner.classList.remove("hidden");

    const formData = new FormData();
    formData.append("userId",          document.getElementById("userId").value);
    formData.append("title",           document.getElementById("title").value);
    formData.append("gender",          document.querySelector('input[name="gender"]:checked').value);
    formData.append("phone",           document.getElementById("phone").value.trim());
    formData.append("address",         document.getElementById("address").value.trim());
    formData.append("city",            document.getElementById("city").value.trim());
    formData.append("state",           document.getElementById("state").value.trim());
    formData.append("country",         document.getElementById("country").value.trim());
    formData.append("pinCode",         document.getElementById("pinCode").value.trim());
    formData.append("degree",          document.getElementById("degree").value.trim());
    formData.append("department",      document.getElementById("department").value.trim());
    formData.append("year",            document.getElementById("year").value);
    formData.append("collegeName",     document.getElementById("collegeName").value.trim());
    formData.append("collegeLocation", document.getElementById("collegeLocation").value.trim());
    formData.append("courses",         JSON.stringify(courseEntries));
    formData.append("referralSource",  document.getElementById("referralSource").value);
    formData.append("resume",          document.getElementById("resume").files[0]);
    formData.append("aadhar",          document.getElementById("aadhar").files[0]);
    formData.append("marksheet",       document.getElementById("marksheet").files[0]);

    try {
        const response = await fetch(`${BASE_URL}/dashboard`, {
            method: "POST",
            body: formData
        });
        const result = await response.text();

        if (result === "DASHBOARD_SAVED") {
            showDashMsg("Application submitted successfully! Redirecting to payment...", "success");
            setTimeout(() => { window.location.href = "payment.html"; }, 1200);
        } else if (result === "ALREADY_SUBMITTED") {
            showDashMsg("Your application has already been submitted.", "warn");
        } else if (result === "USER_NOT_FOUND") {
            showDashMsg("Session error. Please log in again.", "error");
        } else if (result === "FILE_TOO_LARGE") {
            showDashMsg("One or more files exceed the size limit. Please upload smaller files (max 50MB each).", "error");
        } else if (result === "FILE_READ_ERROR") {
            showDashMsg("Could not read uploaded file. Please try again.", "error");
        } else {
            showDashMsg("Submission failed: " + result + ". Please try again.", "error");
        }
    } catch (err) {
        console.error("Submission error:", err);
        showDashMsg("Cannot connect to server. Make sure Spring Boot is running.", "error");
    } finally {
        btn.disabled = false;
        btnText.classList.remove("hidden");
        spinner.classList.add("hidden");
    }
}

/* ======================================
   LOGOUT
====================================== */
function logout() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.clear();
        window.location.href = "login.html";
    }
}