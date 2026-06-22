// --- 1. UI HELPERS ---
console.log("js loaded");
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast-popup';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
let otpTimer;

// --- 1. SEND OTP ---
function sendOTP() {
    
    const email = document.getElementById('forgotEmail').value.trim();

    if (!email || !email.endsWith("@gmail.com")) {
        showToast("⚠️ Please enter a valid @gmail.com address");
        return;
    }

    const params = new URLSearchParams();
    params.append('f_email', email); // Key name sent to Java

    fetch('./OTPServlet', { 
        method: 'POST', 
        body: params 
    })
    .then(res => res.text())
    .then(data => {
        if (data.trim() === "otp_sent") {
            showToast("✅ OTP sent to " + email);
            showView('otp');   // Switch to OTP entry screen
            startOTPTimer();   // Start countdown
        } else if (data.trim() === "user_not_found") {
            showToast("❌ This email is not registered.");
        } else {
            showToast("⚠️ Error: " + data);
        }
    })
    .catch(err => showToast("⚠️ Connection failed."));
}

// --- 2. OTP TIMER LOGIC ---
function startOTPTimer() {
    let timeLeft = 30;
    const display = document.getElementById('timer');
    const timerBox = document.getElementById('timerContainer');
    const resendBox = document.getElementById('resendContainer');

    timerBox.style.display = 'block';
    resendBox.style.display = 'none';

    clearInterval(otpTimer);
    otpTimer = setInterval(() => {
        timeLeft--;
        display.innerText = `00:${timeLeft < 10 ? '0' : ''}${timeLeft}`;
        
        if (timeLeft <= 0) {
            clearInterval(otpTimer);
            timerBox.style.display = 'none';
            resendBox.style.display = 'block'; // Show Resend option
        }
    }, 1000);
}


let userEmailForReset = "";

// --- UPDATE THIS FUNCTION ---
function verifyOTP() {
    const otpInput = document.getElementById('otpInput');
    const enteredCode = otpInput.value.trim();

    // Since you see the OTP in your Java Terminal, 
    // you will type that number here.
    if (enteredCode.length === 6) {
        showToast("✅ Identity Verified!");
        
        // 1. Capture the email from the previous step
        userEmailForReset = document.getElementById('forgotEmail').value.trim();
        document.getElementById('displayResetEmail').innerText = userEmailForReset;

        // 2. Switch to the new Password View
        showView('resetPassword'); 
    } else {
        showToast("❌ Enter the 6-digit code from the terminal.");
    }
}

// --- ADD THIS NEW FUNCTION ---
function handlePasswordUpdate() {
    const newPass = document.getElementById('newPassInput').value;
    const confirmPass = document.getElementById('confirmPassInput').value;

    // 1. Validation
    if (newPass.length < 5 || !/[A-Z]/.test(newPass)) {
        showToast("⚠️ Password must be 5+ chars with 1 Uppercase");
        return;
    }
    if (newPass !== confirmPass) {
        showToast("❌ Passwords do not match!");
        return;
    }

    // 2. Send to Java to update MySQL
    const params = new URLSearchParams();
    params.append('email', userEmailForReset);
    params.append('password', newPass);

    fetch('./ResetPasswordServlet', {
        method: 'POST',
        body: params
    })
    .then(res => res.text())
    .then(data => {
        if (data.trim() === "success") {
            showToast("✅ Password Updated! Please Login.");
            setTimeout(() => { showView('login'); }, 2000);
        } else {
            showToast("❌ Error updating password.");
        }
    });
}

// --- 2. SIGNUP LOGIC (STRICT) ---
function handleSignup() {
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const pass = document.getElementById('signupPass').value.trim();

    // IF ANY FIELD IS EMPTY, WE STOP COMPLETELY
    if (name === "" || email === "" || pass === "") {
       // alert("VALIDATION ERROR: Please fill all fields."); // Proves JS is working
        showToast("⚠️ All fields are mandatory!");
        return; 
    }

    if (!email.toLowerCase().endsWith("@gmail.com")) {
        showToast("⚠️ Use [email protected] format");
        return;
    }

    const params = new URLSearchParams();
    params.append('f_name', name);
    params.append('f_email', email);
    params.append('f_pass', pass);

    fetch('./SignupServlet', { method: 'POST', body: params })
   //fetch(window.location.pathname.replace("index.html","") + 'SignupServlet',{ method: 'POST', body: params })
    //.then(res => res.text())
    .then(res => {
        if (!res.ok) throw new Error("404: Servlet Not Found");
        return res.text();
    })
    .then(data => {
        if(data.trim() === "success") {
            showToast("✅ Account created! Redirecting to Login...");
            setTimeout(() => showView('login'), 1500);
        } else {
            showToast("❌ Server Error: " +data);
        }
    });
}

