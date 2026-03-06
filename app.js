// Mars Algoritmika - Main Application JavaScript
// Azerbaijani Educational Platform

// ================================
// Global Variables
// ================================
let currentUser = null;
let currentClass = '';
let currentModule = '';
let allQuestions = [];
let filteredQuestions = [];

// ================================
// Galaktik Alfabe (Galactic Alphabet)
// Based on the cosmic/space theme for Mars
// ================================
const galacticAlphabet = {
    'a': 'ᚠ', 'b': 'ᚢ', 'c': 'ᚦ', 'd': 'ᚨ', 'e': 'ᚱ',
    'f': 'ᚲ', 'g': 'ᚷ', 'h': 'ᚹ', 'i': 'ᚺ', 'j': 'ᚾ',
    'k': 'ᛁ', 'l': 'ᛃ', 'm': 'ᛇ', 'n': 'ᛈ', 'o': 'ᛉ',
    'p': 'ᛊ', 'q': 'ᛏ', 'r': 'ᛒ', 's': 'ᛖ', 't': 'ᛗ',
    'u': 'ᛚ', 'v': 'ᛜ', 'w': 'ᛞ', 'x': 'ᛟ', 'y': 'ᛠ',
    'z': 'ᛡ', ' ': ' '
};

function textToGalactic(text) {
    return text.toLowerCase().split('').map(char => galacticAlphabet[char] || char).join('');
}

// ================================
// Entrance Animation
// ================================
function playEntranceAnimation() {
    const overlay = document.getElementById('entrance-overlay');
    const galacticText = document.getElementById('galactic-text');
    
    // Display "close" in Galactic alphabet
    galacticText.textContent = textToGalactic('close');
    
    // Hide after animation
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 2500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check dark mode preference
    if (localStorage.getItem('darkMode') === 'false') {
        document.body.setAttribute('data-theme', 'light');
    }
    
    // Play entrance animation
    setTimeout(playEntranceAnimation, 500);
    
    // Check auth state
    checkAuthState();
});

// ================================
// Secret Admin Access
// ================================

// Method 1: Logo triple click
let clickCount = 0;
let clickTimer = null;

document.querySelector('.nav-logo').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 3) {
        promptAdminPassword();
        clickCount = 0;
    }
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => {
        clickCount = 0;
    }, 500);
});

// Method 2: Press 'M' + 'A' keys together (or M then A)
let keySequence = [];
const secretKeys = ['m', 'a'];

document.addEventListener('keydown', (e) => {
    keySequence.push(e.key.toLowerCase());
    if (keySequence.length > 5) keySequence.shift();
    
    // Check if user typed 'ma' or 'mars'
    const lastKeys = keySequence.join('');
    if (lastKeys.includes('ma')) {
        promptAdminPassword();
        keySequence = [];
    }
});

// Method 3: Console command (for developers)
window.openAdminPanel = function() {
    promptAdminPassword();
};

function promptAdminPassword() {
    const password = prompt('Admin parolu:');
    if (password === 'admin.az') {
        switchTab('admin');
    } else if (password !== null) {
        alert('Yanlış parol!');
    }
}

// ================================
// Tab Navigation
// ================================
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const tabButton = document.querySelector('[data-tab="' + tabName + '"]');
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // Update content sections
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(tabName + '-section').classList.add('active');
    
    // Reset views when switching tabs
    if (tabName !== 'home') {
        hideAnswer();
    }
}

// ================================
// Class and Module Selection
// ================================
function loadModules() {
    const classSelect = document.getElementById('class-select');
    const moduleSelection = document.getElementById('module-selection');
    const searchSection = document.getElementById('search-section');
    const questionsContainer = document.getElementById('questions-container');
    
    currentClass = classSelect.value;
    
    if (currentClass) {
        moduleSelection.style.display = 'block';
        searchSection.style.display = 'none';
        questionsContainer.style.display = 'none';
        document.getElementById('module-select').value = '';
        document.getElementById('search-input').value = '';
        currentModule = '';
        loadQuestionsFromFirebase();
    } else {
        moduleSelection.style.display = 'none';
        searchSection.style.display = 'none';
        questionsContainer.style.display = 'none';
    }
}

function loadQuestions() {
    const moduleSelect = document.getElementById('module-select');
    const searchSection = document.getElementById('search-section');
    const questionsContainer = document.getElementById('questions-container');
    
    currentModule = moduleSelect.value;
    
    if (currentModule) {
        searchSection.style.display = 'block';
        questionsContainer.style.display = 'block';
        document.getElementById('search-input').value = '';
        loadQuestionsFromFirebase();
    } else {
        searchSection.style.display = 'none';
        questionsContainer.style.display = 'none';
    }
}

