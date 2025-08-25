// Initialize AOS
AOS.init({
    duration: 800,
    easing: 'ease-in-out',
    once: true
});
// ================== STEP INDICATOR UPDATE ==================

function updateStepIndicator(step) {
    const indicator = document.getElementById("stepIndicator");
    const title = document.getElementById("modalTitle");

    if (step === 1) {
        title.innerHTML = '<i class="fas fa-plane me-2"></i>Book Your Trip';
        indicator.innerText = "Step 1 of 3";
        document.getElementById("destinationDisplay").innerText =
            document.getElementById("destinationInput").value;
    } else if (step === 2) {
        title.innerHTML = '<i class="fas fa-mobile-alt me-2"></i>UPI Verification';
        indicator.innerText = "Step 2 of 3";
    } else {
        title.innerHTML = '<i class="fas fa-credit-card me-2"></i>Payment';
        indicator.innerText = "Step 3 of 3";
    }
}

// ================== GLOBAL VARIABLES ==================
let baseAmount = 0,
    timerInterval;

// ================== STEP NAVIGATION ==================

// Step 1 → Step 2
document.getElementById("nextStep").addEventListener("click", () => {
    const travellers =
        parseInt(document.getElementById("travellersInput").value) || 1;
    const totalAmount = baseAmount * travellers;

    document.getElementById("finalAmountInput").value = totalAmount;
    document.getElementById("finalAmountDisplayStep2").innerText = totalAmount.toLocaleString();
    document.getElementById("finalAmountDisplay").innerText = totalAmount.toLocaleString();

    document.getElementById("step1").style.display = "none";
    document.getElementById("step2").style.display = "block";
    updateStepIndicator(2);
});

// Step 2 → Step 1 (Back)
document.getElementById("prevStep2").addEventListener("click", () => {
    document.getElementById("step1").style.display = "block";
    document.getElementById("step2").style.display = "none";
    updateStepIndicator(1);
});

// Step 3 → Step 2 (Back)
document.getElementById("prevStep3").addEventListener("click", () => {
    document.getElementById("step2").style.display = "block";
    document.getElementById("step3").style.display = "none";
    updateStepIndicator(2);
});

// ================== BOOK NOW BUTTON ==================
document.querySelectorAll(".book-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        document.getElementById("destinationInput").value =
            btn.dataset.destination;
        baseAmount = parseInt(btn.dataset.amount) || 0;

        // Initialize with base amount (1 traveller)
        document.getElementById("baseAmountInput").value = baseAmount;
        document.getElementById("finalAmountInput").value = baseAmount;
        document.getElementById("finalAmountDisplayStep2").innerText = baseAmount.toLocaleString();
        document.getElementById("finalAmountDisplay").innerText = baseAmount.toLocaleString();

        // Reset UPI + QR
        document.getElementById("upiIdDisplay").value = "niket.mishra@ptyes";
        document.getElementById("upiQr").style.display = "none";
        document.getElementById("goStep3").style.display = "none";

        // Reset modal steps
        document.getElementById("step1").style.display = "block";
        document.getElementById("step2").style.display = "none";
        document.getElementById("step3").style.display = "none";
        updateStepIndicator(1);
    });
});


// ================== TRAVELLERS LIVE AMOUNT UPDATE ==================
document
    .getElementById("travellersInput")
    .addEventListener("input", () => {
        const travellers =
            parseInt(document.getElementById("travellersInput").value) || 1;
        const totalAmount = baseAmount * travellers;
        document.getElementById("finalAmountDisplayStep2").innerText = totalAmount.toLocaleString();
        document.getElementById("finalAmountDisplay").innerText = totalAmount.toLocaleString();

        // Add animation effect to price change
        const priceElements = document.querySelectorAll("#finalAmountDisplayStep2, #finalAmountDisplay");
        priceElements.forEach(el => {
            el.classList.add('price-pulse');
            setTimeout(() => {
                el.classList.remove('price-pulse');
            }, 500);
        });
    });

