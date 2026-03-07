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
let votes = {};

// ================================
// Galaktik Alfabe
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
    galacticText.textContent = textToGalactic('close');
    setTimeout(() => {
        overlay.classList.add('hidden');
    }, 2500);
}

// ================================
// Initialize
// ================================
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'false') {
        document.body.setAttribute('data-theme', 'light');
    }
    setTimeout(playEntranceAnimation, 500);
    checkAuthState();
    loadVotes();
});

// ================================
// Vote System
// ================================
function loadVotes() {
    const saved = localStorage.getItem('votes');
    if (saved) votes = JSON.parse(saved);
}

function saveVotes() {
    localStorage.setItem('votes', JSON.stringify(votes));
}

function vote(questionId, voteType) {
    if (!votes[questionId]) {
        votes[questionId] = { tick: 0, x: 0, userVote: null };
    }
    const qVotes = votes[questionId];
    if (qVotes.userVote === voteType) {
        qVotes[voteType]--;
        qVotes.userVote = null;
    } else {
        if (qVotes.userVote) qVotes[qVotes.userVote]--;
        qVotes[voteType]++;
        qVotes.userVote = voteType;
    }
    saveVotes();
    updateVoteUI(questionId);
}

function updateVoteUI(questionId) {
    const qVotes = votes[questionId] || { tick: 0, x: 0, userVote: null };
    const tickBtn = document.querySelector(`[data-q="${questionId}"].tick`);
    const xBtn    = document.querySelector(`[data-q="${questionId}"].x-btn`);
    if (tickBtn) {
        tickBtn.querySelector('.vote-count').textContent = qVotes.tick;
        tickBtn.classList.toggle('active', qVotes.userVote === 'tick');
    }
    if (xBtn) {
        xBtn.querySelector('.vote-count').textContent = qVotes.x;
        xBtn.classList.toggle('active', qVotes.userVote === 'x');
    }
}

// ================================
// Secret Admin Access
// ================================
let clickCount = 0;
let clickTimer = null;

document.querySelector('.nav-logo').addEventListener('click', () => {
    clickCount++;
    if (clickCount === 3) {
        promptAdminPassword();
        clickCount = 0;
    }
    clearTimeout(clickTimer);
    clickTimer = setTimeout(() => { clickCount = 0; }, 500);
});

let keySequence = [];
document.addEventListener('keydown', (e) => {
    keySequence.push(e.key.toLowerCase());
    if (keySequence.length > 5) keySequence.shift();
    if (keySequence.join('').includes('ma')) {
        promptAdminPassword();
        keySequence = [];
    }
});

window.openAdminPanel = function() { promptAdminPassword(); };

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
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    const tabButton = document.querySelector('[data-tab="' + tabName + '"]');
    if (tabButton) tabButton.classList.add('active');

    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(tabName + '-section').classList.add('active');

    if (tabName !== 'home') hideAnswer();
}

// ================================
// Class and Module Selection
// ================================
function loadModules() {
    const classSelect        = document.getElementById('class-select');
    const moduleSelection    = document.getElementById('module-selection');
    const searchSection      = document.getElementById('search-section');
    const questionsContainer = document.getElementById('questions-container');

    currentClass = classSelect.value;

    if (currentClass) {
        moduleSelection.style.display    = 'block';
        searchSection.style.display      = 'none';
        questionsContainer.style.display = 'none';
        document.getElementById('module-select').value  = '';
        document.getElementById('search-input').value   = '';
        currentModule = '';
        loadQuestionsFromFirebase();
    } else {
        moduleSelection.style.display    = 'none';
        searchSection.style.display      = 'none';
        questionsContainer.style.display = 'none';
    }
}

function loadQuestions() {
    const moduleSelect       = document.getElementById('module-select');
    const searchSection      = document.getElementById('search-section');
    const questionsContainer = document.getElementById('questions-container');

    currentModule = moduleSelect.value;

    if (currentModule) {
        searchSection.style.display      = 'block';
        questionsContainer.style.display = 'block';
        document.getElementById('search-input').value = '';
        loadQuestionsFromFirebase();
    } else {
        searchSection.style.display      = 'none';
        questionsContainer.style.display = 'none';
    }
}

