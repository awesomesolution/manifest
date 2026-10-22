(() => {
            "use strict";

            const $ = (selector, root = document) => root.querySelector(selector);
            const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const contactEmail = "contact@manifestwithjaya.com";

            /* ------------------------------------------------------------
               Navigation: mobile collapse, section states, healing focus.
               ------------------------------------------------------------ */
            const navigation = $("#site-navigation");
            const navToggle = $(".nav-toggle");
            const closeNavigation = () => {
                if (navigation && navigation.classList.contains("is-open")) {
                    navigation.classList.remove("is-open");
                    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
                }
            };
            if (navToggle && navigation) {
                navToggle.addEventListener("click", () => {
                    const isOpen = navigation.classList.toggle("is-open");
                    navToggle.setAttribute("aria-expanded", String(isOpen));
                });
            }
            const header = $(".site-header");
            if (header && !header.classList.contains("is-fixed")) {
                header.classList.add("is-fixed");
            }
            let headerIsScrolled = false;
            const updateHeaderOnScroll = () => {
                const shouldShowScrolledHeader = window.scrollY > 40;
                if (shouldShowScrolledHeader === headerIsScrolled) return;
                headerIsScrolled = shouldShowScrolledHeader;
                header.classList.toggle("is-scrolled", headerIsScrolled);
            };
            window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });
            updateHeaderOnScroll();

            $$(".nav-link, .nav-link-custom, .header-cta, .nav-book").forEach(link => {
                link.addEventListener("click", closeNavigation);
            });

            const setActiveNav = id => {
                $$(".nav-link, .nav-link-custom").forEach(link => {
                    const href = link.getAttribute("href") || "";
                    const active = (href === "#" + id || href.endsWith("#" + id)) && !link.hasAttribute("data-healing");
                    link.classList.toggle("active", active);
                    if (active) link.setAttribute("aria-current", "page");
                    else link.removeAttribute("aria-current");
                });
            };

            $$('a[href^="#"]').forEach(link => {
                if (link.hasAttribute("data-bs-toggle") || link.hasAttribute("data-bs-dismiss")) return;
                link.addEventListener("click", event => {
                    const target = document.getElementById(link.getAttribute("href").slice(1));
                    if (!target) return;
                    event.preventDefault();
                    closeNavigation();
                    target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
                });
            });

            $$("[data-healing]").forEach(link => {
                link.addEventListener("click", () => {
                    const healingCards = [$("#chakra-healing"), $("#emotional-healing")];
                    healingCards.forEach(card => card.classList.add("is-highlighted"));
                    setTimeout(() => healingCards.forEach(card => card.classList.remove("is-highlighted")), 3500);
                });
            });

            /* ------------------------------------------------------------
               Scroll reveals: progressive enhancement and reduced motion.
               ------------------------------------------------------------ */
            if ("IntersectionObserver" in window) {
                document.documentElement.classList.add("js-ready");
                const revealObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-visible");
                            revealObserver.unobserve(entry.target);
                        }
                    });
                }, { threshold: .06, rootMargin: "0px 0px 25px 0px" });

                $$(".reveal").forEach((element, index) => {
                    if (element.classList.contains("transformation-card") || element.classList.contains("program-card")) {
                        element.style.transitionDelay = reducedMotion ? "0ms" : `${(index % 6) * 45}ms`;
                    }
                    revealObserver.observe(element);
                });

                const sectionObserver = new IntersectionObserver(entries => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) setActiveNav(entry.target.id);
                    });
                }, { rootMargin: "-10% 0px -55% 0px", threshold: 0 });
                ["home", "about", "programs", "testimonials", "contact"].forEach(id => {
                    const section = document.getElementById(id);
                    if (section) sectionObserver.observe(section);
                });
            }

            /* ------------------------------------------------------------
               Shared modal transition utility.
               ------------------------------------------------------------ */
            const bookingElement = $("#bookingModal");
            const detailElement = $("#detailModal");
            const bookingModal = new bootstrap.Modal(bookingElement);
            const detailModal = new bootstrap.Modal(detailElement);

            function showAfterClosingCurrent(modal) {
                const current = $(".modal.show");
                if (current && current !== modal._element) {
                    current.addEventListener("hidden.bs.modal", () => modal.show(), { once: true });
                    bootstrap.Modal.getInstance(current).hide();
                } else {
                    modal.show();
                }
            }

            /* ------------------------------------------------------------
               Booking request: accessible validation + real email handoff.
               ------------------------------------------------------------ */
            const bookingForm = $("#booking-form");
            const bookingDate = $("#booking-date");
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const dateValue = date => {
                return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
            };
            bookingDate.min = dateValue(tomorrow);

            let timezone = "your local time zone";
            try { timezone = Intl.DateTimeFormat().resolvedOptions().timeZone.replaceAll("_", " "); } catch (_) {}
            $("#booking-timezone").textContent = timezone;

            function openBooking(type = "clarity", focus = "") {
                closeNavigation();
                bookingForm.reset();
                bookingForm.classList.remove("was-validated");
                $("#booking-name").setCustomValidity("");
                bookingForm.hidden = false;
                $("#booking-confirmation").hidden = true;
                $("#booking-type").value = type;
                const community = type === "community";
                $("#booking-title").textContent = community ? "Bring your community together." : "Let’s begin with a conversation.";
                $("#booking-eyebrow").textContent = community ? "A shared space for growth" : "A little clarity. A beautiful beginning.";
                $("#booking-subtitle").textContent = community
                    ? "Tell me a little about your club, organisation, or team. We’ll explore a meaningful workshop tailored to your community."
                    : "A free, confidential 30-minute clarity call to explore where you are and what you’d love to change.";
                $("#booking-message").placeholder = community
                    ? "Organisation name, approximate group size, and the kind of session you have in mind…"
                    : "A little about what brings you here…";
                if (community) $("#booking-focus").value = "Community Workshop";
                else if (focus) $("#booking-focus").value = focus;
                showAfterClosingCurrent(bookingModal);
            }

            $$("[data-book]").forEach(button => {
                button.addEventListener("click", () => openBooking(button.dataset.book || "clarity", button.dataset.focus || ""));
            });

            if (window.location.hash === "#booking" || window.location.hash === "#bookingModal" || new URLSearchParams(window.location.search).get("book")) {
                setTimeout(() => openBooking("clarity"), 350);
            }

            const bookingNameInput = $("#booking-name");
            if (bookingNameInput) {
                bookingNameInput.addEventListener("input", event => {
                    event.target.setCustomValidity(event.target.value.trim().length < 2 ? "Please enter your name." : "");
                });
            }

            let requestBody = "";
            const FORM_DELIVERY_ENDPOINT = "https://api.web3forms.com/submit";
            const WEB3FORMS_ACCESS_KEY = "c18d3637-e547-49d5-8f64-d34eec49e491"; // Default key; client can replace with own free key from https://web3forms.com

            bookingForm.addEventListener("submit", async event => {
                event.preventDefault();
                const nameInput = $("#booking-name");
                nameInput.setCustomValidity(nameInput.value.trim().length < 2 ? "Please enter your name." : "");
                bookingForm.classList.add("was-validated");
                if (!bookingForm.checkValidity()) {
                    const invalid = bookingForm.querySelector(":invalid");
                    if (invalid) invalid.focus();
                    return;
                }

                const submitBtn = $("#booking-submit-btn");
                const submitBtnText = $("#booking-btn-text");
                const originalBtnText = submitBtnText ? submitBtnText.textContent : "Book your free clarity call";
                if (submitBtn) submitBtn.disabled = true;
                if (submitBtnText) submitBtnText.textContent = "Sending request to Jaya...";

                const name = nameInput.value.trim();
                const email = $("#booking-email").value.trim();
                const phone = $("#booking-phone") ? $("#booking-phone").value.trim() : "Not provided";
                const focus = $("#booking-focus").value;
                const date = new Date(bookingDate.value + "T12:00:00");
                const formattedDate = date.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
                const time = $("#booking-time").value;
                const isCommunity = $("#booking-type").value === "community";
                const sessionName = isCommunity ? "Community workshop conversation" : "Free 30-minute clarity call";
                const message = $("#booking-message").value.trim();

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

                // Direct email delivery via Web3Forms API
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

                $("#confirmation-title").textContent = `Thank you, ${name.split(" ")[0]}!`;
                const confirmationDesc = $("#confirmation-desc");
                if (confirmationDesc) {
                    confirmationDesc.textContent = `Your ${sessionName.toLowerCase()} request has been sent to Jaya. She will contact you directly at ${email} or via WhatsApp at ${phone} to confirm your appointment.`;
                }
                $("#booking-summary").textContent = `${sessionName}\nFocus: ${focus}\nDate: ${formattedDate} · ${time}\nPhone: ${phone}\nReply to: ${email}`;
                $("#booking-email-link").href = `mailto:${contactEmail}?subject=${encodeURIComponent(isCommunity ? "Community workshop request" : "Free clarity call request")}&body=${encodeURIComponent(requestBody)}`;
                
                bookingForm.hidden = true;
                $("#booking-confirmation").hidden = false;
            });

            const editBooking = $("#edit-booking");
            if (editBooking) {
                editBooking.addEventListener("click", () => {
                    const bookingConfirmation = $("#booking-confirmation");
                    if (bookingConfirmation) bookingConfirmation.hidden = true;
                    if (bookingForm) bookingForm.hidden = false;
                    const bookingName = $("#booking-name");
                    if (bookingName) bookingName.focus();
                });
            }

            const copyRequest = $("#copy-request");
            if (copyRequest) {
                copyRequest.addEventListener("click", async () => {
                    try {
                        if (navigator.clipboard && window.isSecureContext) {
                            await navigator.clipboard.writeText(requestBody);
                        } else {
                            const textArea = document.createElement("textarea");
                            textArea.value = requestBody;
                            textArea.style.position = "fixed";
                            textArea.style.opacity = "0";
                            bookingElement.appendChild(textArea);
                            textArea.select();
                            const copied = document.execCommand("copy");
                            textArea.remove();
                            if (!copied) throw new Error("Copy unavailable");
                        }
                        copyRequest.textContent = "Copied!";
                        const copyStatus = $("#copy-status");
                        if (copyStatus) copyStatus.textContent = `Details copied. Paste them into an email to ${contactEmail}.`;
                    } catch (_) {
                        const copyStatus = $("#copy-status");
                        if (copyStatus) copyStatus.textContent = "Your browser couldn’t copy automatically. Select the summary above, or use the email button.";
                    }
                });
            }

            /* ------------------------------------------------------------
               Reusable program / transformation content.
               ------------------------------------------------------------ */
            const programData = {
                individual: {
                    title: "One-on-one coaching",
                    icon: "person",
                    description: "A personal, supportive space to understand what’s holding you back and begin creating a life that feels more aligned with who you are.",
                    features: ["Personalised sessions with Jaya around your goals.", "Mindset reflection, intentional action, and practices for everyday life.", "FREE access to Daily Magic with Jaya (DMJ)."],
                    meta: "Personalised support · Online sessions",
                    focus: "Personal Growth"
                },
                group: {
                    title: "Grow together. Transform together.",
                    icon: "group",
                    description: "You don’t have to figure everything out alone. Group coaching brings reflection, shared learning, and meaningful connection into your growth journey.",
                    features: ["Guided sessions in a supportive community.", "Practical mindset exercises and shared reflections.", "Encouragement and accountability as you take your next steps."],
                    meta: "Small-group experience · Ask about the next intake",
                    focus: "Personal Growth"
                },
                daily: {
                    title: "Daily Magic with Jaya (DMJ)",
                    icon: "star",
                    description: "Bring a little more intention into every day with simple, repeatable practices that fit into real life.",
                    features: ["Gratitude, journaling, and clear daily intentions.", "Gentle reflection to notice and reframe limiting beliefs.", "Consistent small actions that support your personal goals."],
                    meta: "Everyday practices · Beginner friendly",
                    focus: "Mindset"
                },
                chakra: {
                    title: "Chakra healing",
                    icon: "lotus",
                    description: "A gentle space for self-awareness, relaxation, and exploring the traditional chakra framework through guided practices.",
                    features: ["Guided grounding and mindful awareness.", "Explore areas where you feel disconnected or out of balance.", "Personal reflection and simple practices to take home."],
                    meta: "Guided energy practice · Individual support",
                    focus: "Energy Healing",
                    note: true
                },
                eft: {
                    title: "Ho’oponopono & EFT",
                    icon: "heart",
                    description: "Explore practices of forgiveness, self-compassion, and emotional awareness in a calm, supportive setting.",
                    features: ["An introduction to Ho’oponopono reflection.", "Guided Emotional Freedom Techniques (tapping).", "Gentle practices for meeting your emotions with greater kindness."],
                    meta: "Emotional well-being · Guided practice",
                    focus: "Energy Healing",
                    note: true
                },
                overview: {
                    title: "There’s a path that’s right for you.",
                    icon: "lotus",
                    description: "Whether you’re looking for personal guidance, a like-minded community, or a simple daily practice, we can begin where you are.",
                    features: ["One-on-one coaching — personalised support with Jaya.", "Group coaching — learn and grow in community.", "Daily Magic with Jaya (DMJ) — bring intention into your everyday life.", "Chakra healing, Ho’oponopono & EFT — guided well-being practices."],
                    meta: "Not sure which to choose? Start with a free clarity call.",
                    focus: "Finding clarity"
                }
            };

            const topicData = {
                relationships: { title: "Relationships", icon: "heart", description: "Create space for healthier patterns, stronger boundaries, and deeper connection — with yourself and with others.", features: ["Notice recurring relationship patterns without judging yourself.", "Explore your needs, boundaries, and communication.", "Take intentional steps toward more meaningful connection."], focus: "Relationships" },
                money: { title: "Money & Abundance", icon: "rupee", description: "Explore your relationship with money and the beliefs that influence your confidence, choices, and sense of possibility.", features: ["Identify inherited stories and unhelpful assumptions.", "Develop a grounded, possibility-oriented mindset.", "Connect clear intentions with practical action."], focus: "Money & Abundance" },
                career: { title: "Career & Success", icon: "briefcase", description: "Find greater clarity around what matters to you professionally and build confidence in your next step.", features: ["Reconnect with your strengths and personal values.", "Reflect on uncertainty, comparison, or self-doubt.", "Create clear, manageable actions for your career journey."], focus: "Career & Success" },
                health: { title: "Health & Well-being", icon: "lotus", description: "Make room for restorative routines and a kinder, more balanced relationship with yourself.", features: ["Explore mindful habits that fit your everyday life.", "Notice the connection between stress, thoughts, and routines.", "Create space for rest, reflection, and self-care."], focus: "Health & Well-being", note: true },
                mindset: { title: "Mindset", icon: "brain", description: "Become more aware of the stories you tell yourself, and choose beliefs that support growth rather than keep you stuck.", features: ["Recognize limiting thoughts and recurring inner narratives.", "Practice more compassionate, realistic reframing.", "Build confidence through small, consistent actions."], focus: "Mindset" },
                growth: { title: "Personal Growth", icon: "meditate", description: "Reconnect with yourself and begin stepping into the version of you that feels more authentic, present, and intentional.", features: ["Clarify your values and the life you want to create.", "Explore what you’re ready to release or change.", "Choose meaningful next steps with personal support."], focus: "Personal Growth" }
            };

            let detailFocus = "Finding clarity";

            function openDetail(data, isTopic) {
                $("#detail-title").textContent = data.title;
                $("#detail-eyebrow").textContent = isTopic ? "What are you ready to transform?" : "My programs & offerings";
                $("#detail-icon-use").setAttribute("href", `#i-${data.icon}`);
                $("#detail-description").textContent = data.description;
                const features = $("#detail-features");
                features.replaceChildren();
                data.features.forEach(feature => {
                    const li = document.createElement("li");
                    li.textContent = feature;
                    features.appendChild(li);
                });
                $("#detail-meta").textContent = data.meta || "A thoughtful place to begin: your free clarity call.";
                $("#detail-note").hidden = !data.note;
                detailFocus = data.focus;
                detailModal.show();
            }

            $$("[data-program]").forEach(button => button.addEventListener("click", () => openDetail(programData[button.dataset.program], false)));
            $$("[data-topic]").forEach(button => button.addEventListener("click", () => openDetail(topicData[button.dataset.topic], true)));
            const detailBook = $("#detail-book");
            if (detailBook) detailBook.addEventListener("click", () => openBooking("clarity", detailFocus));
            if (detailElement) {
                const dismissBtn = $('a[data-bs-dismiss="modal"]', detailElement);
                if (dismissBtn) {
                    dismissBtn.addEventListener("click", event => {
                        event.preventDefault();
                        detailElement.addEventListener("hidden.bs.modal", () => {
                            const progs = $("#programs");
                            if (progs) progs.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
                        }, { once: true });
                    });
                }
            }

            /* ------------------------------------------------------------
               Testimonial carousel: original reviews only, circular order.
               Keyboard, touch gestures, dots, and responsive visible count.
               ------------------------------------------------------------ */
            const track = $("#testimonial-track");
            const testimonialWindow = $(".testimonial-window");
            const originals = $$(".testimonial-card", track).map(card => card.cloneNode(true));
            const dotsContainer = $(".carousel-dots");
            let testimonialIndex = 0;
            let carouselAnimating = false;
            let visibleCount = 0;
            let carouselPosition = 0;

            const visibleTestimonials = () => window.innerWidth < 576 ? 1 : window.innerWidth < 992 ? 2 : 3;

            originals.forEach((_, index) => {
                const dot = document.createElement("button");
                dot.type = "button";
                dot.className = "carousel-dot" + (index === 0 ? " active" : "");
                dot.setAttribute("aria-label", `Start with testimonial ${index + 1}`);
                dot.setAttribute("aria-pressed", index === 0 ? "true" : "false");
                dot.addEventListener("click", () => renderTestimonials(index, true, true));
                dotsContainer.appendChild(dot);
            });

            function renderTestimonials(index, announce = false, animate = false, direction = 0) {
                const nextIndex = (index + originals.length) % originals.length;
                const selectionChanged = nextIndex !== testimonialIndex;
                testimonialIndex = nextIndex;
                visibleCount = visibleTestimonials();
                track.replaceChildren();

                for (let offset = visibleCount; offset > 0; offset--) {
                    const clone = originals[(originals.length - offset) % originals.length].cloneNode(true);
                    clone.setAttribute("aria-hidden", "true");
                    track.appendChild(clone);
                }
                originals.forEach((original, originalIndex) => {
                    const card = original.cloneNode(true);
                    const distance = (originalIndex - testimonialIndex + originals.length) % originals.length;
                    card.setAttribute("aria-hidden", String(distance >= visibleCount));
                    track.appendChild(card);
                });
                for (let offset = 0; offset < visibleCount; offset++) {
                    const clone = originals[offset % originals.length].cloneNode(true);
                    clone.setAttribute("aria-hidden", "true");
                    track.appendChild(clone);
                }

                $$(".carousel-dot", dotsContainer).forEach((dot, dotIndex) => {
                    dot.classList.toggle("active", dotIndex === testimonialIndex);
                    dot.setAttribute("aria-pressed", String(dotIndex === testimonialIndex));
                });

                const gap = parseFloat(getComputedStyle(track).gap) || 0;
                const cardWidth = track.firstElementChild.getBoundingClientRect().width;
                const step = cardWidth + gap;
                const basePosition = visibleCount + testimonialIndex;
                carouselPosition = basePosition;
                const shouldAnimate = animate && selectionChanged && !reducedMotion;
                if (shouldAnimate && direction > 0 && testimonialIndex === 0) carouselPosition += originals.length;
                if (shouldAnimate && direction < 0 && testimonialIndex === originals.length - 1) carouselPosition -= originals.length;

                track.style.transition = shouldAnimate ? "" : "none";
                track.style.transform = `translateX(${-carouselPosition * step}px)`;
                if (!shouldAnimate) {
                    carouselAnimating = false;
                } else {
                    carouselAnimating = true;
                }

                if (announce) {
                    const person = $(".testimonial-person strong", originals[testimonialIndex]).textContent.replace("– ", "");
                    $("#testimonial-status").textContent = `Showing ${visibleCount} testimonial${visibleCount > 1 ? "s" : ""}, starting with ${person}.`;
                }
            }

            function moveTestimonials(direction) {
                if (carouselAnimating) return;
                renderTestimonials(testimonialIndex + direction, true, true, direction);
            }

            if (track) {
                track.addEventListener("transitionend", event => {
                    if (event.propertyName !== "transform") return;
                    if (carouselPosition >= visibleCount + originals.length || carouselPosition < visibleCount) {
                        renderTestimonials(testimonialIndex, false, false);
                    }
                    carouselAnimating = false;
                });
            }

            const carouselPrev = $(".carousel-prev");
            if (carouselPrev) carouselPrev.addEventListener("click", () => moveTestimonials(-1));
            const carouselNext = $(".carousel-next");
            if (carouselNext) carouselNext.addEventListener("click", () => moveTestimonials(1));

            if (testimonialWindow) {
                testimonialWindow.addEventListener("keydown", event => {
                    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
                        event.preventDefault();
                        moveTestimonials(event.key === "ArrowRight" ? 1 : -1);
                    }
                });

                let touchStartX = 0;
                let touchStartY = 0;
                testimonialWindow.addEventListener("touchstart", event => {
                    touchStartX = event.changedTouches[0].clientX;
                    touchStartY = event.changedTouches[0].clientY;
                }, { passive: true });
                testimonialWindow.addEventListener("touchend", event => {
                    const dx = event.changedTouches[0].clientX - touchStartX;
                    const dy = event.changedTouches[0].clientY - touchStartY;
                    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) moveTestimonials(dx < 0 ? 1 : -1);
                }, { passive: true });
            }

            let resizeTimer;
            window.addEventListener("resize", () => {
                clearTimeout(resizeTimer);
                resizeTimer = setTimeout(() => renderTestimonials(testimonialIndex), 120);
            }, { passive: true });
            renderTestimonials(0);

            /* ------------------------------------------------------------
               Testimonial tabs & Video modal playback.
               ------------------------------------------------------------ */
            const testimonialTabs = $$(".testimonial-tab");
            testimonialTabs.forEach(tab => {
                tab.addEventListener("click", (e) => {
                    e.preventDefault();
                    const targetTab = tab.dataset.tab;
                    testimonialTabs.forEach(t => {
                        const isActive = t === tab;
                        t.classList.toggle("active", isActive);
                        t.setAttribute("aria-selected", String(isActive));
                    });
                    $$(".testimonial-panel").forEach(panel => {
                        panel.classList.toggle("active", panel.id === `panel-${targetTab}`);
                    });
                    if (targetTab === "words" && typeof renderTestimonials === "function") {
                        setTimeout(() => renderTestimonials(testimonialIndex, false, false), 50);
                    }
                });
            });

            /* ------------------------------------------------------------
               Transformation Story Database & Reader Modal.
               ------------------------------------------------------------ */
            const storyDatabase = {
                "pravin": {
                    title: "From Relationship Conflicts to Love & Compassion — Pravin’s Ho’oponopono Journey",
                    author: "Pravin",
                    role: "Married Professional",
                    category: "Ho’oponopono · Family & Marriage",
                    pdf: null,
                    paragraphs: [
                        "After marriage, Pravin experienced a growing distance and deterioration in his relationship with his parents. When he decided to move out with his wife, his parents strongly opposed the decision and even told him that if he moved out, he should consider them dead.",
                        "The situation was emotionally challenging, and the relationship seemed stuck in pain and conflict.",
                        "That’s when Pravin started practising Ho’oponopono, the beautiful practice of forgiveness, love, and inner healing.",
                        "And then, something beautiful happened! ✨",
                        "One day, while Pravin was at work, his father unexpectedly called him and said: <em>“We want you and your wife to be happy. You can happily move out. We will continue meeting each other with love and compassion.”</em> ❤️",
                        "What once seemed like an impossible conversation became a moment of understanding, acceptance, and love.",
                        "Pravin’s journey is a beautiful reminder that when we begin healing within ourselves, we can create space for healing in our relationships too.",
                        "Sometimes, the biggest miracles aren't about changing people; they're about allowing love, forgiveness, and compassion to replace fear, resistance, and pain.",
                        "✨ <strong>Ho’oponopono — a small practice, a powerful shift, and a beautiful possibility for healing relationships.</strong> 🙏"
                    ]
                },
                "jonita": {
                    title: "From Months of Pain to a Powerful Healing Experience — Jonita’s Journey",
                    author: "Jonita",
                    role: "Client Journey",
                    category: "Ho’oponopono & EFT · Chakra Activation",
                    pdf: null,
                    paragraphs: [
                        "For more than six months, Jonita had been struggling with persistent neck and shoulder pain. Despite taking medication and undergoing physiotherapy, she hadn't experienced much relief.",
                        "That’s when we began practising Ho’oponopono and EFT, focusing on releasing the emotional burden she felt she was carrying.",
                        "And guess what? ✨ After just ONE session, Jonita experienced a remarkable change — her pain disappeared! ❤️",
                        "But something even more profound happened during her third-eye chakra activation practice.",
                        "Jonita experienced a deeply emotional spiritual connection in which she felt the presence of her late mother and grandmother. She also experienced Mother Mary standing behind her, bringing her a beautiful message: <em>“You are not alone on this journey. We are always around you, blessing you.”</em> 🙏✨",
                        "The experience left her with a profound sense of comfort, love, and connection.",
                        "Jonita’s journey reminds us that healing can be deeply personal. Sometimes, beyond the physical discomfort, we carry emotional burdens that deserve our attention, compassion, and care.",
                        "And sometimes, the most beautiful gift of a healing experience is the feeling that we are loved, supported, and never alone. ❤️",
                        "✨ <strong>One session. A remarkable experience. A heart filled with hope.</strong>"
                    ]
                },
                "jaya-recovery": {
                    title: "From Paralysis to Participating in Every Wedding Ritual — Jaya’s Inspiring Journey",
                    author: "Jaya",
                    role: "Loving Mother",
                    category: "Remote Energy Healing · Mindset & Faith",
                    pdf: null,
                    paragraphs: [
                        "A mother dreams of witnessing her daughter's wedding for years — being part of every ritual, enjoying the shopping, celebrating every little moment, and creating memories she will cherish forever.",
                        "But for Jaya, that dream was suddenly shattered. Just a month before her daughter's wedding, she suffered a paralysis attack. Her heart was broken. The doctors told her that she might not be able to walk for at least 10–12 months.",
                        "How could she accept the thought of missing the most precious moments of her daughter's life?",
                        "That's when we began remote healing sessions, focusing on strengthening her mindset, building faith in her body's ability to recover, and helping her embrace the thought that being alive itself is a blessing. ❤️ Alongside her medical treatment, we worked on her mindset, emotional strength, hope, and healing.",
                        "And then came the beautiful turn in her journey! ✨ In less than a month, Jaya started walking!",
                        "The mother who feared she would miss her daughter's wedding didn't just attend it — she participated in every ritual, enjoyed the shopping, and made sure she was part of the celebrations she had dreamed of for years. ❤️🙏",
                        "For Jaya, it was more than walking again. It was about reclaiming precious moments, experiencing the joy of motherhood, and being present for a milestone she would never want to miss.",
                        "✨ <strong>Her journey reminds us that even in our darkest moments, hope matters. Our mindset can support us through life's toughest challenges, and the right combination of medical care, emotional support, and determination can make a meaningful difference.</strong>"
                    ]
                },
                "anubhav": {
                    title: "An Unexpected Healing Experience — Anubhav Sharma’s Story",
                    author: "Anubhav Sharma",
                    role: "Workshop Participant",
                    category: "Group Energy Healing · Emotional Release",
                    pdf: null,
                    paragraphs: [
                        "Imagine joining a Zoom healing session with more than 300 participants, believing you are simply there to learn — and leaving with an experience you never expected! That’s what happened with Anubhav Sharma.",
                        "During the session, I was guiding a lady through a healing practice for her pain. While I was working with her, Anubhav began following my instructions and practising the techniques along with everyone else.",
                        "But here’s what made the experience so special! ✨ Anubhav experienced his month-long back pain disappearing during that very session — even though I wasn't working with him directly! ❤️",
                        "He was simply participating, following the process, and applying the practice to himself.",
                        "For me, his experience beautifully illustrates why I encourage people to pay attention to their emotional well-being alongside their physical health. Sometimes, we carry stress and emotional burdens without even realising how they affect the way we feel.",
                        "✨ <strong>Anubhav’s experience is a reminder that you don't always have to be the person receiving direct attention to benefit from a healing practice. Your own participation matters, too.</strong>"
                    ]
                },
                "ankita": {
                    title: "From PCOD Challenges to Emotional Release & Greater Balance",
                    author: "Ankita",
                    role: "Verified Client Case",
                    category: "PCOD & Emotional Release",
                    pdf: "./assets/Ankita.pdf",
                    paragraphs: [
                        "Ankita came to me while navigating challenges related to PCOD and an irregular cycle. As we explored her emotional patterns, she became aware of the deep-rooted fear and guilt connected to experiences from her past.",
                        "Rather than focusing only on the physical concern, Ankita consciously chose to work on the emotional weight she had been carrying. She began releasing these past patterns, creating greater acceptance and compassion towards herself.",
                        "Over time, she experienced a more regular, normal cycle, which she saw as an important part of her overall journey.",
                        "For Ankita, the transformation wasn't only about her cycle. It was about understanding herself more deeply, releasing the emotional burden of the past and creating a healthier relationship with her own emotions.",
                        "✨ <strong>Her biggest transformation:</strong> She didn't just want a change in her physical experience — she chose to address the fear and guilt she had been carrying and consciously create a more balanced relationship with herself."
                    ]
                },
                "paramjeet": {
                    title: "From Physical Discomfort to Inner Acceptance",
                    author: "Paramjeet",
                    role: "Verified Client Case",
                    category: "Root Chakra & Acceptance",
                    pdf: "./assets/Paramjeet.pdf",
                    paragraphs: [
                        "Paramjeet joined me while experiencing hip and calf pain. As we explored the emotional patterns behind what she was experiencing, she began becoming more aware of how much discomfort she was carrying around situations and people in her life.",
                        "Through our sessions, she started practising acceptance — learning to become more comfortable with people being exactly as they are, rather than constantly resisting or trying to change them.",
                        "As she worked on this emotional shift and focused on bringing greater balance to her root chakra, she noticed a remarkable change. Within just two days, she experienced a significant disappearance of the pain.",
                        "For her, the transformation wasn't simply about feeling better physically. It was about understanding the connection between inner resistance, emotional patterns and the way we experience life.",
                        "✨ <strong>Her biggest transformation:</strong> She learned that sometimes, when we stop fighting what we cannot control and start embracing acceptance, we create space for greater balance within ourselves."
                    ]
                },
                "parampreet": {
                    title: "From Pain 10/10 to 0/10 in One Session",
                    author: "Parampreet",
                    role: "Verified Client Case",
                    category: "Rapid Pain Cleansing",
                    pdf: "./assets/Parampreet.pdf",
                    paragraphs: [
                        "Parampreet came into the session experiencing pain that she described as 10/10. Rather than focusing only on the physical discomfort, we explored the emotional burden she had been carrying within.",
                        "During the session, she was able to connect with and release emotions and burdens that she had been holding onto for a long time. As she experienced this emotional release, she noticed a remarkable change in how she felt physically.",
                        "By the end of the session, she reported that her pain had reduced from 10/10 to 0/10.",
                        "For Parampreet, this became a powerful experience of understanding how deeply our emotional experiences can influence the way we experience ourselves.",
                        "✨ <strong>Her biggest transformation:</strong> She came into the session carrying intense pain and emotional burden — and left feeling lighter, relieved and free."
                    ]
                },
                "pratiksha": {
                    title: "From Losing Her Daughter's Memories to Getting Them Back",
                    author: "Pratiksha",
                    role: "Verified Client Case",
                    category: "Miraculous Recovery & Faith",
                    pdf: "./assets/Pratiksha.pdf",
                    paragraphs: [
                        "Pratiksha came to me after losing her phone. But what truly broke her heart wasn't the loss of the device — it was the thought of losing all the precious photographs and memories of her daughter stored inside it. Those pictures were irreplaceable memories, and she was deeply emotional about losing them.",
                        "During our sessions, she began shifting her emotional state from fear, sadness and helplessness to hope and belief. And then something that felt almost magical happened — she was able to recover all the photographs of her daughter. ❤️",
                        "But her story didn't end there. A few days later, she received an unexpected call from the Cyber Crime Department, and she eventually got her lost phone back as well.",
                        "The experience became more than just recovering a phone and photographs. It gave Pratiksha a renewed sense of hope and also motivated her to start taking greater care of her health and overall well-being.",
                        "✨ <strong>Her biggest transformation:</strong> What began with the pain of losing something deeply precious ended with her recovering not only her daughter's memories and her phone, but also a renewed belief in herself and her ability to move forward."
                    ]
                },
                "shrishti": {
                    title: "From Money Being Stuck to Receiving It in Just 3 Days",
                    author: "Shrishti",
                    role: "Verified Client Case",
                    category: "Abundance & Financial Flow",
                    pdf: "./assets/Shrishti.pdf",
                    paragraphs: [
                        "Shrishti came to me with money that had been stuck for a long time. It wasn't simply about not having enough money in her account — the money that was already due to her was not reaching her.",
                        "We worked on identifying and releasing the emotional blocks, fears and limiting beliefs she was carrying around money. The focus was on shifting her relationship with money from resistance and uncertainty towards greater trust, openness and abundance.",
                        "And then came her breakthrough. ✨ Within just 3 days of the session, she received the money that had been stuck for so long.",
                        "For Shrishti, this became a powerful reminder to look beyond the external situation and become aware of the internal beliefs and emotions that may be influencing how she experiences money.",
                        "✨ <strong>Her biggest transformation:</strong> She went from feeling that her money was stuck with no movement in sight to experiencing the release of money she had been waiting for."
                    ]
                },
                "yashvi": {
                    title: "From 84% and Hopelessness to Her Dream College",
                    author: "Yashvi",
                    role: "Verified Client Case",
                    category: "Student Mindset & Admissions",
                    pdf: "./assets/Yashvi.pdf",
                    paragraphs: [
                        "Yashvi came to me at a time when she felt completely shattered. She had scored 84% and wanted to pursue IT, but the merit list for the course had closed at 87%. To make things even more difficult, she had applied to only one college — the very college she dreamed of attending.",
                        "With the admission possibility seemingly out of reach, she had lost hope and was struggling to believe that things could still work out.",
                        "Through our session, we worked on shifting her emotional state from fear, disappointment and hopelessness to hope, belief and trust. She began believing in herself again and opened herself to the possibility that there could be another way.",
                        "And then came the unexpected! She received a call from the college asking her to come in on a Sunday — a weekend — to discuss her admission.",
                        "What happened next felt nothing short of magical. ✨ Yashvi got admission into the college she had always dreamed of, for the exact course she wanted to pursue.",
                        "✨ <strong>Her biggest transformation:</strong> She came in believing “It's impossible” and walked away believing “Maybe it is possible for me.” And that shift in belief changed everything."
                    ]
                },
                "prashant": {
                    title: "From a Broken Relationship to Unconditional Self-Love",
                    author: "Prashant",
                    role: "Verified Client Case",
                    category: "Self-Love, Thesis & PhD",
                    pdf: "./assets/Prashant.pdf",
                    paragraphs: [
                        "When Prashant joined me, he was going through a difficult phase in his life. A broken relationship had deeply affected him, and he had stopped accepting and loving himself. This inner struggle was beginning to reflect across different areas of his life.",
                        "For a long time, he had also been trying to get his thesis accepted by a university, but despite his efforts, things simply weren't working out. The repeated rejections had left him frustrated and disheartened.",
                        "Our journey began with something much deeper than achieving an external goal — we worked on self-acceptance, self-worth and unconditional self-love.",
                        "As Prashant began changing the way he saw himself, his entire outlook started shifting. He moved from seeking validation outside himself to developing a stronger sense of acceptance and belief within.",
                        "And then came an incredible series of breakthroughs. ✨ The thesis he had struggled to get accepted for so long was eventually accepted by more than five universities, including international universities and two of India's top universities. What made the journey even more remarkable was that one of the universities went a step further and offered him an opportunity to pursue his PhD with them.",
                        "✨ <strong>His biggest transformation:</strong> He came in feeling broken, rejected and disconnected from himself. He walked out with a renewed sense of self-worth, unconditional self-love and opportunities that he had been struggling to create for years."
                    ]
                },
                "manisha": {
                    title: "From Fear & Guilt to Self-Love and Transformation",
                    author: "Manisha",
                    role: "Verified Client Case",
                    category: "Sacral Chakra & Self-Love",
                    pdf: "./assets/Manisha.pdf",
                    paragraphs: [
                        "When Manisha joined me, she was going through recurring UTI and period-related concerns. As we worked together, she began looking beyond the physical symptoms and became aware of deeper emotional patterns of fear and guilt that were influencing how she felt about herself and her life.",
                        "Through our sessions, she connected these patterns with her sacral chakra and emotional energy, and began consciously releasing limiting beliefs, practising self-love and creating a healthier relationship with herself.",
                        "Her transformation went far beyond what she initially came in for. As she started loving and accepting herself more deeply, she noticed positive changes across different areas of her life — including her well-being, relationships and career.",
                        "✨ <strong>Her biggest transformation:</strong> She didn't just learn to work on her outer circumstances — she discovered that changing the way she felt about herself could change the way she experienced her entire life."
                    ]
                },
                "shraddha": {
                    title: "From “Something Is Missing” to Discovering Her Calling",
                    author: "Shraddha",
                    role: "Verified Client Case",
                    category: "Life Calling & Dance Healing at 48",
                    pdf: "./assets/Shraddha.pdf",
                    paragraphs: [
                        "After spending more than 20 years working with a renowned organisation, Shraddha had built a successful professional life. Yet, despite everything she had accomplished, she felt that something was missing. There was an emptiness she couldn't quite explain.",
                        "Through our sessions, we worked together on gaining clarity, listening to her inner voice and understanding what truly made her heart happy.",
                        "And she discovered something beautiful — her heart belonged to dance. 💃✨ Instead of dismissing that desire or telling herself that it was too late, she chose to follow it.",
                        "At the age of 48, she enrolled herself in a dance healing academy and began pursuing professional education in dance. She also started attending weekend academy sessions and is now on a journey towards using dance as a medium to help and heal others.",
                        "✨ <strong>Her biggest transformation:</strong> She went from “Something is missing from my life” to “I know what my heart wants, and I'm finally choosing to follow it.”"
                    ]
                }
            };

            const storyModalEl = document.getElementById("storyDetailModal");
            if (storyModalEl && window.bootstrap) {
                const storyModal = new bootstrap.Modal(storyModalEl);
                const storyTitle = document.getElementById("storyDetailTitle");
                const storyEyebrow = document.getElementById("storyDetailEyebrow");
                const storyAuthor = document.getElementById("storyDetailAuthor");
                const storyTag = document.getElementById("storyDetailTag");
                const storyContent = document.getElementById("storyDetailContent");
                const storyPdfContainer = document.getElementById("storyDetailPdfContainer");
                const storyPdfBtn = document.getElementById("storyDetailPdfBtn");

                const openStory = (storyId) => {
                    const item = storyDatabase[storyId];
                    if (!item) return;
                    if (storyTitle) storyTitle.textContent = item.title;
                    if (storyEyebrow) storyEyebrow.textContent = item.category || "Client Transformation Story";
                    if (storyAuthor) storyAuthor.innerHTML = `<strong>${item.author}</strong>${item.role ? ` · <span>${item.role}</span>` : ''}`;
                    if (storyTag) storyTag.textContent = item.category || "Transformation Case";
                    
                    if (storyContent) {
                        storyContent.innerHTML = item.paragraphs.map(p => `<p>${p}</p>`).join('');
                    }

                    if (storyPdfContainer && storyPdfBtn) {
                        if (item.pdf) {
                            storyPdfContainer.hidden = false;
                            storyPdfBtn.href = item.pdf;
                        } else {
                            storyPdfContainer.hidden = true;
                        }
                    }
                    storyModal.show();
                };

                document.querySelectorAll("[data-story-id]").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const sid = btn.dataset.storyId;
                        if (sid) {
                            e.preventDefault();
                            openStory(sid);
                        }
                    });
                });
            }

            const videoModalEl = document.getElementById("videoModal");
            const videoIframe = document.getElementById("video-modal-iframe");
            const videoModalTitle = document.getElementById("video-modal-title");
            if (videoModalEl && window.bootstrap) {
                const videoModal = new bootstrap.Modal(videoModalEl);
                $$(".video-card-thumb-wrap").forEach(thumb => {
                    const handleVideoOpen = () => {
                        const videoSrc = thumb.dataset.videoSrc;
                        const title = thumb.dataset.videoTitle || "Client Video Story";
                        if (videoModalTitle) videoModalTitle.textContent = title;
                        if (videoIframe && videoSrc) {
                            const separator = videoSrc.includes("?") ? "&" : "?";
                            videoIframe.src = `${videoSrc}${separator}autoplay=1`;
                        }
                        videoModal.show();
                    };
                    thumb.addEventListener("click", handleVideoOpen);
                    thumb.addEventListener("keydown", e => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleVideoOpen();
                        }
                    });
                });

                videoModalEl.addEventListener("hidden.bs.modal", () => {
                    if (videoIframe) videoIframe.src = "";
                });
            }

            /* ------------------------------------------------------------
               Newsletter: native validation and explicit email opt-in.
               ------------------------------------------------------------ */
            const newsletterForm = $("#newsletter-form");
            if (newsletterForm) {
                newsletterForm.addEventListener("submit", event => {
                    event.preventDefault();
                    const input = $("#newsletter-email");
                    if (!input || !input.reportValidity()) return;
                    const feedback = $("#newsletter-feedback");
                    if (!feedback) return;
                    feedback.replaceChildren(document.createTextNode("One last step: "));
                    const link = document.createElement("a");
                    link.textContent = "send your subscription request";
                    link.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Newsletter subscription request")}&body=${encodeURIComponent(`Hi Jaya,\n\nI’d like to receive your tips, updates, and inspiration by email.\n\nPlease subscribe: ${input.value.trim()}\n\nThank you!`)}`;
                    feedback.append(link, document.createTextNode(". You’ll join after your request is confirmed."));
                    feedback.hidden = false;
                    link.focus();
                });
            }

            /* ------------------------------------------------------------
               Animated intro: actual playback, seek, captions, narration.
               ------------------------------------------------------------ */
            const introElement = $("#introModal");
            const introDuration = 40;
            const introSegments = [
                { title: "The life you truly desire begins with you.", speech: "Welcome to Manifest with Jaya. A space to clarify your mind, align your energy, and create a life that feels like you." },
                { title: "Clarify your mind. Reconnect with what matters.", speech: "Start by slowing down. Notice your thoughts, explore your beliefs, and reconnect with what really matters to you." },
                { title: "Small, intentional practices. Meaningful change.", speech: "Through coaching and simple daily practices, you can begin taking thoughtful steps toward your personal goals." },
                { title: "You don’t have to walk this path alone.", speech: "Explore personalised coaching, a supportive community, and gentle practices for self awareness and emotional well being." },
                { title: "Let’s discover your next chapter, together.", speech: "You don't need to have every answer. Begin with a free clarity call, and let's explore your next chapter together." }
            ];

            let introElapsed = 0;
            let introPlaying = false;
            let introLastFrame = 0;
            let introFrame = 0;
            let introSegment = -1;
            let narrationOn = false;
            const speechAvailable = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

            const narrationBtn = $("#intro-narration");
            if (!speechAvailable && narrationBtn) narrationBtn.hidden = true;

            function speakSegment(index) {
                if (!speechAvailable || !narrationOn || !introPlaying) return;
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(introSegments[index].speech);
                utterance.lang = "en-IN";
                utterance.rate = .98;
                const voices = window.speechSynthesis.getVoices();
                const preferred = voices.find(voice => voice.lang === "en-IN") || voices.find(voice => voice.lang.startsWith("en"));
                if (preferred) utterance.voice = preferred;
                window.speechSynthesis.speak(utterance);
            }

            function updateIntro() {
                const segment = Math.min(introSegments.length - 1, Math.floor(introElapsed / 8));
                if (segment !== introSegment) {
                    introSegment = segment;
                    const caption = $("#intro-caption");
                    if (caption) {
                        caption.textContent = introSegments[segment].title;
                        caption.classList.remove("is-entering");
                        void caption.offsetWidth;
                        caption.classList.add("is-entering");
                    }
                    speakSegment(segment);
                }
                const introProg = $("#intro-progress");
                if (introProg) {
                    introProg.value = introElapsed;
                    introProg.setAttribute("aria-valuetext", `${Math.floor(introElapsed)} of 40 seconds`);
                }
                const introTime = $("#intro-time");
                if (introTime) introTime.textContent = `0:${String(Math.floor(introElapsed)).padStart(2, "0")} / 0:40`;
                const introPlayIcon = $("#intro-play-icon");
                if (introPlayIcon) introPlayIcon.setAttribute("href", introPlaying ? "#i-pause" : "#i-play");
                const introPlayBtn = $("#intro-play");
                if (introPlayBtn) introPlayBtn.setAttribute("aria-label", introPlaying ? "Pause introduction" : introElapsed >= introDuration ? "Replay introduction" : "Play introduction");
            }

            function pauseIntro() {
                introPlaying = false;
                cancelAnimationFrame(introFrame);
                if (speechAvailable) window.speechSynthesis.cancel();
                updateIntro();
            }

            function introTick(timestamp) {
                if (!introPlaying) return;
                if (introLastFrame) introElapsed += Math.min((timestamp - introLastFrame) / 1000, .2);
                introLastFrame = timestamp;
                if (introElapsed >= introDuration) {
                    introElapsed = introDuration;
                    pauseIntro();
                    return;
                }
                updateIntro();
                introFrame = requestAnimationFrame(introTick);
            }

            function playIntro() {
                if (introElapsed >= introDuration) { introElapsed = 0; introSegment = -1; }
                introPlaying = true;
                introLastFrame = 0;
                updateIntro();
                speakSegment(Math.max(0, introSegment));
                introFrame = requestAnimationFrame(introTick);
            }

            const introPlayBtn = $("#intro-play");
            if (introPlayBtn) introPlayBtn.addEventListener("click", () => introPlaying ? pauseIntro() : playIntro());
            const introProgress = $("#intro-progress");
            if (introProgress) {
                introProgress.addEventListener("input", event => {
                    introElapsed = Number(event.target.value);
                    introLastFrame = 0;
                    introSegment = -1;
                    updateIntro();
                    if (introElapsed >= introDuration) pauseIntro();
                });
            }
            const introNarration = $("#intro-narration");
            if (introNarration) {
                introNarration.addEventListener("click", () => {
                    narrationOn = !narrationOn;
                    introNarration.setAttribute("aria-pressed", String(narrationOn));
                    introNarration.textContent = narrationOn ? "Narration on" : "Narration off";
                    if (narrationOn) speakSegment(Math.max(0, introSegment));
                    else if (speechAvailable) window.speechSynthesis.cancel();
                });
            }
            if (introElement) {
                introElement.addEventListener("shown.bs.modal", () => {
                    introElapsed = 0;
                    introSegment = -1;
                    if (!reducedMotion) playIntro();
                    else updateIntro();
                });
                introElement.addEventListener("hide.bs.modal", pauseIntro);
            }
            document.addEventListener("visibilitychange", () => {
                if (document.hidden && introPlaying) pauseIntro();
            });
            /* ------------------------------------------------------------
               Testimonial Upload & Submission (Video & Written Message)
               ------------------------------------------------------------ */
            const uploadModalEl = document.getElementById("testimonialUploadModal");
            const uploadForm = document.getElementById("testimonial-upload-form");
            const typeMsgBtn = document.getElementById("type-select-message");
            const typeVidBtn = document.getElementById("type-select-video");
            const msgFields = document.getElementById("message-fields");
            const vidFields = document.getElementById("video-fields");
            const typeInput = document.getElementById("testimonial-type");
            const successBox = document.getElementById("testimonial-success");
            const starBtns = $$(".star-btn");
            const ratingInput = document.getElementById("testimonial-rating");

            if (uploadModalEl && uploadForm) {
                const setType = (type) => {
                    typeInput.value = type;
                    const isMsg = type === "message";
                    if (typeMsgBtn) typeMsgBtn.classList.toggle("active", isMsg);
                    if (typeVidBtn) typeVidBtn.classList.toggle("active", !isMsg);
                    if (msgFields) msgFields.hidden = !isMsg;
                    if (vidFields) vidFields.hidden = isMsg;
                    const msgArea = document.getElementById("testimonial-body");
                    const vidTitle = document.getElementById("testimonial-video-title");
                    if (msgArea) msgArea.required = isMsg;
                    if (vidTitle) vidTitle.required = !isMsg;
                };

                if (typeMsgBtn && typeVidBtn) {
                    typeMsgBtn.addEventListener("click", () => setType("message"));
                    typeVidBtn.addEventListener("click", () => setType("video"));
                }

                starBtns.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const r = parseInt(btn.dataset.rating, 10);
                        if (ratingInput) ratingInput.value = r;
                        starBtns.forEach(s => {
                            const sr = parseInt(s.dataset.rating, 10);
                            s.classList.toggle("active", sr <= r);
                        });
                    });
                });

                uploadForm.addEventListener("submit", async event => {
                    event.preventDefault();
                    uploadForm.classList.add("was-validated");
                    if (!uploadForm.checkValidity()) {
                        const inv = uploadForm.querySelector(":invalid");
                        if (inv) inv.focus();
                        return;
                    }

                    const submitBtn = document.getElementById("testimonial-submit-btn");
                    const submitText = document.getElementById("testimonial-btn-text");
                    const origText = submitText ? submitText.textContent : "Submit Testimonial";
                    if (submitBtn) submitBtn.disabled = true;
                    if (submitText) submitText.textContent = "Submitting your story...";

                    const isVideo = typeInput.value === "video";
                    const name = document.getElementById("testimonial-name").value.trim();
                    const role = document.getElementById("testimonial-role").value.trim();
                    const email = document.getElementById("testimonial-email").value.trim();
                    const program = document.getElementById("testimonial-program").value;
                    const rating = ratingInput ? ratingInput.value : "5";
                    const messageBody = document.getElementById("testimonial-body") ? document.getElementById("testimonial-body").value.trim() : "";
                    const videoTitle = document.getElementById("testimonial-video-title") ? document.getElementById("testimonial-video-title").value.trim() : "";
                    const videoLink = document.getElementById("testimonial-video-link") ? document.getElementById("testimonial-video-link").value.trim() : "";

                    try {
                        const payload = {
                            access_key: WEB3FORMS_ACCESS_KEY,
                            subject: `New Client Testimonial (${isVideo ? 'Video' : 'Message'}): ${name}`,
                            from_name: name,
                            replyto: email,
                            name: name,
                            role: role,
                            email: email,
                            journey: program,
                            rating: `${rating} Stars`,
                            testimonial_type: isVideo ? "Video Story" : "Client Message",
                            story: isVideo ? `Video Title: ${videoTitle}\nVideo Link: ${videoLink}` : messageBody
                        };

                        await fetch(FORM_DELIVERY_ENDPOINT, {
                            method: "POST",
                            headers: { "Content-Type": "application/json", "Accept": "application/json" },
                            body: JSON.stringify(payload)
                        });
                    } catch (err) {
                        console.warn("Testimonial submission delivery fallback:", err);
                    } finally {
                        if (submitBtn) submitBtn.disabled = false;
                        if (submitText) submitText.textContent = origText;
                    }

                    if (!isVideo && messageBody) {
                        const container = document.getElementById("client-messages-container");
                        if (container) {
                            const newCard = document.createElement("article");
                            newCard.className = "client-message-card";
                            const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "J";
                            const starsStr = "★".repeat(parseInt(rating, 10));
                            newCard.innerHTML = `
                                <div class="client-message-header">
                                    <div class="client-message-sender">
                                        <div class="client-message-avatar">${initials}</div>
                                        <div class="client-message-info">
                                            <strong>${name}</strong>
                                            <span>${role}</span>
                                        </div>
                                    </div>
                                    <span class="client-badge-verified">✓ Just Shared</span>
                                </div>
                                <div class="client-message-stars">${starsStr}</div>
                                <p class="client-message-body">“${messageBody}”</p>
                                <span class="client-message-tag">${program}</span>
                            `;
                            container.insertBefore(newCard, container.firstChild);
                        }
                    } else if (isVideo && (videoTitle || videoLink)) {
                        const vidContainer = document.getElementById("video-testimonials-container");
                        if (vidContainer) {
                            const newVid = document.createElement("article");
                            newVid.className = "video-card";
                            newVid.innerHTML = `
                                <div class="video-card-thumb-wrap" tabindex="0" role="button" aria-label="Play video testimonial from ${name}">
                                    <img class="video-card-thumb" src="./assets/program-coaching.webp" alt="${name} Video Testimonial" width="481" height="291" loading="lazy">
                                    <div class="video-play-overlay">
                                        <div class="video-play-btn"><svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7Z"/></svg></div>
                                    </div>
                                    <span class="video-duration-badge">New</span>
                                </div>
                                <div class="video-card-body">
                                    <span class="video-card-tag">${program}</span>
                                    <h3 class="video-card-title">“${videoTitle || 'A life-changing journey with Jaya'}”</h3>
                                    <p class="video-card-author"><strong>${name}</strong> — ${role}</p>
                                </div>
                            `;
                            vidContainer.insertBefore(newVid, vidContainer.firstChild);
                        }
                    }

                    uploadForm.hidden = true;
                    if (successBox) successBox.hidden = false;
                });

                uploadModalEl.addEventListener("hidden.bs.modal", () => {
                    uploadForm.reset();
                    uploadForm.classList.remove("was-validated");
                    uploadForm.hidden = false;
                    if (successBox) successBox.hidden = true;
                    setType("message");
                });
            }
        })();