// --- 3. LOGIN LOGIC ---
function handleLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    if (!email || !pass) {
        showToast("⚠️ Please enter Email and Password");
        return;
    }

    const params = new URLSearchParams();
    params.append('l_email', email);
    params.append('l_pass', pass);

    fetch('./LoginServlet', { method: 'POST', body: params })
    .then(res => res.text())
    .then(data => {
        if (data.trim() === "success") {
            sessionStorage.setItem('isLoggedIn', 'true');
            window.location.href = 'app.html';
        } else {
            showToast("❌ Invalid Credentials");
        }
    });
}

// --- 4. NAVIGATION & VIEWS ---
function checkAccess(featureName) {
    if (sessionStorage.getItem('isLoggedIn') === 'true') {
        window.location.href = 'app.html';
    } else {
        showToast(`Welcome! Please Sign Up to use ${featureName}`);
        openModal('signup');
    }
}

function openModal(view) {
    document.getElementById('authModal').style.display = 'flex';
    showView(view);
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
}

function showView(view) {
    document.querySelectorAll('.auth-view').forEach(v => v.style.display = 'none');
    document.getElementById(view + 'View').style.display = 'block';
}

window.onclick = (e) => { 
    if(e.target == document.getElementById('authModal')) closeModal(); 
}
function toggleMenu() {
    const nav = document.getElementById('navLinks');
    nav.style.display = (nav.style.display === 'flex') ? 'none' : 'flex';
}