// ================================
// Firebase Data Operations
// ================================
function loadQuestionsFromFirebase() {
    const classSelect  = document.getElementById('class-select').value;
    const moduleSelect = document.getElementById('module-select').value;
    if (!classSelect || !moduleSelect) return;

    document.getElementById('questions-list').innerHTML = '<p class="loading">Yüklənir...</p>';

    const questionsRef = firebase.database().ref(
        'classes/' + classSelect + '/modules/' + moduleSelect + '/questions'
    );

    questionsRef.once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            allQuestions = [];
            if (data) {
                Object.keys(data).forEach(key => {
                    allQuestions.push({ id: key, ...data[key] });
                });
            }
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

    // Chip yenilə
    _adUpdateChip();

    if (questions.length === 0) {
        questionsList.innerHTML = '<p class="no-results">Bu modulda hələ sual yoxdur.</p>';
        return;
    }

    questionsList.innerHTML = questions.map(q => {
        const badge = q.answerType
            ? '<span class="question-badge">' + getAnswerTypeLabel(q.answerType) + '</span>'
            : '';
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
    const labels = { 'text': 'Mətn', 'code': 'Kod', 'image': 'Şəkil', 'video': 'Video', 'link': 'Link' };
    return labels[type] || type;
}

// ================================
// Search
// ================================
function searchQuestions() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase().trim();
    if (!searchTerm) {
        filteredQuestions = [...allQuestions];
    } else {
        filteredQuestions = allQuestions.filter(q => {
            const questionNum  = String(q.questionNum || '').toLowerCase();
            const questionText = (q.questionText || '').toLowerCase();
            return questionNum.includes(searchTerm) || questionText.includes(searchTerm);
        });
    }
    displayQuestions(filteredQuestions);
}

// ================================
// Answer Display — hideAnswer
// ================================
function hideAnswer() {
    const ac = document.getElementById('answer-container');
    const qc = document.getElementById('questions-container');
    if (ac) ac.style.display = 'none';
    if (qc) qc.style.display = 'block';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function copyCode(btn) {
    const code = btn.parentElement.querySelector('code').textContent;
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
    if (localStorage.getItem('adminSession') === 'true') {
        isAdminLoggedIn = true;
        showAdminDashboard();
    } else {
        showAdminLogin();
    }
}

function adminLogin() {
    const password     = document.getElementById('admin-password').value;
    const errorElement = document.getElementById('login-error');
    if (!password) { errorElement.textContent = 'Zəhmət olmasa, parol daxil edin'; return; }
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
    document.getElementById('admin-login').style.display     = 'block';
    document.getElementById('admin-dashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('admin-login').style.display     = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    loadAdminQuestions();
}

// ================================
// Email Link Auth
// ================================
if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
    let email = sessionStorage.getItem('emailForSignIn');
    if (!email) email = window.prompt('Daxil olmaq üçün emailinizi təsdiqləyin:');
    if (email) {
        firebase.auth().signInWithEmailLink(email, window.location.href)
            .then(() => {
                sessionStorage.removeItem('emailForSignIn');
                window.history.replaceState({}, document.title, window.location.pathname);
                showNotification('Uğurla daxil oldunuz!', 'success');
            })
            .catch((error) => {
                showNotification('Daxil olma xətası: ' + error.message, 'error');
            });
    }
}

function openLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    resetLoginModal();
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
    resetLoginModal();
}

function resetLoginModal() {
    document.getElementById('login-step-1').style.display  = 'block';
    document.getElementById('login-step-2').style.display  = 'none';
    document.getElementById('login-error').style.display   = 'none';
    document.getElementById('login-loading').style.display = 'none';
    document.getElementById('user-email').value            = '';
    document.getElementById('send-link-btn').disabled      = false;
}

function sendLoginLink() {
    const email     = document.getElementById('user-email').value.trim();
    const errorDiv  = document.getElementById('login-error');
    const errorText = document.getElementById('login-error-text');
    const loadingDiv = document.getElementById('login-loading');
    const step1     = document.getElementById('login-step-1');
    const step2     = document.getElementById('login-step-2');
    const sendBtn   = document.getElementById('send-link-btn');

    if (!email) {
        errorDiv.style.display = 'block';
        errorText.textContent  = 'Zəhmət olmasa, email ünvanı daxil edin';
        return;
    }
    if (!email.includes('@') || !email.includes('.')) {
        errorDiv.style.display = 'block';
        errorText.textContent  = 'Düzgün email ünvanı daxil edin';
        return;
    }

    errorDiv.style.display   = 'none';
    loadingDiv.style.display = 'block';
    sendBtn.disabled         = true;
    sessionStorage.setItem('emailForSignIn', email);

    firebase.auth().sendSignInLinkToEmail(email, {
        url: window.location.href,
        handleCodeInApp: true
    })
    .then(() => {
        loadingDiv.style.display = 'none';
        step1.style.display      = 'none';
        step2.style.display      = 'block';
    })
    .catch((error) => {
        loadingDiv.style.display = 'none';
        sendBtn.disabled         = false;
        let msg = 'Xəta baş verdi. Yenidən cəhd edin.';
        if (error.code === 'auth/invalid-email')          msg = 'Düzgün email ünvanı daxil edin';
        if (error.code === 'auth/network-request-failed') msg = 'Şəbəkə xətası. İnternet bağlantınızı yoxlayın.';
        errorDiv.style.display = 'block';
        errorText.textContent  = msg;
    });
}

window.onclick = function(event) {
    const modal = document.getElementById('login-modal');
    if (event.target === modal) closeLoginModal();
};

function showNotification(message, type = 'info') {
    const n = document.createElement('div');
    n.className = 'notification notification-' + type;
    n.innerHTML = '<i class="fas fa-' +
        (type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle') +
        '"></i> ' + message;
    document.body.appendChild(n);
    setTimeout(() => n.classList.add('show'), 100);
    setTimeout(() => { n.classList.remove('show'); setTimeout(() => n.remove(), 300); }, 5000);
}

// ================================
// Admin Panel Functions
// ================================
function toggleAnswerFields() {
    const answerType = document.getElementById('admin-answer-type').value;
    document.getElementById('text-answer-group').style.display  = 'none';
    document.getElementById('code-answer-group').style.display  = 'none';
    document.getElementById('media-answer-group').style.display = 'none';
    document.getElementById('link-answer-group').style.display  = 'none';
    switch (answerType) {
        case 'text':  document.getElementById('text-answer-group').style.display  = 'block'; break;
        case 'code':  document.getElementById('code-answer-group').style.display  = 'block'; break;
        case 'image':
        case 'video': document.getElementById('media-answer-group').style.display = 'block'; break;
        case 'link':  document.getElementById('link-answer-group').style.display  = 'block'; break;
    }
}

function saveQuestion() {
    const classNum    = document.getElementById('admin-class').value;
    const moduleNum   = document.getElementById('admin-module').value;
    const questionNum = document.getElementById('admin-question-num').value;
    const questionText = document.getElementById('admin-question-text').value;
    const answerType  = document.getElementById('admin-answer-type').value;
    const answerText  = document.getElementById('admin-answer-text').value;
    const answerCode  = document.getElementById('admin-answer-code').value;
    const answerMedia = document.getElementById('admin-answer-media').value;
    const answerLink  = document.getElementById('admin-answer-link').value;
    const adminNote   = document.getElementById('admin-note').value;

    if (!classNum || !moduleNum || !questionNum) {
        alert('Zəhmət olmasa, sinif, modul və sual № daxil edin');
        return;
    }

    const questionData = {
        class: classNum, module: moduleNum,
        questionNum: parseInt(questionNum),
        questionText, answerType,
        answerText:  answerType === 'text'  ? answerText  : null,
        answerCode:  answerType === 'code'  ? answerCode  : null,
        answerMedia: (answerType === 'image' || answerType === 'video') ? answerMedia : null,
        answerLink:  answerType === 'link'  ? answerLink  : null,
        adminNote,
        updatedAt: new Date().toISOString()
    };

    firebase.database()
        .ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionNum)
        .set(questionData)
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
    document.getElementById('admin-question-num').value  = '';
    document.getElementById('admin-question-text').value = '';
    document.getElementById('admin-answer-type').value   = 'text';
    document.getElementById('admin-answer-text').value   = '';
    document.getElementById('admin-answer-code').value   = '';
    document.getElementById('admin-answer-media').value  = '';
    document.getElementById('admin-answer-link').value   = '';
    document.getElementById('admin-note').value          = '';
    toggleAnswerFields();
}

function loadAdminQuestions() {
    const filterClass       = document.getElementById('admin-filter-class').value;
    const adminQuestionsList = document.getElementById('admin-questions-list');
    adminQuestionsList.innerHTML = '<p>Yüklənir...</p>';

    const queryRef = filterClass
        ? firebase.database().ref('classes/' + filterClass)
        : firebase.database().ref('classes');

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
                                    questions.push({ id: qKey, class: classKey, module: moduleKey, ...moduleData.questions[qKey] });
                                });
                            }
                        });
                    }
                });
            }
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
        .catch(() => { adminQuestionsList.innerHTML = '<p>Xəta baş verdi</p>'; });
}