// ================================
// Firebase Data Operations
// ================================
function loadQuestionsFromFirebase() {
    const classSelect = document.getElementById('class-select').value;
    const moduleSelect = document.getElementById('module-select').value;
    
    if (!classSelect || !moduleSelect) return;
    
    // Show loading state
    document.getElementById('questions-list').innerHTML = '<p class="loading">Yüklənir...</p>';
    
    // Reference to the questions path
    const questionsRef = firebase.database().ref('classes/' + classSelect + '/modules/' + moduleSelect + '/questions');
    
    questionsRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            allQuestions = [];
            
            if (data) {
                Object.keys(data).forEach(key => {
                    allQuestions.push({
                        id: key,
                        ...data[key]
                    });
                });
            }
            
            // Sort by question number
            allQuestions.sort((a, b) => (a.questionNum || 0) - (b.questionNum || 0));
            
            filteredQuestions = [...allQuestions];
            displayQuestions(filteredQuestions);
        })
        .catch((error) => {
            console.error('Error loading questions:', error);
            document.getElementById('questions-list').innerHTML = 
                '<p class="error-message">Xəta baş verdi. Yenidən cəhd edin.</p>';
        });
}

function displayQuestions(questions) {
    const questionsList = document.getElementById('questions-list');
    
    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="no-results">Bu modulda hələ sual yoxdur.</p>';
        return;
    }
    
    questionsList.innerHTML = questions.map(q => {
        const badge = q.answerType ? '<span class="question-badge">' + getAnswerTypeLabel(q.answerType) + '</span>' : '';
        return '<div class="question-card" onclick="showAnswer(\'' + q.id + '\')">' +
            '<div class="question-header">' +
                '<span class="question-number">Sual №' + (q.questionNum || '?') + '</span>' +
                badge +
            '</div>' +
            '<p class="question-text">' + (q.questionText || 'Sual mətni yoxdur') + '</p>' +
        '</div>';
    }).join('');
}

function getAnswerTypeLabel(type) {
    const labels = {
        'text': 'Mətn',
        'code': 'Kod',
        'image': 'Şəkil',
        'video': 'Video',
        'link': 'Link'
    };
    return labels[type] || type;
}

// ================================
// Search Functionality
// ================================
function searchQuestions() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredQuestions = [...allQuestions];
    } else {
        // Search in question number and text
        filteredQuestions = allQuestions.filter(q => {
            const questionNum = String(q.questionNum || '').toLowerCase();
            const questionText = (q.questionText || '').toLowerCase();
            return questionNum.includes(searchTerm) || questionText.includes(searchTerm);
        });
    }
    
    displayQuestions(filteredQuestions);
}

// ================================
// Answer Display
// ================================
function showAnswer(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;
    
    const answerContainer = document.getElementById('answer-container');
    const answerContent = document.getElementById('answer-content');
    const questionsContainer = document.getElementById('questions-container');
    
    // Build answer HTML
    let answerHTML = '<div class="answer-header">' +
        '<div class="answer-question">' +
            '<strong>Sual №' + question.questionNum + '</strong>' +
        '</div>';
    
    if (question.answerType) {
        answerHTML += '<span class="answer-type-badge">' + getAnswerTypeLabel(question.answerType) + '</span>';
    }
    
    answerHTML += '</div><div class="answer-body">';
    
    // Add question text
    if (question.questionText) {
        answerHTML += '<p class="answer-text" style="margin-bottom: 1.5rem;">' + question.questionText + '</p>';
    }
    
    // Add answer based on type
    switch (question.answerType) {
        case 'text':
            answerHTML += '<p class="answer-text">' + (question.answerText || 'Cavab yoxdur') + '</p>';
            break;
            
        case 'code':
            const codeContent = question.answerCode || '';
            answerHTML += '<div class="code-block">' +
                '<button class="copy-btn" onclick="copyCode(this)">' +
                    '<i class="fas fa-copy"></i> Kopya' +
                '</button>' +
                '<pre><code>' + escapeHtml(codeContent) + '</code></pre>' +
            '</div>';
            break;
            
        case 'image':
            answerHTML += '<img src="' + (question.answerMedia || '') + '" alt="Cavab şəkili" class="answer-media">';
            break;
            
        case 'video':
            answerHTML += '<video controls class="answer-video">' +
                '<source src="' + (question.answerMedia || '') + '" type="video/mp4">' +
                'Video dəstəklənmir' +
            '</video>';
            break;
            
        case 'link':
            answerHTML += '<a href="' + (question.answerLink || '#') + '" target="_blank" class="answer-link">' +
                '<i class="fas fa-external-link-alt"></i> ' + (question.answerLink || 'Link') +
            '</a>';
            break;
            
        default:
            answerHTML += '<p class="answer-text">Cavab hələ əlavə edilməyib</p>';
    }
    
    answerHTML += '</div>';
    
    // Add admin note if exists
    if (question.adminNote) {
        answerHTML += '<div class="answer-note" style="margin-top: 1rem; padding: 0.75rem; background: rgba(69, 123, 157, 0.1); border-radius: 8px;">' +
            '<small style="color: var(--text-muted);">Qeyd: ' + escapeHtml(question.adminNote) + '</small>' +
        '</div>';
    }
    
    answerContent.innerHTML = answerHTML;
    questionsContainer.style.display = 'none';
    answerContainer.style.display = 'block';
}

