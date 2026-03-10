const BASE_URL = "http://localhost:8080/api";
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* ── Helpers ── */
function showMsg(id, text, type = "error") {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerText = text;
    el.className = `msg ${type}`;
}

function setLoading(btnId, textId, spinnerId, loading) {
    const btn     = document.getElementById(btnId);
    const text    = document.getElementById(textId);
    const spinner = document.getElementById(spinnerId);
    if (!btn) return;
    btn.disabled = loading;
    text?.classList.toggle("hidden", loading);
    spinner?.classList.toggle("hidden", !loading);
}

/* ── Page Load ── */
window.onload = function () {
    const dobInput = document.getElementById("dob");
    if (dobInput) {
        dobInput.max = new Date().toISOString().split("T")[0];
    }
};

/* ── Register ── */
function register() {
    const name   = document.getElementById("name")?.value.trim();
    const email  = document.getElementById("email")?.value.trim();
    const dobRaw = document.getElementById("dob")?.value;  // yyyy-MM-dd
    const msgId  = "registerMsg";

    showMsg(msgId, "");

    if (!name || !email || !dobRaw) {
        showMsg(msgId, "All fields are required.", "error");
        return;
    }
    if (!emailPattern.test(email)) {
        showMsg(msgId, "Invalid email format.", "error");
        return;
    }
    if (dobRaw >= new Date().toISOString().split("T")[0]) {
        showMsg(msgId, "Date of birth cannot be today or a future date.", "error");
        return;
    }

    setLoading("registerBtn", "registerBtnText", "registerSpinner", true);

    fetch(BASE_URL + "/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, dob: dobRaw })
    })
    .then(res => {
        if (!res.ok && res.status !== 200) {
            throw new Error("HTTP " + res.status);
        }
        return res.text();
    })
    .then(text => {
        if (text === "SUCCESS") {
            showMsg(msgId, "Registration successful! Check your email for login credentials.", "success");
            document.getElementById("name").value  = "";
            document.getElementById("email").value = "";
            document.getElementById("dob").value   = "";
        } else if (text === "USER_EXISTS") {
            showMsg(msgId, "An account with this email already exists.", "error");
        } else if (text === "INVALID_DOB") {
            showMsg(msgId, "Date of birth cannot be a future date.", "error");
        } else if (text === "SUCCESS_BUT_EMAIL_FAILED") {
            showMsg(msgId, "Registered! But the confirmation email could not be sent. Please note your details.", "warn");
        } else {
            showMsg(msgId, "Server error: " + text + ". Please try again.", "error");
        }
    })
    .catch(err => {
        console.error("Register error:", err);
        showMsg(
            msgId,
            "Cannot connect to server (localhost:8080). Make sure Spring Boot is running in STS.",
            "error"
        );
    })
    .finally(() => setLoading("registerBtn", "registerBtnText", "registerSpinner", false));
}

/* ── Login ── */
function login() {
    const userId   = document.getElementById("userId")?.value.trim();
    const password = document.getElementById("password")?.value;
    const msgId    = "loginMsg";

    showMsg(msgId, "");

    if (!userId || !password) {
        showMsg(msgId, "User ID and Password are required.", "error");
        return;
    }

    setLoading("loginBtn", "loginBtnText", "loginSpinner", true);

    fetch(BASE_URL + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
    })
    .then(res => res.text())
    .then(text => {
        if (text === "SUCCESS") {
            showMsg(msgId, "Login successful! Redirecting...", "success");
            localStorage.setItem("userId", userId);
            setTimeout(() => { window.location.href = "dashboard.html"; }, 800);
        } else if (text === "Invalid User ID") {
            showMsg(msgId, "Invalid User ID. Please check and try again.", "error");
        } else if (text === "Invalid Password") {
            showMsg(msgId, "Invalid Password. Please check and try again.", "error");
        } else {
            showMsg(msgId, text, "error");
        }
    })
    .catch(err => {
        console.error("Login error:", err);
        showMsg(
            msgId,
            "Cannot connect to server (localhost:8080). Make sure Spring Boot is running in STS.",
            "error"
        );
    })
    .finally(() => setLoading("loginBtn", "loginBtnText", "loginSpinner", false));
}

/* ── Forgot Password ── */
function forgotPassword() {
    const email = document.getElementById("forgotEmail")?.value.trim();
    const msgId = "forgotMsg";

    showMsg(msgId, "");

    if (!email) {
        showMsg(msgId, "Email is required.", "error");
        return;
    }
    if (!emailPattern.test(email)) {
        showMsg(msgId, "Invalid email format.", "error");
        return;
    }

    setLoading("forgotBtn", "forgotBtnText", "forgotSpinner", true);

    fetch(BASE_URL + "/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    })
    .then(res => res.text())
    .then(text => {
        if (text === "SUCCESS") {
            showMsg(msgId, "Credentials sent! Check your email inbox.", "success");
            document.getElementById("forgotEmail").value = "";
        } else if (text === "EMAIL_NOT_FOUND") {
            showMsg(msgId, "This email is not registered with us.", "error");
        } else if (text === "EMAIL_SEND_FAILED") {
            showMsg(msgId, "Could not send email. Please try again later.", "error");
        } else {
            showMsg(msgId, "Something went wrong. Try again.", "error");
        }
    })
    .catch(err => {
        console.error("Forgot error:", err);
        showMsg(
            msgId,
            "Cannot connect to server (localhost:8080). Make sure Spring Boot is running in STS.",
            "error"
        );
    })
    .finally(() => setLoading("forgotBtn", "forgotBtnText", "forgotSpinner", false));
}

/* ── Toggle Password Visibility ── */
function togglePassword() {
    const pwd  = document.getElementById("password");
    const icon = document.getElementById("eyeIcon");
    if (!pwd) return;
    if (pwd.type === "password") {
        pwd.type = "text";
        icon?.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        pwd.type = "password";
        icon?.classList.replace("fa-eye-slash", "fa-eye");
    }
}