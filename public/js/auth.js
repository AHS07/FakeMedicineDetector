// Wait for document to be fully loaded and Firebase to be initialized
document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js: DOM fully loaded');
    
    // Wait for Firebase to be initialized
    const checkFirebase = setInterval(() => {
        if (window.firebaseAuth && window.firebaseDb) {
            console.log('Firebase services detected, initializing auth...');
            clearInterval(checkFirebase);
            initAuth();
        } else {
            console.log('Waiting for Firebase services...');
        }
    }, 100);

    // Timeout after 10 seconds
    setTimeout(() => {
        clearInterval(checkFirebase);
        if (!window.firebaseAuth || !window.firebaseDb) {
            console.error('Firebase services not available after timeout');
            alert('Error: Could not connect to authentication service. Please refresh the page.');
        }
    }, 10000);
});

function initAuth() {
    try {
        // DOM Elements
        const userTypeSelection = document.getElementById('userTypeSelection');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const authForms = document.getElementById('authForms');
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const industryFields = document.getElementById('industryFields');
        const userTypeBtn = document.getElementById('userTypeBtn');
        const industryTypeBtn = document.getElementById('industryTypeBtn');
        const loginTypeText = document.getElementById('loginTypeText');
        const registerTypeText = document.getElementById('registerTypeText');
        const loginAccountType = document.getElementById('loginAccountType');
        const regAccountType = document.getElementById('regAccountType');
        const backToUserType = document.getElementById('backToUserType');
        const backToUserTypeReg = document.getElementById('backToUserTypeReg');
        const loginFormElement = document.getElementById('loginFormElement');
        const registerFormElement = document.getElementById('registerFormElement');
        
        // Log Firebase status
        console.log('Firebase Auth Status:', {
            auth: !!window.firebaseAuth,
            db: !!window.firebaseDb,
            currentUser: window.firebaseAuth ? window.firebaseAuth.currentUser : null
        });

        // Check if elements are found
        console.log('Element checks:', {
            userTypeSelection: !!userTypeSelection,
            loginForm: !!loginForm,
            registerForm: !!registerForm,
            authForms: !!authForms,
            loginBtn: !!loginBtn,
            logoutBtn: !!logoutBtn
        });

        // Define the showAuthForms function directly in auth.js
        function showAuthForms(show) {
            console.log('Auth.js showAuthForms called with:', show);
            if (authForms) {
                authForms.style.display = show ? 'block' : 'none';
                
                if (show && userTypeSelection) {
                    // Try to use the showSection function from index.html if available
                    if (typeof window.showSection === 'function') {
                        window.showSection('authForms');
                    }
                    
                    userTypeSelection.style.display = 'block';
                    loginForm.style.display = 'none';
                    registerForm.style.display = 'none';
                }
            } else {
                console.error('authForms element not found');
            }
        }

        // User Account Type Selection
        if (userTypeBtn) {
            userTypeBtn.addEventListener('click', () => {
                selectAccountType('user');
            });
        }

        if (industryTypeBtn) {
            industryTypeBtn.addEventListener('click', () => {
                selectAccountType('industry');
            });
        }

        function selectAccountType(type) {
            // Set account type
            loginAccountType.value = type;
            regAccountType.value = type;
            
            // Update UI text
            loginTypeText.textContent = type === 'user' ? '(User)' : '(Industry)';
            registerTypeText.textContent = type === 'user' ? '(User)' : '(Industry)';
            
            // Show/hide industry-specific fields
            if (type === 'industry' && industryFields) {
                industryFields.style.display = 'block';
                // Make industry fields required
                document.getElementById('companyName').required = true;
                document.getElementById('licenseNumber').required = true;
                document.getElementById('licenseExpiry').required = true;
                document.getElementById('licenseAuthority').required = true;
            } else if (industryFields) {
                industryFields.style.display = 'none';
                // Make industry fields not required
                document.getElementById('companyName').required = false;
                document.getElementById('licenseNumber').required = false;
                document.getElementById('licenseExpiry').required = false;
                document.getElementById('licenseAuthority').required = false;
            }
            
            // Hide user type selection, show login form
            if (userTypeSelection) userTypeSelection.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        }

        // Back to account type selection
        if (backToUserType) {
            backToUserType.addEventListener('click', (e) => {
                e.preventDefault();
                if (userTypeSelection) userTypeSelection.style.display = 'block';
                if (loginForm) loginForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'none';
            });
        }

        if (backToUserTypeReg) {
            backToUserTypeReg.addEventListener('click', (e) => {
                e.preventDefault();
                if (userTypeSelection) userTypeSelection.style.display = 'block';
                if (loginForm) loginForm.style.display = 'none';
                if (registerForm) registerForm.style.display = 'none';
            });
        }

        // Show registration form
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (loginForm) loginForm.style.display = 'none';
            if (registerForm) registerForm.style.display = 'block';
        });

        // Show login form
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            if (registerForm) registerForm.style.display = 'none';
            if (loginForm) loginForm.style.display = 'block';
        });

        // Login Form Handler
        if (loginFormElement) {
            loginFormElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                console.log('Login form submitted');
                
                try {
                    const email = document.getElementById('loginEmail')?.value;
                    const password = document.getElementById('loginPassword')?.value;
                    const accountType = document.getElementById('loginAccountType')?.value;
                    
                    if (!email || !password || !accountType) {
                        throw new Error('Please fill in all fields');
                    }
                    
                    console.log('Login attempt:', { email, accountType });
                    
                    // Ensure Firebase Auth is available
                    if (!window.firebaseAuth) {
                        throw new Error('Authentication service not available');
                    }

                    // Attempt login
                    const userCredential = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                    console.log('Firebase auth successful:', userCredential);
                    
                    const user = userCredential.user;
                    if (!user) {
                        throw new Error('Login successful but user object is null');
                    }
                    
                    // Check user type in Firestore
                    const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
                    
                    if (!userDoc.exists) {
                        await window.firebaseAuth.signOut();
                        throw new Error('Account not found in database. Please register first.');
                    }
                    
                    const userData = userDoc.data();
                    if (userData.accountType !== accountType) {
                        await window.firebaseAuth.signOut();
                        throw new Error(`This is not a ${accountType} account. Please select the correct account type.`);
                    }
                    
                    console.log('Login successful:', userData);
                    if (typeof window.showAuthForms === 'function') {
                        window.showAuthForms(false);
                    }
                    
                    // Show success message
                    alert('Login successful!');
                    
                } catch (error) {
                    console.error('Login error:', error);
                    alert(error.message || 'Login failed. Please try again.');
                }
            });
        }

        // Signup Form Handler
        if (registerFormElement) {
            registerFormElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('regName').value;
                const email = document.getElementById('regEmail').value;
                const password = document.getElementById('regPassword').value;
                const accountType = document.getElementById('regAccountType').value;
                
                try {
                    // Create user account
                    const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
                    const user = userCredential.user;
                    
                    // Prepare user data
                    const userData = {
                        name,
                        email,
                        accountType,
                        createdAt: new Date().toISOString()
                    };
                    
                    // For industry accounts, store license info
                    if (accountType === 'industry') {
                        userData.company = document.getElementById('companyName').value;
                        userData.license = {
                            number: document.getElementById('licenseNumber').value,
                            expiry: document.getElementById('licenseExpiry').value,
                            authority: document.getElementById('licenseAuthority').value,
                            verified: false, // Initially unverified
                            status: 'pending' // pending, approved, rejected
                        };
                    }
                    
                    // Save to Firestore
                    await window.firebaseDb.collection('users').doc(user.uid).set(userData);
                    
                    // Update profile
                    await user.updateProfile({
                        displayName: name
                    });
                    
                    console.log('Registration successful for', accountType);
                    showAuthForms(false);
                    
                    // For industry accounts, display license details
                    if (accountType === 'industry') {
                        displayLicenseDetails(userData);
                    }
                    
                    // Show/hide medicine registration based on account type
                    const registerLink = document.getElementById('registerLink');
                    if (accountType === 'industry') {
                        registerLink.style.display = 'block';
                    } else {
                        registerLink.style.display = 'none';
                    }
                    
                    // Clear form
                    e.target.reset();
                    
                } catch (error) {
                    console.error('Registration error:', error);
                    alert('Registration failed: ' + error.message);
                }
            });
        }

        // Logout Button Handler
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                try {
                    await window.firebaseAuth.signOut();
                    console.log('Logout successful');
                } catch (error) {
                    console.error('Logout error:', error);
                    alert('Logout failed: ' + error.message);
                }
            });
        }

        // Display license details in the medicine registration section
        function displayLicenseDetails(userData) {
            if (userData.accountType !== 'industry' || !userData.license) return;
            
            document.getElementById('companyNameDisplay').textContent = userData.company || '-';
            document.getElementById('licenseNumberDisplay').textContent = userData.license.number || '-';
            document.getElementById('licenseExpiryDisplay').textContent = userData.license.expiry ? new Date(userData.license.expiry).toLocaleDateString() : '-';
            document.getElementById('licenseAuthorityDisplay').textContent = userData.license.authority || '-';
            
            const licenseStatus = document.getElementById('licenseStatusDisplay');
            if (licenseStatus) {
                switch (userData.license.status) {
                    case 'approved':
                        licenseStatus.innerHTML = '<span class="status-approved">✓ Verified</span>';
                        break;
                    case 'rejected':
                        licenseStatus.innerHTML = '<span class="status-rejected">✗ Rejected</span>';
                        break;
                    default:
                        licenseStatus.innerHTML = '<span class="status-pending">⏳ Verification pending</span>';
                }
            }
        }

        // Auth State Observer
        window.firebaseAuth.onAuthStateChanged(async (user) => {
            if (user) {
                // User is signed in
                if (loginBtn) loginBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'block';
                
                // Check user type
                try {
                    const userDoc = await window.firebaseDb.collection('users').doc(user.uid).get();
                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        
                        // Only show medicine registration for industry accounts
                        const registerLink = document.getElementById('registerLink');
                        if (registerLink) {
                            if (userData.accountType === 'industry') {
                                registerLink.style.display = 'block';
                                displayLicenseDetails(userData);
                            } else {
                                registerLink.style.display = 'none';
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                // User is signed out
                if (loginBtn) loginBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
                const registerLink = document.getElementById('registerLink');
                if (registerLink) registerLink.style.display = 'none';
            }
        });
        
        // Make test user creation function available globally
        window.createTestUser = async function(type) {
            try {
                const email = type === 'user' ? 'testuser@example.com' : 'testindustry@example.com';
                const password = 'Test123456';
                const name = type === 'user' ? 'Test User' : 'Test Industry';
                
                // Check if user already exists
                try {
                    await window.firebaseAuth.signInWithEmailAndPassword(email, password);
                    alert(`Test ${type} already exists. You can login with:\nEmail: ${email}\nPassword: ${password}`);
                    await window.firebaseAuth.signOut();
                    return;
                } catch (err) {
                    console.log('User does not exist yet, will create');
                }
                
                // Create new user
                const userCredential = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Prepare user data
                const userData = {
                    name,
                    email,
                    accountType: type,
                    createdAt: new Date().toISOString()
                };
                
                // For industry accounts, create license
                if (type === 'industry') {
                    userData.company = 'Test Pharma Inc.';
                    userData.license = {
                        number: 'TEST-12345-LIC',
                        expiry: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                        authority: 'Test Medical Authority',
                        verified: true,
                        status: 'approved'
                    };
                }
                
                // Save to Firestore
                await window.firebaseDb.collection('users').doc(user.uid).set(userData);
                
                // Update profile
                await user.updateProfile({
                    displayName: name
                });
                
                await window.firebaseAuth.signOut();
                
                alert(`Test ${type} created successfully! You can login with:\nEmail: ${email}\nPassword: ${password}`);
                
            } catch (error) {
                console.error('Error creating test user:', error);
                alert('Error creating test user: ' + error.message);
            }
        };

        // Make license approval function available globally
        window.approveMyLicense = async function() {
            try {
                const user = window.firebaseAuth.currentUser;
                if (!user) {
                    throw new Error('Please login first');
                }
                
                await window.firebaseDb.collection('users').doc(user.uid).update({
                    'license.status': 'approved',
                    'license.verified': true
                });
                
                alert('Your license has been approved for testing purposes.');
                location.reload();
            } catch (error) {
                console.error('Error approving license:', error);
                alert('Error: ' + error.message);
            }
        };
    } catch (error) {
        console.error('Error in initAuth:', error);
        alert('Error initializing authentication. Please check console for details.');
    }
} 