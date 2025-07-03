// Initialize Firebase Auth
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const userTypeSelection = document.getElementById('userTypeSelection');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authForms = document.getElementById('authForms');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const registerLink = document.getElementById('registerLink');
    const industryFields = document.getElementById('industryFields');

    // Show/Hide Sections
    window.showSection = function(sectionId) {
        const sections = ['welcomeSection', 'medicineRegSection', 'scannerSection', 'authForms'];
        sections.forEach(section => {
            const element = document.getElementById(section);
            if (element) {
                element.style.display = section === sectionId ? 'block' : 'none';
            }
        });
    };

    // Show Auth Forms
    window.showAuthForms = function(show) {
        if (authForms) {
            authForms.style.display = show ? 'block' : 'none';
            if (show) {
                showSection('authForms');
                if (userTypeSelection) userTypeSelection.style.display = 'block';
                if (loginForm) loginForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'none';
            }
        }
    };

    // User Type Selection
    document.getElementById('userTypeBtn')?.addEventListener('click', () => selectAccountType('user'));
    document.getElementById('industryTypeBtn')?.addEventListener('click', () => selectAccountType('industry'));

    function selectAccountType(type) {
        document.getElementById('loginAccountType').value = type;
        document.getElementById('regAccountType').value = type;
        document.getElementById('loginTypeText').textContent = `(${type})`;
        document.getElementById('registerTypeText').textContent = `(${type})`;
        
        if (type === 'industry' && industryFields) {
            industryFields.style.display = 'block';
            document.querySelectorAll('#industryFields input').forEach(input => input.required = true);
        } else if (industryFields) {
            industryFields.style.display = 'none';
            document.querySelectorAll('#industryFields input').forEach(input => input.required = false);
        }
        
        if (userTypeSelection) userTypeSelection.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
    }

    // Form Navigation
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    document.getElementById('showLogin')?.addEventListener('click', (e) => {
        e.preventDefault();
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });

    document.getElementById('backToUserType')?.addEventListener('click', (e) => {
        e.preventDefault();
        userTypeSelection.style.display = 'block';
        loginForm.style.display = 'none';
    });

    document.getElementById('backToUserTypeReg')?.addEventListener('click', (e) => {
        e.preventDefault();
        userTypeSelection.style.display = 'block';
        registerForm.style.display = 'none';
    });

    // Handle form submissions
    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/api/register', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    // Show success message
                    alert('Registration successful! Please login to continue.');
                    // Redirect to login page with the same account type
                    const accountType = formData.get('account_type');
                    window.location.href = `/login?type=${accountType}`;
                } else {
                    alert(data.error || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during registration. Please try again.');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            try {
                const formData = new FormData(this);
                const response = await fetch('/api/login', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect;
                } else {
                    alert(data.error || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred during login. Please try again.');
            }
        });
    }

    // Handle logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Clear any stored session data if needed
            window.location.href = '/';
        });
    }
}); 