// ================== VERIFY UPI ==================
function verifyUPI() {
    const upi = document.getElementById("upiInput").value.trim();
    const travellers =
        parseInt(document.getElementById("travellersInput").value) || 1;
    const totalAmount = baseAmount * travellers;
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z]{3,}$/;

    const errorSpan = document.getElementById("upiError");
    const nameSpan = document.getElementById("upiName");

    errorSpan.innerText = "";
    nameSpan.innerText = "";

    if (!upi) {
        errorSpan.innerText = "⚠️ Please enter UPI ID";
        return;
    }

    if (upiRegex.test(upi)) {
        nameSpan.innerText = `✅ UPI Verified: ${upi}`;
        document.getElementById("goStep3").style.display = "inline-block";

        const merchantUpi = "niket.mishra@ptyes";
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${merchantUpi}&pn=Wanderlust&am=${totalAmount}`;
        document.getElementById("upiQr").src = qrUrl;
        document.getElementById("upiQr").style.display = "block";
    } else {
        errorSpan.innerText = "❌ Invalid UPI ID format";
        document.getElementById("goStep3").style.display = "none";
    }
}

// ================== STEP 2 → STEP 3 ==================
document.getElementById("goStep3").addEventListener("click", () => {
    document.getElementById("step2").style.display = "none";
    document.getElementById("step3").style.display = "block";
    updateStepIndicator(3);

    let timeLeft = 120;
    const timerEl = document.getElementById("paymentTimer");
    timerEl.innerText = `⏳ Time left: ${timeLeft}s`;

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        timerEl.innerText = `⏳ Time left: ${timeLeft}s`;
        if (timeLeft <= 30) {
            timerEl.classList.add('text-danger');
            timerEl.classList.remove('text-warning');
        } else if (timeLeft <= 60) {
            timerEl.classList.add('text-warning');
            timerEl.classList.remove('text-danger');
        }

        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            bookingResult(false);
            setTimeout(() => {
                const modalEl = document.getElementById("bookingModal");
                const modalInstance = bootstrap.Modal.getInstance(modalEl);
                if (modalInstance) modalInstance.hide();
            }, 1500);
        }
    }, 1000);
});

// ================== UTR VALIDATION ==================
document.getElementById("paymentForm").addEventListener("submit", (e) => {
    e.preventDefault();
    clearInterval(timerInterval);

    const utr = document.getElementById("utrInput").value.trim();
    const utrError = document.getElementById("utrError");
    utrError.innerText = "";

    if (!/^\d{12}$/.test(utr)) {
        utrError.innerHTML = '<i class="fas fa-times-circle me-1"></i> Please enter a valid 12-digit UTR';
        return;
    }

    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Processing...';
    submitBtn.disabled = true;

    // Simulate processing delay
    setTimeout(() => {
        bookingResult(true);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
});


// ================== BOOKING RESULT ==================
function bookingResult(success) {
    const modalEl = document.getElementById("successModal");
    const body = modalEl.querySelector(".modal-body");

    if (success) {
        const ref = "WL" + Date.now().toString().slice(-6);
        const destination = document.getElementById("destinationInput").value;
        const travellers = document.getElementById("travellersInput").value;
        const amount = document.getElementById("finalAmountInput").value;

        body.innerHTML = `
                    <div class="success-animation">
                        <svg viewBox="0 0 100 100" class="success-circle">
                            <circle cx="50" cy="50" r="45" />
                        </svg>
                        <svg viewBox="0 0 100 100" class="success-tick">
                            <path d="M25,55 L40,70 L75,35" />
                        </svg>
                       
      <div class="sparkle sparkle-1"></div>
      <div class="sparkle sparkle-2"></div>
      <div class="sparkle sparkle-3"></div>
      <div class="sparkle sparkle-4"></div>
   
                    </div>
                    <div class="p-3 text-center">
                        <h4 class="fw-bold text-success mb-3">Booking Confirmed!</h4>
                        <p class="text-muted">Your trip to <b>${destination}</b> for <b>${travellers}</b> traveler(s) has been booked.</p>
                        <p><b>Amount Paid:</b> ₹${amount}</p>
                        <div class="alert alert-success fw-bold">
                            Ref No: ${ref}  
                            <i class="fas fa-copy ms-2 text-primary" style="cursor:pointer;" onclick="copyRefNo('${ref}')"></i>
                        </div>
                        <p class="text-muted">Save this reference number for future support.</p>
                    </div>
                `;

        // Show success modal
        const successModal = new bootstrap.Modal(modalEl);
        successModal.show();

        // Close the booking modal
        const bookingModalEl = document.getElementById("bookingModal");
        const bookingModal = bootstrap.Modal.getInstance(bookingModalEl);
        if (bookingModal) {
            bookingModal.hide();
        }

        // Confetti effect
        setTimeout(() => {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }, 500);
    }
}


// ================== COPY REF NO ==================
function copyRefNo(ref) {
    navigator.clipboard.writeText(ref).then(() => {
        showToast("Reference number copied to clipboard!", true, 3000);

        // Add visual feedback for copy action
        const copyIcon = document.querySelector('.fa-copy');
        if (copyIcon) {
            copyIcon.classList.remove('fa-copy');
            copyIcon.classList.add('fa-check');
            setTimeout(() => {
                copyIcon.classList.remove('fa-check');
                copyIcon.classList.add('fa-copy');
            }, 2000);
        }
    }).catch(() => {
        showToast("Failed to copy reference number!", false, 3000);
    });
}

// ================== COPY UPI ==================
function copyUPI() {
    const upiField = document.getElementById("upiIdDisplay");
    navigator.clipboard
        .writeText(upiField.value)
        .then(() => {
            showToast("UPI ID Copied!", true, 3000);
        })
        .catch(() => {
            showToast("Copy Failed!", false, 3000);
        });
}

// ================== RESET MODAL ==================
document
    .getElementById("bookingModal")
    .addEventListener("hidden.bs.modal", () => {
        clearInterval(timerInterval);
        document.getElementById("step1").style.display = "block";
        document.getElementById("step2").style.display = "none";
        document.getElementById("step3").style.display = "none";
        document.getElementById("travellerForm").reset();
        document.getElementById("upiForm").reset();
        document.getElementById("paymentForm").reset();
        updateStepIndicator(1);
    });

/* ========= OFFER COUNTDOWN ========= */
function startOfferCountdown() {
    const timers = {
        "timer-paris": "2025-08-25T23:59:59",
        "timer-bali": "2025-08-24T23:59:59",
        "timer-ny": "2025-08-26T23:59:59",
    };

    Object.entries(timers).forEach(([id, end]) => {
        const badge = document.getElementById(id);
        if (!badge) return;

        const endTime = new Date(end).getTime();

        function update() {
            const now = Date.now();
            const distance = endTime - now;
            if (distance <= 0) {
                badge.innerText = "⏳ Expired";
                return;
            }
            const d = Math.floor(distance / (1000 * 60 * 60 * 24));
            const h = Math.floor(
                (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
            );
            const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((distance % (1000 * 60)) / 1000);
            badge.innerText = `🕒 ${d}d ${h}h ${m}m ${s}s`;
        }

        update();
        setInterval(update, 1000);
    });
}

/* ========= SHARE ========= */
function shareBlog(title) {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent("Read this: " + title);

    document.getElementById("shareText").innerText = "Share: " + title;
    document.getElementById(
        "waShare"
    ).href = `https://wa.me/?text=${text}%20${url}`;
    document.getElementById(
        "twShare"
    ).href = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    document.getElementById(
        "liShare"
    ).href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
    document.getElementById(
        "mailShare"
    ).href = `mailto:?subject=${title}&body=${text}%20${url}`;

    new bootstrap.Modal(document.getElementById("shareModal")).show();
}

