import { state } from './state.js';

// DOM element cache
const elements = {
    welcomeModal: document.getElementById('welcomeModal'),
    userAvatar: document.getElementById('userAvatar'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    dynamicUserName: document.getElementById('dynamicUserName'),
    notesCount: document.getElementById('notesCount'),
    quizCount: document.getElementById('quizCount'),
    flashcardsCount: document.getElementById('flashcardsCount'),
    totalStudyTime: document.getElementById('totalStudyTime'),
    userLevel: document.getElementById('userLevel'),
    studyTime: document.getElementById('studyTime'),
    tasksDone: document.getElementById('tasksDone'),
    streakDays: document.getElementById('streakDays'),
    xpEarned: document.getElementById('xpEarned'),
    userXP: document.getElementById('userXP'),
    streakMain: document.getElementById('streakMain'),
    achievementContainer: document.getElementById('achievementContainer')
};

// ===== NOTIFICATIONS =====
export function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'achievement-badge';
    notification.style.background = type === 'success' ? 'var(--secondary)' :
                                   type === 'error' ? 'var(--danger)' :
                                   type === 'warning' ? 'var(--accent)' : 'var(--primary)';
    
    const icon = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    }[type] || 'info-circle';
    
    notification.innerHTML = `
        <i class="fas fa-${icon}"></i>
        <div>
            <strong>${message}</strong>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// ===== ACHIEVEMENTS =====
export function showAchievement(title, description) {
    if (!elements.achievementContainer) return;
    
    const achievement = document.createElement('div');
    achievement.className = 'achievement-badge';
    achievement.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div>
            <strong>${title}</strong>
            <div style="font-size: 0.85rem; opacity: 0.9;">${description}</div>
        </div>
    `;
    
    elements.achievementContainer.prepend(achievement);
    
    setTimeout(() => {
        achievement.style.opacity = '0';
        achievement.style.transform = 'translateX(100%)';
        setTimeout(() => achievement.remove(), 300);
    }, 5000);
}

// ===== LOADING STATES =====
export function showLoading(message = 'Processing...', showProgress = false) {
    const loading = document.getElementById('globalLoading');
    if (loading) loading.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'globalLoading';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(3, 3, 10, 0.9);
        backdrop-filter: blur(8px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 4000;
    `;
    
    overlay.innerHTML = `
        <div style="width: 60px; height: 60px; border: 4px solid var(--surface-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <h3 style="margin-top: 30px; color: var(--text-light);">${message}</h3>
        ${showProgress ? `
            <div style="width: 300px; margin-top: 30px; background: var(--surface); height: 6px; border-radius: 3px;">
                <div id="loadingProgress" style="width: 0%; height: 100%; background: var(--gradient-primary); border-radius: 3px; transition: width 0.2s;"></div>
            </div>
        ` : ''}
    `;
    
    document.body.appendChild(overlay);
}

export function updateProgress(percent) {
    const progress = document.getElementById('loadingProgress');
    if (progress) progress.style.width = percent + '%';
}

export function hideLoading() {
    const loading = document.getElementById('globalLoading');
    if (loading) {
        loading.style.opacity = '0';
        loading.style.transition = 'opacity 0.3s';
        setTimeout(() => loading.remove(), 300);
    }
}

// ===== USER DISPLAY =====
export function updateUserDisplay() {
    if (elements.userAvatar) elements.userAvatar.textContent = state.user.avatar || 'JD';
    if (elements.userNameDisplay) elements.userNameDisplay.textContent = state.user.name || 'Learner';
    if (elements.dynamicUserName) elements.dynamicUserName.textContent = state.user.name || 'Learner';
    if (elements.userLevel) elements.userLevel.textContent = state.user.levelNumber;
    if (elements.streakDays) elements.streakDays.textContent = state.user.streak;
    if (elements.xpEarned) elements.xpEarned.textContent = state.user.xp;
    if (elements.userXP) elements.userXP.textContent = state.user.xp;
    if (elements.streakMain) elements.streakMain.textContent = state.user.streak;
}

export function updateStatsDisplay() {
    if (elements.notesCount) elements.notesCount.textContent = state.stats.notesCreated;
    if (elements.quizCount) elements.quizCount.textContent = state.stats.quizzesTaken;
    if (elements.flashcardsCount) elements.flashcardsCount.textContent = state.stats.flashcardsReviewed;
    if (elements.totalStudyTime) elements.totalStudyTime.textContent = state.stats.studyTime + 'h';
    
    // Sidebar stats
    if (elements.studyTime) elements.studyTime.textContent = Math.floor(state.stats.studyTime * 60) + 'm';
    if (elements.tasksDone) elements.tasksDone.textContent = state.stats.notesCreated + state.stats.quizzesTaken;
}

// ===== FILE PREVIEW =====
export function updateFilePreview(file, type) {
    const fileSize = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    
    if (type === 'notes') {
        const fileNameEl = document.getElementById('notesFileName');
        const fileSizeEl = document.getElementById('notesFileSize');
        const previewEl = document.getElementById('notesFilePreview');
        const emptyState = document.getElementById('notesEmptyState');
        
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = fileSize;
        if (previewEl) {
            previewEl.style.display = 'flex';
            previewEl.classList.add('active');
        }
        if (emptyState) emptyState.style.display = 'none';
    } else if (type === 'quiz') {
        const fileNameEl = document.getElementById('quizFileName');
        const fileSizeEl = document.getElementById('quizFileSize');
        const previewEl = document.getElementById('quizFilePreview');
        const emptyState = document.getElementById('quizEmptyState');
        
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = fileSize;
        if (previewEl) {
            previewEl.style.display = 'flex';
            previewEl.classList.add('active');
        }
        if (emptyState) emptyState.style.display = 'none';
    }
}

export function clearFilePreview(type) {
    if (type === 'notes') {
        const preview = document.getElementById('notesFilePreview');
        const emptyState = document.getElementById('notesEmptyState');
        const input = document.getElementById('notesUpload');
        const btn = document.getElementById('generateNotesBtn');
        if (preview) {
            preview.style.display = 'none';
            preview.classList.remove('active');
        }
        if (emptyState) emptyState.style.display = 'flex';
        if (input) input.value = '';
        if (btn) btn.disabled = true;
    } else if (type === 'quiz') {
        const preview = document.getElementById('quizFilePreview');
        const emptyState = document.getElementById('quizEmptyState');
        const input = document.getElementById('quizUpload');
        const btn = document.getElementById('generateQuizBtn');
        if (preview) {
            preview.style.display = 'none';
            preview.classList.remove('active');
        }
        if (emptyState) emptyState.style.display = 'flex';
        if (input) input.value = '';
        if (btn) btn.disabled = true;
    }
}

// Add keyframe animation for spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);