function editQuestion(classNum, moduleNum, questionId) {
    firebase.database()
        .ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionId)
        .once('value')
        .then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                document.getElementById('admin-class').value        = classNum;
                document.getElementById('admin-module').value       = moduleNum;
                document.getElementById('admin-question-num').value = data.questionNum;
                document.getElementById('admin-question-text').value = data.questionText || '';
                document.getElementById('admin-answer-type').value  = data.answerType || 'text';
                document.getElementById('admin-answer-text').value  = data.answerText  || '';
                document.getElementById('admin-answer-code').value  = data.answerCode  || '';
                document.getElementById('admin-answer-media').value = data.answerMedia || '';
                document.getElementById('admin-answer-link').value  = data.answerLink  || '';
                document.getElementById('admin-note').value         = data.adminNote   || '';
                toggleAnswerFields();
                document.querySelector('.admin-form-section').scrollIntoView({ behavior: 'smooth' });
            }
        });
}

function deleteQuestion(classNum, moduleNum, questionId) {
    if (!confirm('Bu sualı silmək istəyinizə əminsiniz?')) return;
    firebase.database()
        .ref('classes/' + classNum + '/modules/' + moduleNum + '/questions/' + questionId)
        .remove()
        .then(() => { alert('Sual uğurla silindi'); loadAdminQuestions(); })
        .catch(() => alert('Xəta baş verdi'));
}