function hideAnswer() {
    document.getElementById('answer-container').style.display = 'none';
    document.getElementById('questions-container').style.display = 'block';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ================================
// Copy Button Functionality
// ================================
function copyCode(btn) {
    const codeBlock = btn.parentElement;
    const code = codeBlock.querySelector('code').textContent;
    
    navigator.clipboard.writeText(code).then(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Kopya olundu';
        btn.classList.add('copied');
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-copy"></i> Kopya';
            btn.classList.remove('copied');
        }, 2000);
    });
}

// ================================
// Admin Authentication
// ================================
const ADMIN_PASSWORD = 'admin.az';
let isAdminLoggedIn = false;

function checkAuthState() {
    // Check localStorage for admin session
    if (localStorage.getItem('adminSession') === 'true') {
        isAdminLoggedIn = true;
        showAdminDashboard();
    } else {
        showAdminLogin();
    }
}

function adminLogin() {
    const password = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    
    if (!password) {
        errorElement.textContent = 'Zəhmət olmasa, parol daxil edin';
        return;
    }
    
    if (password === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        localStorage.setItem('adminSession', 'true');
        errorElement.textContent = '';
        showAdminDashboard();
    } else {
        errorElement.textContent = 'Parol yanlışdır';
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    localStorage.removeItem('adminSession');
    showAdminLogin();
}

function showAdminLogin() {
    document.getElementById('admin-login').style.display = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('admin-login').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAdminQuestions();
}

// ================================
// Email Link Authentication (Passwordless Login)
// ================================

// Check if user arrived via email sign-in link
if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    // Store email in session storage if not present
    let email = sessionStorage.getItem('emailForSignIn');
    if (!email) {
        email = window.prompt('Daxil olmaq üçün emailinizi təsdiqləyin:');
    }
    
    if (email) {
        firebase.auth().signInWithEmailLink(email, window.location.href)
            .then((result) => {
                // Clear email from storage
                sessionStorage.removeItem('emailForSignIn');
                // Clear URL
                window.history.replaceState({}, document.title, window.location.pathname);
                console.log('Email link authentication successful!');
                showNotification('Uğurla daxil oldunuz!', 'success');
            })
            .catch((error) => {
                console.error('Email link sign-in error:', error);
                showNotification('Daxil olma xətası: ' + error.message, 'error');
            });
    }
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.style.display = 'block';
    resetLoginModal();
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.style.display = 'none';
    resetLoginModal();
}

function resetLoginModal() {
    document.getElementById('login-step-1').style.display = 'block';
    document.getElementById('login-step-2').style.display = 'none';
    document.getElementById('login-error').style.display = 'none';
    document.getElementById('login-loading').style.display = 'none';
    document.getElementById('user-email').value = '';
    document.getElementById('send-link-btn').disabled = false;
}