function openShareMenu() {
    const url = window.location.href;
    const text = "Check out Wanderlust Travel Agency!";

    if (navigator.share) {
        navigator.share({ title: "Wanderlust Travel", text, url });
    } else {
        document.getElementById("shareText").innerText = text;
        document.getElementById(
            "waShare"
        ).href = `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`;
        document.getElementById(
            "twShare"
        ).href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
            text
        )}&url=${encodeURIComponent(url)}`;
        document.getElementById(
            "liShare"
        ).href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
            url
        )}`;
        document.getElementById(
            "mailShare"
        ).href = `mailto:?subject=Wanderlust Travel&body=${encodeURIComponent(
            text + " " + url
        )}`;

        new bootstrap.Modal(document.getElementById("shareModal")).show();
    }
}

// Auto show offer popup after 5s
setTimeout(
    () => new bootstrap.Modal(document.getElementById("offerModal")).show(),
    5000
);



/* ========= TESTIMONIAL CAROUSEL ========= */
document.addEventListener("DOMContentLoaded", () => {
    const carousel = document.querySelector(".testimonial-carousel");
    const wrappers = Array.from(carousel.children);
    const total = wrappers.length;
    const visibleCount = 3;
    let index = 1;

    const lastClone = wrappers[total - 1].cloneNode(true);
    carousel.insertBefore(lastClone, carousel.firstChild);

    for (let i = 0; i < visibleCount; i++) {
        carousel.appendChild(wrappers[i].cloneNode(true));
    }

    carousel.style.transform = `translateX(-${index * (100 / visibleCount)
        }%)`;

    function slide() {
        index++;
        carousel.style.transition = "transform 0.6s ease-in-out";
        carousel.style.transform = `translateX(-${index * (100 / visibleCount)
            }%)`;

        if (index === total) {
            setTimeout(() => {
                carousel.style.transition = "none";
                index = 1;
                carousel.style.transform = `translateX(-${index * (100 / visibleCount)
                    }%)`;
            }, 600);
        }
    }

    setInterval(slide, 3000);
});



// ================== TOAST (with optional auto-close) ==================

function showToast(msg, success = true, autoClose = 0) {
    const toastEl = document.getElementById("bookingToast");
    const msgEl = document.getElementById("toastMessage");

    msgEl.innerHTML = `
                <div class="d-flex align-items-center">
                    <i class="fas ${success ? "fa-check-circle text-success" : "fa-times-circle text-danger"} me-2 fs-5"></i>
                    <div>${msg}</div>
                </div>
            `;

    toastEl.className = `toast align-items-center text-bg-${success ? 'success' : 'danger'} border-0 shadow`;
    const toast = new bootstrap.Toast(toastEl);
    toast.show();

    if (autoClose > 0) {
        setTimeout(() => toast.hide(), autoClose);
    }
}

// ================== BACK TO TOP BUTTON ==================
window.addEventListener('scroll', function () {
    const backToTop = document.querySelector('.back-to-top');
    if (window.pageYOffset > 300) {
        backToTop.classList.add('show');
    } else {
        backToTop.classList.remove('show');
    }
});

document.querySelector('.back-to-top').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initialize on page load
document.addEventListener("DOMContentLoaded", function () {
    startOfferCountdown();

    // Add smooth scrolling to anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