// ================================
// Dark Mode
// ================================
function toggleDarkMode() {
    const body  = document.body;
    const isDark = body.getAttribute('data-theme') !== 'light';
    if (isDark) {
        body.setAttribute('data-theme', 'light');
        localStorage.setItem('darkMode', 'false');
    } else {
        body.removeAttribute('data-theme');
        localStorage.setItem('darkMode', 'true');
    }
}

// ================================================================
//  REWARDED AD GATE — tam inteqrasiya
// ================================================================

const ADSENSE_CONFIG = {
    clientId:    'ca-pub-7588730976222194',
    slotId:      '1989024307',
    waitSeconds: 5,
    freePerDay:  3,
    storageKey:  'marsAdGate',
    bypassAdmin: true
};

// ---- Daily counter ----
function _adGetState() {
    try {
        const raw   = localStorage.getItem(ADSENSE_CONFIG.storageKey);
        const today = new Date().toISOString().split('T')[0];
        if (!raw) return { count: 0, date: today };
        const data = JSON.parse(raw);
        if (data.date !== today) return { count: 0, date: today };
        return data;
    } catch {
        return { count: 0, date: new Date().toISOString().split('T')[0] };
    }
}

function _adSaveState(s) {
    localStorage.setItem(ADSENSE_CONFIG.storageKey, JSON.stringify(s));
}

function _adNeedsGate() {
    if (ADSENSE_CONFIG.bypassAdmin && isAdminLoggedIn) return false;
    return _adGetState().count >= ADSENSE_CONFIG.freePerDay;
}

function _adIncrement() {
    const s = _adGetState();
    s.count++;
    _adSaveState(s);
}

function _adFreeLeft() {
    return Math.max(0, ADSENSE_CONFIG.freePerDay - _adGetState().count);
}

function _adUpdateChip() {
    const chip = document.getElementById('mars-free-chip');
    if (!chip) return;
    const left = _adFreeLeft();
    chip.style.display = 'flex';
    chip.innerHTML = left > 0
        ? `<i class="fas fa-gift"></i> Bu gün <strong>&nbsp;${left}&nbsp;</strong> pulsuz cavab qaldı`
        : `<i class="fas fa-lock"></i> Limit dolub — reklam izlə`;
    chip.className = 'mars-free-chip' + (left > 0 ? '' : ' empty');
}

