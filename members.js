(() => {
    "use strict";

    // -------------------------------------------------------------------------
    // 01. CONFIGURATION & STATE
    // -------------------------------------------------------------------------
    const STORAGE_KEY_MEMBERS = "manifest_subscribers_v2";
    const STORAGE_KEY_SESSIONS = "manifest_sessions_v2";
    const ADMIN_PASSCODE = "jaya2026";
    const API_ENDPOINT = "api/members.php";

    let isApiMode = false;
    let currentAdminPasscode = "";
    let activeMemberData = null;
    let timerInterval = null;

    // Helper: calculate date string (YYYY-MM-DD)
    const addDays = (days) => {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split("T")[0];
    };

    const nowMs = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // Default seed members
    const initialMembers = [
        { email: "student@example.com", name: "Priya Sharma", enrolledDate: "2026-09-15", expiryDate: addDays(25), status: "active" },
        { email: "client@example.com", name: "Neha Reddy", enrolledDate: "2026-09-01", expiryDate: addDays(10), status: "active" },
        { email: "expired@example.com", name: "Rohit Verma", enrolledDate: "2026-07-01", expiryDate: "2026-08-31", status: "expired" }
    ];

    // Default seed sessions (with active 5-day windows)
    const initialSessions = [
        {
            id: "session-1",
            title: "Subconscious Reprogramming & Manifestation Resistance",
            date: "Week of Oct 16, 2026",
            duration: "54 mins",
            videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
            description: "In this week’s session, we uncover subconscious fears that masquerade as logic, and install empowering affirmations directly into the somatic field.",
            takeaways: [
                "How to identify the subconscious fear keeping you in repetitive cycles.",
                "Somatic EFT sequence for emotional neutralization before bedtime.",
                "Guided Ho’oponopono forgiveness sequence for personal peace."
            ],
            createdAt: new Date(nowMs - (1 * DAY_MS)).toISOString(),
            expiresAt: nowMs + (4 * DAY_MS), // 4 days remaining (total 5 days)
            lifespanDays: 5
        },
        {
            id: "session-2",
            title: "Guided Morning Alignment & Energy Activation",
            date: "Week of Oct 15, 2026",
            duration: "24 mins",
            videoUrl: "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ",
            description: "A restorative 24-minute practice to ground your energy into confidence, gratitude, and expectant receiving.",
            takeaways: [
                "Breathwork pacing for nervous system reset.",
                "Heart-brain coherence meditation practice.",
                "Daily intention setting prompt."
            ],
            createdAt: new Date(nowMs - (2 * DAY_MS)).toISOString(),
            expiresAt: nowMs + (3 * DAY_MS), // 3 days remaining (total 5 days)
            lifespanDays: 5
        }
    ];

    // LocalStorage Getters/Setters (used offline or when PHP API is not hosted)
    const getStoredMembers = () => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_MEMBERS);
            return raw ? JSON.parse(raw) : initialMembers;
        } catch {
            return initialMembers;
        }
    };

    const saveMembers = (members) => {
        try {
            localStorage.setItem(STORAGE_KEY_MEMBERS, JSON.stringify(members));
        } catch (e) {
            console.warn("Could not save members to localStorage:", e);
        }
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
        try {
            localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
        } catch (e) {
            console.warn("Could not save sessions to localStorage:", e);
        }
    };

    // Initialize local seed data
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
    const adminClearSessionsBtn = document.getElementById("admin-clear-sessions-btn");

    // -------------------------------------------------------------------------
    // 03. TIME & 5-DAY EXPIRATION UTILITIES
    // -------------------------------------------------------------------------
    const getSessionExpiryInfo = (session) => {
        const now = Date.now();
        let expiresAtMs = session.expiresAt;

        if (!expiresAtMs) {
            const created = session.createdAt ? new Date(session.createdAt).getTime() : now;
            const days = session.lifespanDays || 5;
            expiresAtMs = created + (days * DAY_MS);
        } else if (typeof expiresAtMs === "string") {
            expiresAtMs = new Date(expiresAtMs).getTime();
        }

        const diff = expiresAtMs - now;
        const isExpired = diff <= 0;

        if (isExpired) {
            return {
                isExpired: true,
                badgeHtml: `<span class="session-countdown-pill is-expired">🔒 5-Day Window Expired</span>`,
                statusText: "Expired (Window Closed)",
                diff
            };
        }

        const days = Math.floor(diff / DAY_MS);
        const hours = Math.floor((diff % DAY_MS) / (60 * 60 * 1000));
        const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

        let badgeHtml = "";
        let statusText = "";

        if (days >= 1) {
            badgeHtml = `<span class="session-countdown-pill is-active">⏳ ${days}d ${hours}h remaining</span>`;
            statusText = `Active (${days}d ${hours}h left)`;
        } else {
            badgeHtml = `<span class="session-countdown-pill is-expiring">⏳ ${hours}h ${mins}m left (Expiring soon)</span>`;
            statusText = `Expiring soon (${hours}h left)`;
        }

        return { isExpired: false, badgeHtml, statusText, diff };
    };

    // -------------------------------------------------------------------------
    // 04. BACKEND API DETECTOR
    // -------------------------------------------------------------------------
    const detectBackendApi = async () => {
        if (window.location.protocol === "file:") {
            isApiMode = false;
            return;
        }

        try {
            const res = await fetch(API_ENDPOINT + "?action=status", {
                method: "GET",
                headers: { "Accept": "application/json" }
            });
            if (res.ok) {
                const data = await res.json();
                if (data.ok) {
                    isApiMode = true;
                    console.log("Manifest API backend connected (GoDaddy PHP server).");
                    return;
                }
            }
        } catch {
            isApiMode = false;
        }
    };

    // -------------------------------------------------------------------------
    // 05. SESSIONS RENDERING
    // -------------------------------------------------------------------------
    const renderSessions = (sessions) => {
        if (!sessionsContainer) return;
        const list = sessions || (isApiMode ? [] : getStoredSessions());

        if (!list || list.length === 0) {
            sessionsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <p class="text-muted">No recorded sessions currently published. Jaya will upload this week’s practice shortly!</p>
                </div>
            `;
            return;
        }

        sessionsContainer.innerHTML = list.map(session => {
            const expiry = getSessionExpiryInfo(session);
            const isExp = expiry.isExpired;

            return `
                <article class="session-card ${isExp ? "is-card-expired" : ""}" id="${session.id}">
                    <div class="session-video-wrapper">
                        ${isExp ? `
                            <div class="session-expired-placeholder" role="alert">
                                <div class="session-expired-icon" aria-hidden="true">⏳</div>
                                <h4>5-Day Viewing Window Concluded</h4>
                                <p>This recorded DMJ session was available for 5 days. Next week’s new practice and live energetic alignment will replace this session shortly.</p>
                            </div>
                        ` : `
                            <iframe src="${session.videoUrl}" title="${session.title}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen loading="lazy"></iframe>
                        `}
                    </div>
                    <div class="session-card-content">
                        <div class="session-meta-row">
                            <span>${session.date}</span>
                            <span>⏱ ${session.duration}</span>
                        </div>
                        <h3 class="session-card-title">${session.title}</h3>
                        <p class="session-card-desc">${session.description || ""}</p>
                        ${session.takeaways && session.takeaways.length ? `
                            <strong class="text-muted small text-uppercase" style="letter-spacing:0.06em;font-size:11px;">Key Highlights:</strong>
                            <ul class="session-takeaways">
                                ${session.takeaways.map(t => `<li>${t}</li>`).join("")}
                            </ul>
                        ` : ""}
                        <div class="session-actions-row">
                            ${expiry.badgeHtml}
                            <a href="#bookingModal" class="button button-outline" style="padding:6px 16px;min-height:36px;font-size:11px;" data-bs-toggle="modal" data-bs-target="#bookingModal">Ask Jaya a question</a>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    };

    // Live update countdowns every 60 seconds
    const startCountdownTimer = () => {
        if (timerInterval) clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            if (portalView && portalView.style.display !== "none") {
                renderSessions();
                if (adminPanel && adminPanel.classList.contains("is-open")) {
                    renderAdminTables();
                }
            }
        }, 60000);
    };

    // -------------------------------------------------------------------------
    // 06. AUTHENTICATION & PORTAL ACTIVATION
    // -------------------------------------------------------------------------
    const showStatus = (text, type = "error") => {
        if (!statusMsg) return;
        statusMsg.className = `members-status-msg is-${type}`;
        statusMsg.innerHTML = text;
        statusMsg.style.display = "block";
    };

    const hideStatus = () => {
        if (!statusMsg) return;
        statusMsg.style.display = "none";
        statusMsg.innerHTML = "";
    };

    const activatePortal = (member, sessions = null) => {
        activeMemberData = member;
        if (gateSection) gateSection.style.display = "none";
        if (portalView) portalView.style.display = "block";
        if (userEmailDisplay) userEmailDisplay.textContent = member.email;

        if (userExpiryDisplay) {
            const expDate = new Date(member.expiryDate + "T12:00:00").toLocaleDateString(undefined, {
                year: "numeric", month: "short", day: "numeric"
            });
            userExpiryDisplay.textContent = `DMJ Membership Active — Access Valid until ${expDate}`;
        }

        renderSessions(sessions);
        startCountdownTimer();
        sessionStorage.setItem("active_member_email", member.email);
    };

    const deactivatePortal = () => {
        activeMemberData = null;
        if (timerInterval) clearInterval(timerInterval);
        sessionStorage.removeItem("active_member_email");
        if (gateSection) gateSection.style.display = "block";
        if (portalView) portalView.style.display = "none";
        hideStatus();
        if (loginEmailInput) loginEmailInput.value = "";
    };

    // Student Login Handler
    const handleLogin = async (email) => {
        hideStatus();
        const cleanEmail = email.toLowerCase().trim();

        if (isApiMode) {
            try {
                const res = await fetch(API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "login", email: cleanEmail })
                });
                const data = await res.json();

                if (data.ok) {
                    activatePortal(data.member, data.sessions);
                } else if (data.reason === "expired") {
                    const exp = data.member?.expiryDate || "recently";
                    showStatus(`
                        <strong>Subscription Expired:</strong> Your DMJ access ended on <strong>${exp}</strong>.<br>
                        To renew and watch this week's 5-day recorded sessions, please <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#8d6e15;text-decoration:underline;font-weight:700;">renew your enrollment</a> or email <a href="mailto:contact@manifestwithjaya.com" style="color:#8d6e15;text-decoration:underline;">contact@manifestwithjaya.com</a>.
                    `, "expired");
                } else {
                    showStatus(`
                        <strong>Email Not Found:</strong> We couldn't find <em>${cleanEmail}</em> on the enrolled members list.<br>
                        Only registered and paid DMJ members have access. Please <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#b71c1c;text-decoration:underline;font-weight:700;">enroll in the program</a> to activate your access.
                    `, "error");
                }
                return;
            } catch (err) {
                console.warn("API login failed, falling back to local verification:", err);
            }
        }

        // Local Storage Verification Mode
        const members = getStoredMembers();
        const member = members.find(m => m.email.toLowerCase() === cleanEmail);

        if (!member) {
            showStatus(`
                <strong>Email Not Found:</strong> We couldn't find <em>${cleanEmail}</em> on the enrolled members list.<br>
                Only registered and paid DMJ members have access. Please <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#b71c1c;text-decoration:underline;font-weight:700;">enroll in the program</a> to activate your access.
            `, "error");
            return;
        }

        const today = new Date().toISOString().split("T")[0];
        if (member.expiryDate < today) {
            showStatus(`
                <strong>Subscription Expired:</strong> Your DMJ access ended on <strong>${member.expiryDate}</strong>.<br>
                To renew and watch this week's 5-day recorded sessions, please <a href="#enrollModal" data-bs-toggle="modal" data-bs-target="#enrollModal" style="color:#8d6e15;text-decoration:underline;font-weight:700;">renew your enrollment</a> or email <a href="mailto:contact@manifestwithjaya.com" style="color:#8d6e15;text-decoration:underline;">contact@manifestwithjaya.com</a>.
            `, "expired");
            return;
        }

        activatePortal(member);
    };

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const email = loginEmailInput.value.trim();
            if (email) handleLogin(email);
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener("click", deactivatePortal);
    }

    // -------------------------------------------------------------------------
    // 07. INSTRUCTOR ADMIN PANEL
    // -------------------------------------------------------------------------
    const renderAdminTables = async () => {
        let members = [];
        let sessions = [];

        if (isApiMode && currentAdminPasscode) {
            try {
                const res = await fetch(API_ENDPOINT, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "admin_get_data", passcode: currentAdminPasscode })
                });
                const data = await res.json();
                if (data.ok) {
                    members = data.members;
                    sessions = data.sessions;
                }
            } catch (e) {
                console.warn("Failed fetching admin data via API:", e);
            }
        }

        if (members.length === 0) members = getStoredMembers();
        if (sessions.length === 0) sessions = getStoredSessions();

        const today = new Date().toISOString().split("T")[0];

        // 1. Members Table
        if (adminStudentsTable) {
            adminStudentsTable.innerHTML = members.map(m => {
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

            // Wire delete student
            adminStudentsTable.querySelectorAll(".delete-student-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const email = btn.dataset.email;
                    if (!confirm(`Remove ${email} from enrolled members?`)) return;

                    if (isApiMode && currentAdminPasscode) {
                        try {
                            await fetch(API_ENDPOINT, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "delete_student", passcode: currentAdminPasscode, email })
                            });
                        } catch {}
                    }

                    const updated = getStoredMembers().filter(m => m.email !== email);
                    saveMembers(updated);
                    renderAdminTables();
                });
            });

            // Wire extend student
            adminStudentsTable.querySelectorAll(".extend-student-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const email = btn.dataset.email;

                    if (isApiMode && currentAdminPasscode) {
                        try {
                            await fetch(API_ENDPOINT, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "extend_student", passcode: currentAdminPasscode, email })
                            });
                        } catch {}
                    }

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

        // 2. Sessions Table with 5-Day Status
        if (adminSessionsTable) {
            adminSessionsTable.innerHTML = sessions.map(s => {
                const expiry = getSessionExpiryInfo(s);
                return `
                    <tr>
                        <td><strong>${s.title}</strong></td>
                        <td>${s.date}</td>
                        <td><span style="font-size:11px;font-weight:600;color:${expiry.isExpired ? "#c62828" : "#2e7d32"};">${expiry.statusText}</span></td>
                        <td>
                            <button type="button" class="admin-delete-btn delete-session-btn" data-id="${s.id}">Delete</button>
                        </td>
                    </tr>
                `;
            }).join("");

            adminSessionsTable.querySelectorAll(".delete-session-btn").forEach(btn => {
                btn.addEventListener("click", async () => {
                    const id = btn.dataset.id;
                    if (!confirm("Delete this recorded session?")) return;

                    if (isApiMode && currentAdminPasscode) {
                        try {
                            await fetch(API_ENDPOINT, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ action: "delete_session", passcode: currentAdminPasscode, id })
                            });
                        } catch {}
                    }

                    const updated = getStoredSessions().filter(s => s.id !== id);
                    saveSessions(updated);
                    renderAdminTables();
                    renderSessions();
                });
            });
        }
    };

    // Admin Toggle Passcode
    if (adminToggleBtn) {
        adminToggleBtn.addEventListener("click", async () => {
            if (adminPanel.classList.contains("is-open")) {
                adminPanel.classList.remove("is-open");
                adminToggleBtn.textContent = "⚙ Instructor & Admin Access";
                return;
            }

            const entered = prompt("Enter Instructor Admin Passcode:", "");
            if (!entered) return;

            let authorized = false;
            if (isApiMode) {
                try {
                    const res = await fetch(API_ENDPOINT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "admin_verify", passcode: entered })
                    });
                    const d = await res.json();
                    authorized = d.ok;
                } catch {
                    authorized = (entered === ADMIN_PASSCODE);
                }
            } else {
                authorized = (entered === ADMIN_PASSCODE);
            }

            if (authorized) {
                currentAdminPasscode = entered;
                adminPanel.classList.add("is-open");
                adminToggleBtn.textContent = "✕ Close Instructor Panel";
                renderAdminTables();
            } else {
                alert("Incorrect passcode. Access denied.");
            }
        });
    }

    // Publish New Session Form Handler
    if (addSessionForm) {
        addSessionForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const title = document.getElementById("session-title").value.trim();
            const date = document.getElementById("session-date").value.trim();
            const duration = document.getElementById("session-duration").value.trim();
            const videoUrl = document.getElementById("session-video-url").value.trim();
            const lifespanDays = parseInt(document.getElementById("session-lifespan")?.value || "5", 10);
            const replaceOld = document.getElementById("session-replace-old")?.checked || false;
            const desc = document.getElementById("session-desc").value.trim();
            const takeawaysRaw = document.getElementById("session-takeaways-input").value.trim();

            if (!title || !videoUrl) return;

            // Format embed URL
            let cleanUrl = videoUrl;
            if (cleanUrl.includes("watch?v=")) {
                cleanUrl = cleanUrl.replace("watch?v=", "embed/");
            } else if (cleanUrl.includes("youtu.be/")) {
                cleanUrl = cleanUrl.replace("youtu.be/", "www.youtube-nocookie.com/embed/");
            }

            const now = Date.now();
            const takeaways = takeawaysRaw ? takeawaysRaw.split("\n").map(l => l.trim()).filter(Boolean) : [];

            if (isApiMode && currentAdminPasscode) {
                try {
                    const res = await fetch(API_ENDPOINT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            action: "add_session",
                            passcode: currentAdminPasscode,
                            title,
                            date: date || "This Week",
                            duration: duration || "45 mins",
                            videoUrl: cleanUrl,
                            description: desc,
                            takeaways,
                            lifespanDays,
                            replaceOld
                        })
                    });
                    const d = await res.json();
                    if (!d.ok) {
                        alert(d.error || "Could not publish session.");
                        return;
                    }
                } catch (err) {
                    console.warn("API add session failed, saving locally:", err);
                }
            }

            // Local storage update
            const newSession = {
                id: "session-" + now,
                title,
                date: date || "This Week",
                duration: duration || "45 mins",
                videoUrl: cleanUrl,
                description: desc,
                takeaways,
                createdAt: new Date(now).toISOString(),
                expiresAt: now + (lifespanDays * DAY_MS),
                lifespanDays
            };

            let sessions = getStoredSessions();
            if (replaceOld) {
                sessions = [newSession];
            } else {
                sessions.unshift(newSession);
            }

            saveSessions(sessions);
            addSessionForm.reset();
            renderAdminTables();
            renderSessions();
            alert(`New recorded session published successfully! It will be accessible for ${lifespanDays} days.`);
        });
    }

    // 1-Click Clear All Sessions Button
    if (adminClearSessionsBtn) {
        adminClearSessionsBtn.addEventListener("click", async () => {
            if (!confirm("Are you sure you want to clear/archive all current sessions? This will provide a clean slate for next week's upload.")) return;

            if (isApiMode && currentAdminPasscode) {
                const sessions = getStoredSessions();
                for (const s of sessions) {
                    try {
                        await fetch(API_ENDPOINT, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "delete_session", passcode: currentAdminPasscode, id: s.id })
                        });
                    } catch {}
                }
            }

            saveSessions([]);
            renderAdminTables();
            renderSessions([]);
            alert("All previous week's sessions have been cleared. Ready for next week's upload!");
        });
    }

    // Enroll Student Form Handler
    if (enrollStudentForm) {
        enrollStudentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("new-student-email").value.trim().toLowerCase();
            const days = parseInt(document.getElementById("new-student-duration").value, 10) || 30;

            if (!email) return;

            if (isApiMode && currentAdminPasscode) {
                try {
                    await fetch(API_ENDPOINT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "enroll_student", passcode: currentAdminPasscode, email, days })
                    });
                } catch (err) {
                    console.warn("API enroll failed, saving locally:", err);
                }
            }

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
            alert(`Student ${email} enrolled! DMJ Access valid for ${days} days (until ${expiry}).`);
        });
    }

    // -------------------------------------------------------------------------
    // 08. INITIALIZATION
    // -------------------------------------------------------------------------
    detectBackendApi().then(() => {
        // Auto-login from existing session storage
        const savedEmail = sessionStorage.getItem("active_member_email");
        if (savedEmail) {
            handleLogin(savedEmail);
        }
    });

})();