function sendLoginLink() {
    const email = document.getElementById('user-email').value.trim();
    const errorDiv = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const loadingDiv = document.getElementById('login-loading');
    const step1 = document.getElementById('login-step-1');
    const step2 = document.getElementById('login-step-2');
    const sendBtn = document.getElementById('send-link-btn');
    
    // Validate email
    if (!email) {
        errorDiv.style.display = 'block';
        errorText.textContent = 'Zəhmət olmasa, email ünvanı daxil edin';
        return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
        errorDiv.style.display = 'block';
        errorText.textContent = 'Düzgün email ünvanı daxil edin';
        return;
    }
    
    // Show loading
    errorDiv.style.display = 'none';
    loadingDiv.style.display = 'block';
    sendBtn.disabled = true;
    
    // Store email for sign-in link verification
    sessionStorage.setItem('emailForSignIn', email);
    
    // Configure action code settings
    const actionCodeSettings = {
        url: window.location.href,
        handleCodeInApp: true
    };
    
    // Send sign-in link to email
    firebase.auth().sendSignInLinkToEmail(email, actionCodeSettings)
        .then(() => {
            // Hide loading
            loadingDiv.style.display = 'none';
            
            // Show success step
            step1.style.display = 'none';
            step2.style.display = 'block';
            
            console.log('Sign-in link sent to:', email);
        })
        .catch((error) => {
            loadingDiv.style.display = 'none';
            sendBtn.disabled = false;
            
            console.error('Error sending sign-in link:', error);
            
            let errorMessage = 'Xəta baş verdi. Yenidən cəhd edin.';
            
            if (error.code === 'auth/invalid-email') {
                errorMessage = 'Düzgün email ünvanı daxil edin';
            } else if (error.code === 'auth/user-disabled') {
                errorMessage = 'Bu hesab deaktiv edilib';
            } else if (error.code === 'auth/operation-not-allowed') {
                errorMessage = 'Email link ilə daxil olma deaktiv edilib. Firebase Console-da aktiv edin.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMessage = 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın.';
            }
            
            errorDiv.style.display = 'block';
            errorText.textContent = errorMessage;
        });
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) {
        closeLoginModal();
    }
}

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.innerHTML = '<i class="fas fa-' + (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') + '"></i> ' + message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// ================================
// Admin Panel Functions
// ================================
function toggleAnswerFields() {
    const answerType = document.getElementById('admin-answer-type').value;
    
    document.getElementById('text-answer-group').style.display = 'none';
    document.getElementById('code-answer-group').style.display = 'none';
    document.getElementById('media-answer-group').style.display = 'none';
    document.getElementById('link-answer-group').style.display = 'none';
    
    switch (answerType) {
        case 'text':
            document.getElementById('text-answer-group').style.display = 'block';
            break;
        case 'code':
            document.getElementById('code-answer-group').style.display = 'block';
            break;
        case 'image':
        case 'video':
            document.getElementById('media-answer-group').style.display = 'block';
            break;
        case 'link':
            document.getElementById('link-answer-group').style.display = 'block';
            break;
    }
}

function saveQuestion() {
    const classNum = document.getElementById('admin-class').value;
    const moduleNum = document.getElementById('admin-module').value;
    const questionNum = document.getElementById('admin-question-num').value;
    const questionText = document.getElementById('admin-question-text').value;
    const answerType = document.getElementById('admin-answer-type').value;
    const answerText = document.getElementById('admin-answer-text').value;
    const answerCode = document.getElementById('admin-answer-code').value;
    const answerMedia = document.getElementById('admin-answer-media').value;
    const answerLink = document.getElementById('admin-answer-link').value;
    const adminNote = document.getElementById('admin-note').value;
    
    if (!classNum || !moduleNum || !questionNum) {
        alert('Zəhmət olmasa, sinif, modul və sual № daxil edin');
        return;
    }
    
    const questionData = {
        class: classNum,
        module: moduleNum,
        questionNum: parseInt(questionNum),
        questionText: questionText,
        answerType: answerType,
        answerText: answerType === 'text' ? answerText : null,
        answerCode: answerType === 'code' ? answerCode : null,
        answerMedia: (answerType === 'image' || answerType === 'video') ? answerMedia : null,
        answerLink: answerType === 'link' ? answerLink : null,
        adminNote: adminNote,
        updatedAt: new Date().toISOString()
    };
    
    // Save to Firebase
    const questionRef = firebase.database().ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionNum);
    
    questionRef.set(questionData)
        .then(() => {
            alert('Sual uğurla yadda saxlanıldı!');
            clearAdminForm();
            loadAdminQuestions();
        })
        .catch((error) => {
            console.error('Error saving question:', error);
            alert('Xəta baş verdi. Yenidən cəhd edin.');
        });
}

