(() => {
    "use strict";

    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".site-navigation");
    const header = document.querySelector(".site-header");
    
    if (header) {
        if (!header.classList.contains("is-fixed")) header.classList.add("is-fixed");
        const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 48);
        window.addEventListener("scroll", updateHeader, { passive: true });
        updateHeader();
    }

    if (toggle && navigation) {
        toggle.addEventListener("click", () => {
            const isOpen = toggle.getAttribute("aria-expanded") !== "true";
            toggle.setAttribute("aria-expanded", String(isOpen));
            toggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
            navigation.classList.toggle("is-open", isOpen);
        });

        navigation.addEventListener("click", event => {
            if (event.target.closest("a")) {
                navigation.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.setAttribute("aria-label", "Open navigation");
            }
        });
    }

    const newsletterForm = document.querySelector("#newsletter-form");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", event => {
            event.preventDefault();
            const input = newsletterForm.querySelector("#newsletter-email");
            if (!input || !input.reportValidity()) return;

            const feedback = newsletterForm.parentElement.querySelector("#newsletter-feedback");
            if (feedback) {
                feedback.replaceChildren(document.createTextNode("One last step: "));
                const link = document.createElement("a");
                link.textContent = "send your subscription request";
                link.href = `mailto:contact@manifestwithjaya.com?subject=${encodeURIComponent("Newsletter subscription request")}&body=${encodeURIComponent(`Hi Jaya,\n\nI’d like to receive your tips, updates, and inspiration by email.\n\nPlease subscribe: ${input.value.trim()}\n\nThank you!`)}`;
                feedback.append(link, document.createTextNode(". You’ll join after your request is confirmed."));
                feedback.hidden = false;
                link.focus();
            }
        });
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if ("IntersectionObserver" in window && !reduceMotion) {
        document.documentElement.classList.add("js-ready");
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("is-visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: "0px 0px 24px 0px" });

        document.querySelectorAll("[data-reveal]").forEach(element => observer.observe(element));
    }

    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener("click", event => {
            const href = link.getAttribute("href");
            if (!href || href === "#" || link.hasAttribute("data-bs-toggle") || href.includes("Modal")) return;
            const target = document.getElementById(href.slice(1));
            if (!target || target.classList.contains("modal")) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
    });

    /* ------------------------------------------------------------
       Universal Booking Modal Controller
       ------------------------------------------------------------ */
    const initBookingModal = () => {
        const bookingElement = document.querySelector("#bookingModal");
        if (!bookingElement || !window.bootstrap || !window.bootstrap.Modal) return;
        if (bookingElement.dataset.initialized) return;
        bookingElement.dataset.initialized = "true";

        const bookingModal = bootstrap.Modal.getOrCreateInstance(bookingElement);
        const bookingForm = document.querySelector("#booking-form");
        const bookingDate = document.querySelector("#booking-date");
        const contactEmail = "contact@manifestwithjaya.com";

        if (bookingDate) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateValue = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            bookingDate.min = dateValue(tomorrow);
        }

        let timezone = "your local time zone";
        try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " "); } catch (_) {}
        const tzElem = document.querySelector("#booking-timezone");
        if (tzElem) tzElem.textContent = timezone;

        window.openBooking = (type = "clarity", focus = "") => {
            if (toggle && navigation && navigation.classList.contains("is-open")) {
                navigation.classList.remove("is-open");
                toggle.setAttribute("aria-expanded", "false");
            }
            if (bookingForm) {
                bookingForm.reset();
                bookingForm.classList.remove("was-validated");
                const nameInput = document.querySelector("#booking-name");
                if (nameInput) nameInput.setCustomValidity("");
                bookingForm.hidden = false;
            }
            const confirmBox = document.querySelector("#booking-confirmation");
            if (confirmBox) confirmBox.hidden = true;

            const typeInput = document.querySelector("#booking-type");
            if (typeInput) typeInput.value = type;

            const isCommunity = type === "community";
            const titleElem = document.querySelector("#booking-title");
            const eyebrowElem = document.querySelector("#booking-eyebrow");
            const subtitleElem = document.querySelector("#booking-subtitle");
            const msgElem = document.querySelector("#booking-message");
            const focusElem = document.querySelector("#booking-focus");

            if (titleElem) titleElem.textContent = isCommunity ? "Bring your community together." : "Let’s begin with a conversation.";
            if (eyebrowElem) eyebrowElem.textContent = isCommunity ? "A shared space for growth" : "A little clarity. A beautiful beginning.";
            if (subtitleElem) subtitleElem.textContent = isCommunity
                ? "Tell me a little about your club, organisation, or team. We’ll explore a meaningful workshop tailored to your community."
                : "A free, confidential 30-minute clarity call to explore where you are and what you’d love to change.";
            if (msgElem) msgElem.placeholder = isCommunity
                ? "Organisation name, approximate group size, and the kind of session you have in mind…"
                : "A little about what brings you here…";
            if (focusElem) {
                if (isCommunity) focusElem.value = "Community Workshop";
                else if (focus) focusElem.value = focus;
            }

            const currentModal = document.querySelector(".modal.show");
            if (currentModal && currentModal !== bookingElement) {
                currentModal.addEventListener("hidden.bs.modal", () => bookingModal.show(), { once: true });
                bootstrap.Modal.getInstance(currentModal).hide();
            } else {
                bookingModal.show();
            }
        };

        document.querySelectorAll("[data-book]").forEach(button => {
            button.addEventListener("click", event => {
                event.preventDefault();
                window.openBooking(button.dataset.book || "clarity", button.dataset.focus || "");
            });
        });

        if (window.location.hash === "#booking" || window.location.hash === "#bookingModal" || new URLSearchParams(window.location.search).get("book")) {
            setTimeout(() => window.openBooking("clarity"), 350);
        }

        const nameInput = document.querySelector("#booking-name");
        if (nameInput) {
            nameInput.addEventListener("input", event => {
                event.target.setCustomValidity(event.target.value.trim().length < 2 ? "Please enter your name." : "");
            });
        }

        let requestBody = "";
        const FORM_DELIVERY_ENDPOINT = "https://api.web3forms.com/submit";
        const WEB3FORMS_ACCESS_KEY = "c18d3637-e547-49d5-8f64-d34eec49e491";

        if (bookingForm) {
            bookingForm.addEventListener("submit", async event => {
                event.preventDefault();
                if (nameInput) {
                    nameInput.setCustomValidity(nameInput.value.trim().length < 2 ? "Please enter your name." : "");
                }
                bookingForm.classList.add("was-validated");
                if (!bookingForm.checkValidity()) {
                    const invalid = bookingForm.querySelector(":invalid");
                    if (invalid) invalid.focus();
                    return;
                }

                const submitBtn = document.querySelector("#booking-submit-btn");
                const submitBtnText = document.querySelector("#booking-btn-text");
                const originalBtnText = submitBtnText ? submitBtnText.textContent : "Book your free clarity call";
                if (submitBtn) submitBtn.disabled = true;
                if (submitBtnText) submitBtnText.textContent = "Sending request to Jaya...";

                const name = nameInput ? nameInput.value.trim() : "";
                const emailInput = document.querySelector("#booking-email");
                const email = emailInput ? emailInput.value.trim() : "";
                const phoneInput = document.querySelector("#booking-phone");
                const phone = phoneInput ? phoneInput.value.trim() : "Not provided";
                const focusInput = document.querySelector("#booking-focus");
                const focus = focusInput ? focusInput.value : "Finding clarity";
                const dateInput = document.querySelector("#booking-date");
                const date = dateInput && dateInput.value ? new Date(dateInput.value + "T12:00:00") : new Date();
                const formattedDate = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                const timeInput = document.querySelector("#booking-time");
                const time = timeInput ? timeInput.value : "10:00 AM";
                const typeInput = document.querySelector("#booking-type");
                const isCommunity = typeInput ? typeInput.value === "community" : false;
                const sessionName = isCommunity ? "Community workshop conversation" : "Free 30-minute clarity call";
                const msgElem = document.querySelector("#booking-message");
                const message = msgElem ? msgElem.value.trim() : "";

                requestBody = [
                    "Hi Jaya,",
                    "",
                    `I’d love to request a ${sessionName.toLowerCase()}.`,
                    "",
                    `Name: ${name}`,
                    `Email: ${email}`,
                    `Phone / WhatsApp: ${phone}`,
                    `Focus: ${focus}`,
                    `Preferred date: ${formattedDate}`,
                    `Preferred time: ${time} (${timezone})`,
                    message ? `\nA little more about me / my community:\n${message}` : "",
                    "",
                    "I understand that this time is a request and is subject to your confirmation.",
                    "I agree to be contacted about this session.",
                    "",
                    "Thank you!"
                ].filter(line => line !== undefined).join("\n");

                try {
                    const payload = {
                        access_key: WEB3FORMS_ACCESS_KEY,
                        subject: `New Clarity Call Booking: ${name} (${focus})`,
                        from_name: name,
                        replyto: email,
                        name: name,
                        email: email,
                        phone: phone,
                        focus_area: focus,
                        session_type: sessionName,
                        preferred_date: formattedDate,
                        preferred_time: `${time} (${timezone})`,
                        message: message || "No additional message"
                    };

                    await fetch(FORM_DELIVERY_ENDPOINT, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Accept": "application/json" },
                        body: JSON.stringify(payload)
                    });
                } catch (err) {
                    console.warn("Direct form delivery fallback:", err);
                } finally {
                    if (submitBtn) submitBtn.disabled = false;
                    if (submitBtnText) submitBtnText.textContent = originalBtnText;
                }

                const confirmTitle = document.querySelector("#confirmation-title");
                if (confirmTitle) confirmTitle.textContent = `Thank you, ${name.split(" ")[0]}!`;
                const confirmationDesc = document.querySelector("#confirmation-desc");
                if (confirmationDesc) {
                    confirmationDesc.textContent = `Your ${sessionName.toLowerCase()} request has been sent to Jaya. She will contact you directly at ${email} or via WhatsApp at ${phone} to confirm your appointment.`;
                }
                const summaryElem = document.querySelector("#booking-summary");
                if (summaryElem) {
                    summaryElem.textContent = `${sessionName}\nFocus: ${focus}\nDate: ${formattedDate} · ${time}\nPhone: ${phone}\nReply to: ${email}`;
                }
                const emailLink = document.querySelector("#booking-email-link");
                if (emailLink) {
                    emailLink.href = `mailto:${contactEmail}?subject=${encodeURIComponent(isCommunity ? "Community workshop request" : "Free clarity call request")}&body=${encodeURIComponent(requestBody)}`;
                }

                bookingForm.hidden = true;
                const confirmBox = document.querySelector("#booking-confirmation");
                if (confirmBox) confirmBox.hidden = false;
            });
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initBookingModal);
    } else {
        initBookingModal();
    }
})();
