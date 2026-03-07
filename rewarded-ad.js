// ================================================================
//  MARS ALGORİTMİKA — Rewarded Ad Gate
//
//  ENTEGRASYON:
//  1. app.js içindəki köhnə showAnswer() funksiyasını TAM SİL
//  2. Bu faylın bütün məzmununu app.js-in SONUNA yapıştır
//  3. styles.css-in sonuna rewarded-ad.css məzmununu yapıştır
// ================================================================

// ----------------------------------------------------------------
//  CONFIG
// ----------------------------------------------------------------
const ADSENSE_CONFIG = {
    clientId:    'ca-pub-7588730976222194',
    slotId:      '1989024307',
    waitSeconds: 5,
    freePerDay:  3,
    storageKey:  'marsAdGate',
    bypassAdmin: true
};

// ----------------------------------------------------------------
//  DAILY FREE COUNTER
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
//  CHIP YENİLƏ — sual siyahısı üstündəki sayaç
// ----------------------------------------------------------------
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

// ----------------------------------------------------------------
//  showAnswer — KÖHNƏSİNİN YERİNƏ
// ----------------------------------------------------------------
function showAnswer(questionId) {
    if (_adNeedsGate()) {
        _showRewardedGate(questionId);
    } else {
        _adIncrement();
        _adUpdateChip();
        _renderAnswer(questionId);
    }
}

// ----------------------------------------------------------------
//  REWARDED GATE MODAL
// ----------------------------------------------------------------
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

            <!-- AdSense reklam yuvası -->
            <div class="mag-ad-wrap" id="mag-ad-wrap">
                <ins class="adsbygoogle mag-adunit"
                     style="display:block;width:100%;min-height:120px;"
                     data-ad-client="${ADSENSE_CONFIG.clientId}"
                     data-ad-slot="${ADSENSE_CONFIG.slotId}"
                     data-ad-format="rectangle"
                     data-full-width-responsive="false">
                </ins>
                <div class="mag-ad-placeholder" id="mag-ad-ph">
                    <span class="mag-ad-ph-icon">📺</span>
                    <p>Reklam yüklənir...</p>
                </div>
            </div>

            <!-- Sayaç -->
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

            <!-- Düymə -->
            <button class="mag-cta" id="mag-cta" disabled
                    onclick="_adUnlock('${questionId}')">
                <i class="fas fa-lock mag-cta-icon" id="mag-cta-icon"></i>
                <span id="mag-cta-label">Gözləyin
                    (<span id="mag-cta-secs">${secs}</span>s)
                </span>
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

    // AdSense push
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

    // ---- Countdown ----
    const ringEl    = document.getElementById('mag-ring-fill');
    const secsEl    = document.getElementById('mag-secs');
    const ctaEl     = document.getElementById('mag-cta');
    const ctaSecEl  = document.getElementById('mag-cta-secs');
    const ctaLabel  = document.getElementById('mag-cta-label');
    const ctaIcon   = document.getElementById('mag-cta-icon');
    const progEl    = document.getElementById('mag-prog-fill');
    const hintEl    = document.getElementById('mag-timer-hint');
    const progBar   = modal.querySelector('.mag-prog-bar');

    let remaining = secs;

    const tick = setInterval(() => {
        remaining = Math.max(0, remaining - 1);
        const ratio = (secs - remaining) / secs;

        ringEl.style.strokeDashoffset = circumference * (1 - ratio);
        progEl.style.width = (ratio * 100) + '%';
        if (progBar) progBar.setAttribute('aria-valuenow', secs - remaining);

        secsEl.textContent  = remaining;
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

// ----------------------------------------------------------------
//  UNLOCK
// ----------------------------------------------------------------
function _adUnlock(questionId) {
    const modal = document.getElementById('mars-adgate');
    if (!modal) return;
    clearInterval(modal._tick);
    modal.classList.remove('mag-open');
    setTimeout(() => { if (modal.parentNode) modal.remove(); }, 450);
    _renderAnswer(questionId);
}

// ----------------------------------------------------------------
//  _renderAnswer
// ----------------------------------------------------------------
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
            ${question.answerType
                ? `<span class="answer-type-badge">${getAnswerTypeLabel(question.answerType)}</span>`
                : ''}
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
            <i class="fas fa-check"></i>
            <span class="vote-count">${qVotes.tick}</span> Tik
        </button>
        <button class="vote-btn x-btn" data-q="${questionId}" onclick="vote('${questionId}', 'x')">
            <i class="fas fa-times"></i>
            <span class="vote-count">${qVotes.x}</span> X
        </button>
    </div>`;

    answerContent.innerHTML          = html;
    questionsContainer.style.display = 'none';
    answerContainer.style.display    = 'block';
    updateVoteUI(questionId);
}