// Close modal when clicking background
window.onclick = (e) => { 
    if(e.target == document.getElementById('authModal')) closeModal(); 
}
/**
 * switchView: Handles Single-Page Navigation
 * aram {HTMLElement} element - The link that was clicked
 
function switchView(viewName, element) {
    // 1. Hide the Hero Section (Main Landing Page)
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroSection.style.display = 'none';
    }

    // 2. Hide all other sections that have the class 'view'
    const allViews = document.querySelectorAll('.view');
    allViews.forEach(view => {
        view.style.display = 'none';
    });

    // 3. Find the target view (ID: playground-view)
    const targetId = viewName + '-view';
    const targetView = document.getElementById(targetId);

    if (targetView) {
        // Show the new workspace
        targetView.style.display = 'block';
        
        // 4. Update the navigation styling (Active Link)
        const navLinks = document.querySelectorAll('.nav-links a');
        navLinks.forEach(link => link.style.color = ''); // Reset colors
        
        if (element) {
            element.style.color = '#00c6ff'; // Highlight clicked link
        }
        
        console.log("Entering World: " + viewName);
    } else {
        console.error("View not found: " + targetId);
    }
}*/
function switchView(viewName, element) {
    // 1. URL & Scroll Reset
    if (window.event) window.event.preventDefault();
    window.history.replaceState(null, null, window.location.pathname);
    window.scrollTo(0, 0);

    // 2. Identify your specific containers
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const footer = document.querySelector('footer');
    const playground = document.getElementById('playground-view');
    const docViewer = document.getElementById('doc-viewer-section'); // YOUR SPECIFIC ID
    const landingSections = document.querySelectorAll('section');

    // 3. THE HARD RESET: Hide everything first
    if (playground) playground.style.display = 'none';
    if (docViewer) docViewer.style.display = 'none';
    if (navbar) navbar.style.display = 'none';
    if (hero) hero.style.display = 'none';
    if (footer) footer.style.display = 'none';
    
    landingSections.forEach(s => {
        s.style.display = 'none';
    }); 
    // 4. NAVIGATION LOGIC
    if (viewName === 'playground') { if (navbar) navbar.style.display = 'none';
        // --- SHOW EDITOR WORLD ---
        if (playground) playground.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Lock scroll
    } 
    else if (viewName === 'home' || viewName === 'features' || viewName === 'faq') {
        // --- SHOW LANDING WORLD ---
        if (navbar) navbar.style.display = 'flex'; // Restore spacing
        if (hero) hero.style.display = 'block';
        if (footer) footer.style.display = 'block';

        landingSections.forEach(s => {
            // ONLY show sections that are NOT the editor or the doc viewer
            if (s.id !== 'playground-view' && s.id !== 'doc-viewer-section') {
                s.style.display = 'block';
            }
        });

        document.body.style.overflow = 'auto'; // Enable scrolling

        // If clicking Features/FAQ, scroll to them
        if (viewName !== 'home') {
            const target = document.getElementById(viewName);
            if (target) target.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Make sure your Logout button calls this
function exitFrontendLab() {
    switchView('home');
}
// --- 5. DOCUMENT VIEWER ---
function enterDocView(fileName, title) {
    ['hero', 'features', 'highlight-section', 'community-section', 'faq', 'main-footer'].forEach(s => {
        const el = document.querySelector('.' + s);
        if(el) el.style.display = 'none';
    });
    document.getElementById('doc-viewer-section').style.display = 'block';
    document.getElementById('doc-view-title').innerText = title;
    fetch(fileName).then(res => res.text()).then(data => {
        document.getElementById('doc-view-content').innerHTML = data;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function exitDocView() {
    document.getElementById('doc-viewer-section').style.display = 'none';
    ['hero', 'features', 'highlight-section', 'community-section', 'faq', 'main-footer'].forEach(s => {
        const el = document.querySelector('.' + s);
        if(el) el.style.display = 'block';
    });
}

// Emergency Reset: Press ESC to clear everything
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        sessionStorage.clear();
        localStorage.clear();
        location.reload();
    }
});
// ==========================================
// 5. SCROLL & SLIDER LOGIC
// ==========================================

const backToTopBtn = document.getElementById("backToTop");


window.addEventListener('scroll', () => {
    const backToTopBtn = document.getElementById("backToTop");
    const docViewer = document.getElementById('doc-viewer-section');

    // If the button doesn't exist in HTML, stop here to prevent errors
    if (!backToTopBtn) return;

    // 1. Check if we are currently inside the Document/Privacy View
    // We check if the viewer exists and if it is currently visible
    let isInsideDoc = docViewer && window.getComputedStyle(docViewer).display !== 'none';

    if (isInsideDoc) {
        // Hide button immediately if we are reading a document
        backToTopBtn.classList.remove("show");
    } else {
        // 2. Standard Landing Page Logic
        let totalPageHeight = document.documentElement.scrollHeight;
        let scrollPosition = window.innerHeight + window.pageYOffset;

        // Show button only when near the bottom (last 600px of the page)
        if (scrollPosition >= (totalPageHeight - 600)) {
            backToTopBtn.classList.add("show");
        } else {
            backToTopBtn.classList.remove("show");
        }
    }
});

if(backToTopBtn) {
    backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

// Feature Slider initialization (Same as yours)
let currentSlide = 0;
const slides = document.querySelectorAll('.feature-card');
const track = document.getElementById('sliderTrack');
const dotsContainer = document.getElementById('dotsContainer');

if(dotsContainer && slides.length > 0) {
    slides.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (i === 0) dot.classList.add('active');
        dot.onclick = () => goToSlide(i);
        dotsContainer.appendChild(dot);
    });
}

function updateSlider() {
    if(track) track.style.transform = `translateX(-${currentSlide * 100}%)`;
    document.querySelectorAll('.dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function moveSlide(dir) {
    currentSlide = (currentSlide + dir + slides.length) % slides.length;
    updateSlider();
}

function goToSlide(idx) { currentSlide = idx; updateSlider(); }

function toggleFaq(el) { el.parentElement.classList.toggle('active'); }
// Emergency Reset for your Presentation
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        sessionStorage.clear();
        localStorage.clear();
        alert("System Reset: All sessions cleared for Demo.");
        location.reload();
    }
});
