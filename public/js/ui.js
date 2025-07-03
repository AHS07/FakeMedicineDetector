// UI Initialization
window.initializeUI = function() {
    try {
        // Show/Hide Sections
        window.showSection = function(sectionId) {
            console.log('Showing section:', sectionId);
            const sections = ['welcomeSection', 'medicineRegSection', 'scannerSection', 'authForms', 'generateQR'];
            sections.forEach(section => {
                const element = document.getElementById(section);
                if (element) {
                    element.style.display = section === sectionId ? 'block' : 'none';
                }
            });
        };

        // Show Auth Forms function
        window.showAuthForms = function(show) {
            console.log('UI showAuthForms called with:', show);
            const authForms = document.getElementById('authForms');
            if (authForms) {
                authForms.style.display = show ? 'block' : 'none';
                if (show) {
                    window.showSection('authForms');
                    const userTypeSelection = document.getElementById('userTypeSelection');
                    const loginForm = document.getElementById('loginForm');
                    const registerForm = document.getElementById('registerForm');
                    if (userTypeSelection) userTypeSelection.style.display = 'block';
                    if (loginForm) loginForm.style.display = 'none';
                    if (registerForm) registerForm.style.display = 'none';
                }
            }
        };

        // Navigation Setup
        setupNavigation();

        // Auth State Observer
        setupAuthStateObserver();

        console.log('✅ UI initialized successfully');

    } catch (error) {
        console.error('Error initializing UI:', error);
    }
};

// Setup Navigation
function setupNavigation() {
    const loginBtn = document.getElementById('loginBtn');
    const registerLink = document.getElementById('registerLink');
    const logoutBtn = document.getElementById('logoutBtn');
    const scanLink = document.getElementById('scanLink');
    const generateQRLink = document.getElementById('generateQRLink');

    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.showAuthForms(true);
        });
    }

    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            const user = window.firebaseAuth.currentUser;
            if (!user) {
                alert('Please login first');
                window.showAuthForms(true);
                return;
            }
            window.showSection('medicineRegSection');
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            try {
                await window.firebaseAuth.signOut();
                console.log('User signed out successfully');
                window.showSection('welcomeSection');
            } catch (error) {
                console.error('Error signing out:', error);
                alert('Error signing out: ' + error.message);
            }
        });
    }

    if (scanLink) {
        scanLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.showSection('scannerSection');
        });
    }

    if (generateQRLink) {
        generateQRLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.showSection('generateQR');
        });
    }
}

// Setup Auth State Observer
function setupAuthStateObserver() {
    window.firebaseAuth.onAuthStateChanged((user) => {
        console.log('Auth state changed:', user ? 'logged in' : 'logged out');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const registerLink = document.getElementById('registerLink');
        const generateQRLink = document.getElementById('generateQRLink');

        if (user) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
            if (generateQRLink) generateQRLink.style.display = 'block';
        } else {
            if (loginBtn) loginBtn.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (generateQRLink) generateQRLink.style.display = 'none';
            window.showSection('welcomeSection');
        }
    });
} 