// ---- showAnswer (köhnənin yerini alır) ----
function showAnswer(questionId) {
    if (_adNeedsGate()) {
        _showRewardedGate(questionId);
    } else {
        _adIncrement();
        _adUpdateChip();
        _renderAnswer(questionId);
    }
}

// ---- Rewarded modal ----
function _showRewardedGate(questionId) {
    const old = document.getElementById('mars-adgate');
    if (old) { clearInterval(old._tick); old.remove(); }

    const secs = ADSENSE_CONFIG.waitSeconds;
    const circumference = 157.08;

    const modal = document.createElement('div');
    modal.id = 'mars-adgate';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
        <div class="mag-backdrop"></div>
        <div class="mag-box">
            <div class="mag-header">
                <span class="mag-planet" aria-hidden="true">🪐</span>
                <div>
                    <h2 class="mag-title">Cavabı Açmaq üçün Reklam İzlə</h2>
                    <p class="mag-sub">Gündəlik pulsuz limitin dolub</p>
                </div>
            </div>
            <div class="mag-ad-wrap" id="mag-ad-wrap">
                <ins class="adsbygoogle mag-adunit"
                     style="display:block;width:100%;min-height:120px;"
                     data-ad-client="${ADSENSE_CONFIG.clientId}"
                     data-ad-slot="${ADSENSE_CONFIG.slotId}"
                     data-ad-format="rectangle"
                     data-full-width-responsive="false"></ins>
                <div class="mag-ad-placeholder" id="mag-ad-ph">
                    <span class="mag-ad-ph-icon">📺</span>
                    <p>Reklam yüklənir...</p>
                </div>
            </div>
            <div class="mag-timer-row">
                <div class="mag-ring-wrap">
                    <svg viewBox="0 0 60 60" width="64" height="64" aria-hidden="true">
                        <circle class="mag-ring-track" cx="30" cy="30" r="25"/>
                        <circle class="mag-ring-fill" cx="30" cy="30" r="25"
                            id="mag-ring-fill"
                            stroke-dasharray="${circumference}"
                            stroke-dashoffset="${circumference}"/>
                    </svg>
                    <span class="mag-secs" id="mag-secs" aria-live="polite">${secs}</span>
                </div>
                <div class="mag-timer-body">
                    <p class="mag-timer-label">Gözləyin</p>
                    <div class="mag-prog-bar" role="progressbar"
                         aria-valuemin="0" aria-valuemax="${secs}" aria-valuenow="0">
                        <div class="mag-prog-fill" id="mag-prog-fill"></div>
                    </div>
                    <p class="mag-timer-hint" id="mag-timer-hint">Reklam izlənir...</p>
                </div>
            </div>
            <button class="mag-cta" id="mag-cta" disabled onclick="_adUnlock('${questionId}')">
                <i class="fas fa-lock mag-cta-icon" id="mag-cta-icon"></i>
                <span id="mag-cta-label">Gözləyin (<span id="mag-cta-secs">${secs}</span>s)</span>
            </button>
            <div class="mag-footer">
                <span class="mag-renew-note">
                    <i class="fas fa-rotate-right"></i>
                    Sabah <strong>${ADSENSE_CONFIG.freePerDay}</strong> pulsuz hüquq yenilənəcək
                </span>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setTimeout(() => {
            const ins = modal.querySelector('.adsbygoogle');
            if (ins && ins.getAttribute('data-ad-status') === 'filled') {
                const ph = document.getElementById('mag-ad-ph');
                if (ph) ph.style.display = 'none';
            }
        }, 2500);
    } catch (e) {
        console.warn('[MarsAd] AdSense push error:', e);
    }

    requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('mag-open')));

    const ringEl   = document.getElementById('mag-ring-fill');
    const secsEl   = document.getElementById('mag-secs');
    const ctaEl    = document.getElementById('mag-cta');
    const ctaSecEl = document.getElementById('mag-cta-secs');
    const ctaLabel = document.getElementById('mag-cta-label');
    const ctaIcon  = document.getElementById('mag-cta-icon');
    const progEl   = document.getElementById('mag-prog-fill');
    const hintEl   = document.getElementById('mag-timer-hint');
    const progBar  = modal.querySelector('.mag-prog-bar');

    let remaining = secs;

    const tick = setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        const ratio = (secs - remaining) / secs;

        ringEl.style.strokeDashoffset = circumference * (1 - ratio);
        progEl.style.width = (ratio * 100) + '%';
        if (progBar) progBar.setAttribute('aria-valuenow', secs - remaining);

        secsEl.textContent   = remaining;
        ctaSecEl.textContent = remaining;

        if (remaining === 2) {
            hintEl.textContent   = 'Az qaldı...';
            hintEl.dataset.state = 'almost';
        }

        if (remaining <= 0) {
            clearInterval(tick);
            secsEl.textContent    = '✓';
            secsEl.dataset.done   = 'true';
            ctaEl.disabled        = false;
            ctaEl.classList.add('mag-cta-ready');
            ctaIcon.className     = 'fas fa-unlock mag-cta-icon';
            ctaLabel.innerHTML    = 'Cavabı Gör <i class="fas fa-arrow-right"></i>';
            hintEl.textContent    = 'Hazırdır!';
            hintEl.dataset.state  = 'done';
        }
    }, 1000);

    modal._tick = tick;
}