function clearAdminForm() {
    document.getElementById('admin-question-num').value = '';
    document.getElementById('admin-question-text').value = '';
    document.getElementById('admin-answer-type').value = 'text';
    document.getElementById('admin-answer-text').value = '';
    document.getElementById('admin-answer-code').value = '';
    document.getElementById('admin-answer-media').value = '';
    document.getElementById('admin-answer-link').value = '';
    document.getElementById('admin-note').value = '';
    toggleAnswerFields();
}

function loadAdminQuestions() {
    const filterClass = document.getElementById('admin-filter-class').value;
    const adminQuestionsList = document.getElementById('admin-questions-list');
    adminQuestionsList.innerHTML = '<p>Yüklənir...</p>';
    
    let queryRef;
    
    if (filterClass) {
        queryRef = firebase.database().ref('classes/' + filterClass);
    } else {
        queryRef = firebase.database().ref('classes');
    }
    
    queryRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            const questions = [];
            
            if (data) {
                Object.keys(data).forEach(classKey => {
                    const classData = data[classKey];
                    if (classData.modules) {
                        Object.keys(classData.modules).forEach(moduleKey => {
                            const moduleData = classData.modules[moduleKey];
                            if (moduleData.questions) {
                                Object.keys(moduleData.questions).forEach(qKey => {
                                    questions.push({
                                        id: qKey,
                                        class: classKey,
                                        module: moduleKey,
                                        ...moduleData.questions[qKey]
                                    });
                                });
                            }
                        });
                    }
                });
            }
            
            // Sort by class, module, question number
            questions.sort((a, b) => {
                if (a.class !== b.class) return a.class - b.class;
                if (a.module !== b.module) return a.module - b.module;
                return (a.questionNum || 0) - (b.questionNum || 0);
            });
            
            if (questions.length === 0) {
                adminQuestionsList.innerHTML = '<p>Hələ sual yoxdur</p>';
                return;
            }
            
            adminQuestionsList.innerHTML = questions.map(q => {
                const textPreview = q.questionText ? q.questionText.substring(0, 50) + '...' : 'Sual mətni yoxdur';
                return '<div class="admin-question-card">' +
                    '<div class="admin-question-info">' +
                        '<h4>' + q.class + '-ci sinif - Modul ' + q.module + ' - Sual №' + q.questionNum + '</h4>' +
                        '<p>' + textPreview + '</p>' +
                    '</div>' +
                    '<div class="admin-question-actions">' +
                        '<button onclick="editQuestion(\'' + q.class + '\', \'' + q.module + '\', \'' + q.id + '\')">' +
                            '<i class="fas fa-edit"></i>' +
                        '</button>' +
                        '<button class="delete-btn" onclick="deleteQuestion(\'' + q.class + '\', \'' + q.module + '\', \'' + q.id + '\')">' +
                            '<i class="fas fa-trash"></i>' +
                        '</button>' +
                    '</div>' +
                '</div>';
            }).join('');
        })
        .catch((error) => {
            console.error('Error loading admin questions:', error);
            adminQuestionsList.innerHTML = '<p>Xəta baş verdi</p>';
        });
}

function editQuestion(classNum, moduleNum, questionId) {
    const questionRef = firebase.database().ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionId);
    
    questionRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('admin-class').value = classNum;
                document.getElementById('admin-module').value = moduleNum;
                document.getElementById('admin-question-num').value = data.questionNum;
                document.getElementById('admin-question-text').value = data.questionText || '';
                document.getElementById('admin-answer-type').value = data.answerType || 'text';
                document.getElementById('admin-answer-text').value = data.answerText || '';
                document.getElementById('admin-answer-code').value = data.answerCode || '';
                document.getElementById('admin-answer-media').value = data.answerMedia || '';
                document.getElementById('admin-answer-link').value = data.answerLink || '';
                document.getElementById('admin-note').value = data.adminNote || '';
                
                toggleAnswerFields();
                
                // Scroll to form
                document.querySelector('.admin-form-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
}

function deleteQuestion(classNum, moduleNum, questionId) {
    if (!confirm('Bu sualı silmək istəyinizə əminsiniz?')) return;
    
    const questionRef = firebase.database().ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionId);
    
    questionRef.remove()
        .then(() => {
            alert('Sual uğurla silindi');
            loadAdminQuestions();
        })
        .catch((error) => {
            console.error('Error deleting question:', error);
            alert('Xəta baş verdi');
        });
}

// ================================
// Dark Mode Toggle
// ================================
function toggleDarkMode() {
    const body = document.body;
    const isDark = body.getAttribute('data-theme') !== 'light';
    
    if (isDark) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('darkMode', 'false');
    } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'true');
    }
}
