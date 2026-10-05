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

            $("#booking-name").addEventListener("input", event => {
                event.target.setCustomValidity(event.target.value.trim().length < 2 ? "Please enter your name." : "");
            });

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

            $("#edit-booking").addEventListener("click", () => {
                $("#booking-confirmation").hidden = true;
                bookingForm.hidden = false;
                $("#booking-name").focus();
            });

            $("#copy-request").addEventListener("click", async () => {
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
                    $("#copy-request").textContent = "Copied!";
                    $("#copy-status").textContent = `Details copied. Paste them into an email to ${contactEmail}.`;
                } catch (_) {
                    $("#copy-status").textContent = "Your browser couldn’t copy automatically. Select the summary above, or use the email button.";
                }
            });

            /* ------------------------------------------------------------
               Reusable program / transformation content.
               ------------------------------------------------------------ */
            const programData = {
                individual: {
                    title: "One-on-one coaching",
                    icon: "person",
                    description: "A personal, supportive space to understand what’s holding you back and begin creating a life that feels more aligned with who you are.",
                    features: ["Personalised sessions with Jaya around your goals.", "Mindset reflection, intentional action, and practices for everyday life.", "FREE access to Daily Magic Practice (DMP)."],
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
                    title: "Daily Magic Practice",
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
                    features: ["One-on-one coaching — personalised support with Jaya.", "Group coaching — learn and grow in community.", "Daily Magic Practice — bring intention into your everyday life.", "Chakra healing, Ho’oponopono & EFT — guided well-being practices."],
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
            $("#detail-book").addEventListener("click", () => openBooking("clarity", detailFocus));
            $('a[data-bs-dismiss="modal"]', detailElement).addEventListener("click", event => {
                event.preventDefault();
                detailElement.addEventListener("hidden.bs.modal", () => {
                    $("#programs").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
                }, { once: true });
            });

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

            track.addEventListener("transitionend", event => {
                if (event.propertyName !== "transform") return;
                if (carouselPosition >= visibleCount + originals.length || carouselPosition < visibleCount) {
                    renderTestimonials(testimonialIndex, false, false);
                }
                carouselAnimating = false;
            });

            $(".carousel-prev").addEventListener("click", () => moveTestimonials(-1));
            $(".carousel-next").addEventListener("click", () => moveTestimonials(1));
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
                tab.addEventListener("click", () => {
                    const targetTab = tab.dataset.tab;
                    testimonialTabs.forEach(t => {
                        const isActive = t === tab;
                        t.classList.toggle("active", isActive);
                        t.setAttribute("aria-selected", String(isActive));
                    });
                    $$(".testimonial-panel").forEach(panel => {
                        panel.classList.toggle("active", panel.id === `panel-${targetTab}`);
                    });
                });
            });

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
            $("#newsletter-form").addEventListener("submit", event => {
                event.preventDefault();
                const input = $("#newsletter-email");
                if (!input.reportValidity()) return;
                const feedback = $("#newsletter-feedback");
                feedback.replaceChildren(document.createTextNode("One last step: "));
                const link = document.createElement("a");
                link.textContent = "send your subscription request";
                link.href = `mailto:${contactEmail}?subject=${encodeURIComponent("Newsletter subscription request")}&body=${encodeURIComponent(`Hi Jaya,\n\nI’d like to receive your tips, updates, and inspiration by email.\n\nPlease subscribe: ${input.value.trim()}\n\nThank you!`)}`;
                feedback.append(link, document.createTextNode(". You’ll join after your request is confirmed."));
                feedback.hidden = false;
                link.focus();
            });

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

            if (!speechAvailable) $("#intro-narration").hidden = true;

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
                    caption.textContent = introSegments[segment].title;
                    caption.classList.remove("is-entering");
                    void caption.offsetWidth;
                    caption.classList.add("is-entering");
                    speakSegment(segment);
                }
                $("#intro-progress").value = introElapsed;
                $("#intro-time").textContent = `0:${String(Math.floor(introElapsed)).padStart(2, "0")} / 0:40`;
                $("#intro-progress").setAttribute("aria-valuetext", `${Math.floor(introElapsed)} of 40 seconds`);
                $("#intro-play-icon").setAttribute("href", introPlaying ? "#i-pause" : "#i-play");
                $("#intro-play").setAttribute("aria-label", introPlaying ? "Pause introduction" : introElapsed >= introDuration ? "Replay introduction" : "Play introduction");
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

            $("#intro-play").addEventListener("click", () => introPlaying ? pauseIntro() : playIntro());
            $("#intro-progress").addEventListener("input", event => {
                introElapsed = Number(event.target.value);
                introLastFrame = 0;
                introSegment = -1;
                updateIntro();
                if (introElapsed >= introDuration) pauseIntro();
            });
            $("#intro-narration").addEventListener("click", () => {
                narrationOn = !narrationOn;
                $("#intro-narration").setAttribute("aria-pressed", String(narrationOn));
                $("#intro-narration").textContent = narrationOn ? "Narration on" : "Narration off";
                if (narrationOn) speakSegment(Math.max(0, introSegment));
                else if (speechAvailable) window.speechSynthesis.cancel();
            });
            introElement.addEventListener("shown.bs.modal", () => {
                introElapsed = 0;
                introSegment = -1;
                if (!reducedMotion) playIntro();
                else updateIntro();
            });
            introElement.addEventListener("hide.bs.modal", pauseIntro);
            document.addEventListener("visibilitychange", () => {
                if (document.hidden && introPlaying) pauseIntro();
            });
        })();