function _adUnlock(questionId) {
    const modal = document.getElementById('mars-adgate');
    if (!modal) return;
    clearInterval(modal._tick);
    modal.classList.remove('mag-open');
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 450);
    _renderAnswer(questionId);
}

// ---- _renderAnswer ----
function _renderAnswer(questionId) {
    const question = allQuestions.find(q => q.id === questionId);
    if (!question) return;

    const answerContainer    = document.getElementById('answer-container');
    const answerContent      = document.getElementById('answer-content');
    const questionsContainer = document.getElementById('questions-container');
    const qVotes = votes[questionId] || { tick: 0, x: 0, userVote: null };

    let html = `
        <div class="answer-header">
            <div class="answer-question"><strong>Sual №${question.questionNum}</strong></div>
            ${question.answerType ? `<span class="answer-type-badge">${getAnswerTypeLabel(question.answerType)}</span>` : ''}
        </div>
        <div class="answer-body">
    `;

    if (question.questionText) {
        html += `<p class="answer-text" style="margin-bottom:1.5rem;">${question.questionText}</p>`;
    }

    switch (question.answerType) {
        case 'text':
            html += `<p class="answer-text">${question.answerText || 'Cavab yoxdur'}</p>`;
            break;
        case 'code':
            html += `<div class="code-block">
                <button class="copy-btn" onclick="copyCode(this)">
                    <i class="fas fa-copy"></i> Kopya
                </button>
                <pre><code>${escapeHtml(question.answerCode || '')}</code></pre>
            </div>`;
            break;
        case 'image':
            html += `<img src="${question.answerMedia || ''}" alt="Cavab şəkili" class="answer-media">`;
            break;
        case 'video':
            html += `<video controls class="answer-video">
                <source src="${question.answerMedia || ''}" type="video/mp4">
                Video dəstəklənmir
            </video>`;
            break;
        case 'link':
            html += `<a href="${question.answerLink || '#'}" target="_blank" rel="noopener" class="answer-link">
                <i class="fas fa-external-link-alt"></i> ${question.answerLink || 'Link'}
            </a>`;
            break;
        default:
            html += `<p class="answer-text">Cavab hələ əlavə edilməyib</p>`;
    }

    html += `</div>`;

    if (question.adminNote) {
        html += `<div class="answer-note"><small>${escapeHtml(question.adminNote)}</small></div>`;
    }

    html += `<div class="vote-buttons">
        <button class="vote-btn tick" data-q="${questionId}" onclick="vote('${questionId}', 'tick')">
            <i class="fas fa-check"></i> <span class="vote-count">${qVotes.tick}</span> Tik
        </button>
        <button class="vote-btn x-btn" data-q="${questionId}" onclick="vote('${questionId}', 'x')">
            <i class="fas fa-times"></i> <span class="vote-count">${qVotes.x}</span> X
        </button>
    </div>`;

    answerContent.innerHTML          = html;
    questionsContainer.style.display = 'none';
    answerContainer.style.display    = 'block';
    updateVoteUI(questionId);
}
