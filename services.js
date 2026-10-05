(() => {
    "use strict";

    const toggle = document.querySelector(".nav-toggle");
    const navigation = document.querySelector(".site-navigation");
    const header = document.querySelector(".site-header");
    const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 48);

    window.addEventListener("scroll", updateHeader, { passive: true });
    updateHeader();

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

    const newsletterForm = document.querySelector("#newsletter-form");
    if (newsletterForm) {
        newsletterForm.addEventListener("submit", event => {
            event.preventDefault();
            const input = newsletterForm.querySelector("#newsletter-email");
            if (!input.reportValidity()) return;

            const feedback = newsletterForm.parentElement.querySelector("#newsletter-feedback");
            feedback.replaceChildren(document.createTextNode("One last step: "));
            const link = document.createElement("a");
            link.textContent = "send your subscription request";
            link.href = `mailto:contact@manifestwithjaya.com?subject=${encodeURIComponent("Newsletter subscription request")}&body=${encodeURIComponent(`Hi Jaya,\n\nI’d like to receive your tips, updates, and inspiration by email.\n\nPlease subscribe: ${input.value.trim()}\n\nThank you!`)}`;
            feedback.append(link, document.createTextNode(". You’ll join after your request is confirmed."));
            feedback.hidden = false;
            link.focus();
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
            const target = document.getElementById(link.getAttribute("href").slice(1));
            if (!target) return;
            event.preventDefault();
            target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
        });
    });
})();
