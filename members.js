(() => {
    "use strict";

    // -------------------------------------------------------------------------
    // 01. DEFAULT SEED DATA & STORAGE
    // -------------------------------------------------------------------------
    const STORAGE_KEY_MEMBERS = "manifest_subscribers_v1";
    const STORAGE_KEY_SESSIONS = "manifest_sessions_v1";
    const ADMIN_PASSCODE = "jaya2026";

    // Helper: calculate date string (YYYY-MM-DD)
    const addDays = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
    };

    const initialMembers = [
        { email: "student@example.com", name: "Priya Sharma", enrolledDate: "2026-09-15", expiryDate: addDays(25), status: "active" },
        { email: "client@example.com", name: "Neha Reddy", enrolledDate: "2026-09-01", expiryDate: addDays(10), status: "active" },
        { email: "expired@example.com", name: "Rohit Verma", enrolledDate: "2026-07-01", expiryDate: "2026-08-31", status: "expired" }
    ];

    const initialSessions = [
        {
            id: "session-1",
            title: "Subconscious Reprogramming & Manifestation Resistance",
            date: "Week of Oct 5, 2026",
            duration: "54 mins",
            videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
            description: "In this week’s session, we uncover subconscious fears that masquerade as logic, and install empowering affirmations directly into the somatic field.",
            takeaways: [
                "How to identify the subconscious fear keeping you in repetitive cycles.",
                "Somatic EFT sequence for emotional neutralization before bedtime.",
                "Guided Ho’oponopono forgiveness sequence for personal peace."
            ]
        },
        {
            id: "session-2",
            title: "Guided Morning Alignment & Energy Activation",
            date: "Week of Oct 5, 2026",
            duration: "24 mins",
            videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
            description: "A restorative 24-minute practice to ground your energy into confidence, gratitude, and expectant receiving.",
            takeaways: [
                "Breathwork pacing for nervous system reset.",
                "Heart-brain coherence meditation practice.",
                "Daily intention setting prompt."
            ]
        }
    ];

    const getStoredMembers = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
            return raw ? JSON.parse(raw) : initialMembers;
        } catch {
            return initialMembers;
        }
    };

    const saveMembers = (members) => {
        localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
    };

    const getStoredSessions = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
            return raw ? JSON.parse(raw) : initialSessions;
        } catch {
            return initialSessions;
        }
    };

    const saveSessions = (sessions) => {
        localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    };

    // Ensure storage is initialized
    if (!localStorage.getItem(STORAGE_KEY_MEMBERS)) saveMembers(initialMembers);
    if (!localStorage.getItem(STORAGE_KEY_SESSIONS)) saveSessions(initialSessions);

    // -------------------------------------------------------------------------
    // 02. DOM ELEMENTS
    // -------------------------------------------------------------------------
    const gateSection = document.getElementById("gate-section");
    const portalView = document.getElementById("portal-view");
    const loginForm = document.getElementById("member-login-form");
    const loginEmailInput = document.getElementById("member-email");
    const statusMsg = document.getElementById("member-status-msg");
    const userEmailDisplay = document.getElementById("user-email-display");
    const userExpiryDisplay = document.getElementById("user-expiry-display");
    const logoutBtn = document.getElementById("member-logout-btn");
    const sessionsContainer = document.getElementById("sessions-container");

    // Admin elements
    const adminToggleBtn = document.getElementById("admin-toggle-btn");
    const adminPanel = document.getElementById("admin-panel");
    const addSessionForm = document.getElementById("add-session-form");
    const enrollStudentForm = document.getElementById("enroll-student-form");
    const adminStudentsTable = document.getElementById("admin-students-body");
    const adminSessionsTable = document.getElementById("admin-sessions-body");

    // -------------------------------------------------------------------------
    // 03. AUTHENTICATION & SUBSCRIPTION CHECK
    // -------------------------------------------------------------------------
    const checkUserAccess = (email) => {
        const cleanEmail = email.toLowerCase().trim();
        const members = getStoredMembers();
        const member = members.find(m => m.email.toLowerCase() === cleanEmail);

        if (!member) {
            return { ok: false, reason: "not_found" };
        }

        const today = new Date().toISOString().split("T")[0];
        if (member.expiryDate < today) {
            return { ok: false, reason: "expired", member };
        }

        return { ok: true, member };
    };

    const showStatus = (text, type = "error") => {
        statusMsg.className = `members-status-msg is-${type}`;
        statusMsg.innerHTML = text;
        statusMsg.style.display = "block";
    };

    const hideStatus = () => {
        statusMsg.style.display = "none";
        statusMsg.innerHTML = "";
    };

    const renderSessions = () => {
        const sessions = getStoredSessions();
        if (!sessionsContainer) return;

        if (sessions.length === 0) {
            sessionsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No recorded sessions published for this week yet. Please check back soon!</p>
                </div>
            `;
            return;
        }

        sessionsContainer.innerHTML = sessions.map(session => `
            <article class="session-card" id="${session.id}">
                <div class="session-video-wrapper">
                    <iframe src="${session.videoUrl}" title="${session.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
                </div>
                <div class="session-card-content">
                    <div class="session-meta-row">
                        <span>${session.date}</span>
                        <span>⏱ ${session.duration}</span>
                    </div>
                    <h3 class="session-card-title">${session.title}</h3>
                    <p class="session-card-desc">${session.description}</p>
                    ${session.takeaways && session.takeaways.length ? `
                        <strong class="text-muted small text-uppercase" style="letter-spacing:0.06em;font-size:11px;">Key Highlights:</strong>
                        <ul class="session-takeaways">
                            ${session.takeaways.map(t => `<li>${t}</li>`).join("")}
                        </ul>
                    ` : ""}
                    <div class="session-actions-row">
                        <span class="badge" style="background:var(--blush);color:var(--primary);font-weight:600;padding:6px 12px;border-radius:999px;">Weekly Replay</span>
                        <a href="#bookingModal" class="button button-outline" style="padding:6px 16px;min-height:36px;font-size:11px;" data-bs-toggle="modal" data-bs-target="#bookingModal">Ask Jaya a question</a>
                    </div>
                </div>
            </article>
        `).join("");
    };

    const activatePortal = (member) => {
        gateSection.style.display = "none";
        portalView.style.display = "block";
        if (userEmailDisplay) userEmailDisplay.textContent = member.email;
        if (userExpiryDisplay) {
            const expDate = new Date(member.expiryDate + "T12:00:00").toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric"
            });
            userExpiryDisplay.textContent = `Subscription Active — Valid until ${expDate}`;
        }
        renderSessions();
        sessionStorage.setItem("active_member_email", member.email);
    };

    const deactivatePortal = () => {
        sessionStorage.removeItem("active_member_email");
        gateSection.style.display = "block";
        portalView.style.display = "none";
        hideStatus();
        if (loginEmailInput) loginEmailInput.value = "";
    };

    // Auto login if already in session
    const savedEmail = sessionStorage.getItem("active_member_email");
    if (savedEmail) {
        const result = checkUserAccess(savedEmail);
        if (result.ok) {
            activatePortal(result.member);
        } else {
            deactivatePortal();
        }
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = loginEmailInput.value.trim();
            if (!email) return;

            const result = checkUserAccess(email);
            if (result.ok) {
                activatePortal(result.member);
            } else if (result.reason === "expired") {
                const expDate = new Date(result.member.expiryDate + "T12:00:00").toLocaleDateString(undefined, {
                    year: "numeric", month: "short", day: "numeric"
                });
                showStatus(`
                    <strong>Subscription Expired:</strong> Your access ended on <strong>${expDate}</strong>.<br>
                    To renew and watch this week's recorded sessions, please <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#8d6e15;text-decoration:underline;font-weight:700;">renew your enrollment</a> or contact <a href="mailto:contact@manifestwithjaya.com" style="color:#8d6e15;text-decoration:underline;">contact@manifestwithjaya.com</a>.
                `, "expired");
            } else {
                showStatus(`
                    <strong>Email Not Found:</strong> We couldn't find <em>${email}</em> on the enrolled members list.<br>
                    Please verify your spelling or <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#b71c1c;text-decoration:underline;font-weight:700;">enroll in a program</a> to gain access.
                `, "error");
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", deactivatePortal);
    }

    // -------------------------------------------------------------------------
    // 04. INSTRUCTOR ADMIN PANEL
    // -------------------------------------------------------------------------
    const renderAdminTables = () => {
        // Members table
        const members = getStoredMembers();
        const today = new Date().toISOString().split("T")[0];
        if (adminStudentsTable) {
            adminStudentsTable.innerHTML = members.map((m, idx) => {
                const isExp = m.expiryDate < today;
                return `
                    <tr>
                        <td><strong>${m.email}</strong></td>
                        <td>${m.enrolledDate || "—"}</td>
                        <td>${m.expiryDate}</td>
                        <td>
                            <span class="subscription-badge ${isExp ? "expired" : ""}">
                                ${isExp ? "Expired" : "Active"}
                            </span>
                        </td>
                        <td>
                            <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 me-1 extend-student-btn" data-email="${m.email}">+30d</button>
                            <button type="button" class="admin-delete-btn delete-student-btn" data-email="${m.email}">Delete</button>
                        </td>
                    </tr>
                `;
            }).join("");

            // Wire delete & extend
            adminStudentsTable.querySelectorAll(".delete-student-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const email = btn.dataset.email;
                    if (confirm(`Remove ${email} from enrolled members?`)) {
                        const updated = getStoredMembers().filter(m => m.email !== email);
                        saveMembers(updated);
                        renderAdminTables();
                    }
                });
            });

            adminStudentsTable.querySelectorAll(".extend-student-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const email = btn.dataset.email;
                    const updated = getStoredMembers().map(m => {
                        if (m.email === email) {
                            const cur = new Date(m.expiryDate > today ? m.expiryDate : today);
                            cur.setDate(cur.getDate() + 30);
                            return { ...m, expiryDate: cur.toISOString().split("T")[0] };
                        }
                        return m;
                    });
                    saveMembers(updated);
                    renderAdminTables();
                });
            });
        }

        // Sessions table
        const sessions = getStoredSessions();
        if (adminSessionsTable) {
            adminSessionsTable.innerHTML = sessions.map(s => `
                <tr>
                    <td><strong>${s.title}</strong></td>
                    <td>${s.date}</td>
                    <td>${s.duration}</td>
                    <td>
                        <button type="button" class="admin-delete-btn delete-session-btn" data-id="${s.id}">Delete</button>
                    </td>
                </tr>
            `).join("");

            adminSessionsTable.querySelectorAll(".delete-session-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.dataset.id;
                    if (confirm("Delete this recorded session? Next week you can upload fresh ones!")) {
                        const updated = getStoredSessions().filter(s => s.id !== id);
                        saveSessions(updated);
                        renderAdminTables();
                        renderSessions();
                    }
                });
            });
        }
    };

    if (adminToggleBtn) {
        adminToggleBtn.addEventListener("click", () => {
            if (adminPanel.classList.contains("is-open")) {
                adminPanel.classList.remove("is-open");
                adminToggleBtn.textContent = "⚙ Instructor & Admin Access";
                return;
            }

            const entered = prompt("Enter Instructor Admin Passcode:", "");
            if (entered === ADMIN_PASSCODE) {
                adminPanel.classList.add("is-open");
                adminToggleBtn.textContent = "✕ Close Instructor Panel";
                renderAdminTables();
            } else if (entered !== null) {
                alert("Incorrect passcode. Access denied.");
            }
        });
    }

    // Add Session
    if (addSessionForm) {
        addSessionForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const title = document.getElementById("session-title").value.trim();
            const date = document.getElementById("session-date").value.trim();
            const duration = document.getElementById("session-duration").value.trim();
            const videoUrl = document.getElementById("session-video-url").value.trim();
            const desc = document.getElementById("session-desc").value.trim();
            const takeawaysRaw = document.getElementById("session-takeaways-input").value.trim();

            if (!title || !videoUrl) return;

            // Normalize youtube embed if needed
            let cleanUrl = videoUrl;
            if (cleanUrl.includes("watch?v=")) {
                cleanUrl = cleanUrl.replace("watch?v=", "embed/");
            } else if (cleanUrl.includes("youtu.be/")) {
                cleanUrl = cleanUrl.replace("youtu.be/", "www.youtube-nocookie.com/embed/");
            }

            const newSession = {
                id: "session-" + Date.now(),
                title,
                date: date || "This Week",
                duration: duration || "45 mins",
                videoUrl: cleanUrl,
                description: desc,
                takeaways: takeawaysRaw ? takeawaysRaw.split("\n").map(l => l.trim()).filter(Boolean) : []
            };

            const sessions = getStoredSessions();
            sessions.unshift(newSession);
            saveSessions(sessions);
            addSessionForm.reset();
            renderAdminTables();
            renderSessions();
            alert("New recorded session published successfully!");
        });
    }

    // Enroll Student
    if (enrollStudentForm) {
        enrollStudentForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = document.getElementById("new-student-email").value.trim().toLowerCase();
            const days = parseInt(document.getElementById("new-student-duration").value, 10) || 30;

            if (!email) return;

            const members = getStoredMembers();
            const existingIndex = members.findIndex(m => m.email.toLowerCase() === email);
            const today = new Date().toISOString().split("T")[0];
            const expiry = addDays(days);

            if (existingIndex >= 0) {
                members[existingIndex].expiryDate = expiry;
                members[existingIndex].status = "active";
            } else {
                members.push({
                    email,
                    enrolledDate: today,
                    expiryDate: expiry,
                    status: "active"
                });
            }

            saveMembers(members);
            enrollStudentForm.reset();
            renderAdminTables();
            alert(`Student ${email} enrolled! Access valid for ${days} days (until ${expiry}).`);
        });
    }
})();
