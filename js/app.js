import { state, loadUserData, saveUserData, updateStat } from './state.js';
import { 
    showNotification, showAchievement, updateUserDisplay, updateStatsDisplay,
    updateFilePreview, clearFilePreview, showLoading, hideLoading
} from './ui.js';
import { generateNotes, clearFile } from './pdf-processor.js';
import { generateQuiz, showSampleQuiz } from './quiz-generator.js';
import { 
    generateFlashcards, processTextForFlashcards, displayFlashcard, 
    flipCard, nextCard, prevCard, markAsKnown, markAsUnknown, shuffleFlashcards
} from './flashcards.js';
import { initTheme } from './themes.js';
import { initChatbot } from './chatbot.js';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 StudyBuddy Pro initializing...');
    
    loadUserData();
    initEventListeners();
    updateUserDisplay();
    updateStatsDisplay();
    
    // Initialize theme switcher
    initTheme();
    
    // Initialize chatbot
    initChatbot();
    
    // Show welcome modal if no user
    const welcomeModal = document.getElementById('welcomeModal');
    if (!state.user.name && welcomeModal) {
        welcomeModal.style.display = 'flex';
    } else {
        if (welcomeModal) welcomeModal.style.display = 'none';
        showAchievement('✨ Welcome back!', `Ready to study, ${state.user.name || 'Learner'}?`);
    }
    
    // Daily quote
    const quotes = [
        '"The expert in anything was once a beginner."',
        '"Study hard, but study smart."',
        '"Knowledge is power."',
        '"Every master was once a disaster."',
        '"Your only limit is your mind."'
    ];
    const quoteEl = document.getElementById('dailyQuote');
    if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    
    console.log('✅ StudyBuddy Pro ready!');
});

// ===== EVENT LISTENERS =====
function initEventListeners() {
    // Welcome modal
    document.getElementById('startJourneyBtn')?.addEventListener('click', handleStartJourney);
    
    // Goal selection
    document.querySelectorAll('.goal-option').forEach(goal => {
        goal.addEventListener('click', function() {
            document.querySelectorAll('.goal-option').forEach(g => g.classList.remove('selected'));
            this.classList.add('selected');
            state.user.goal = this.dataset.goal;
        });
    });
    
    // File uploads
    document.getElementById('notesUpload')?.addEventListener('change', (e) => handleFileUpload(e, 'notes'));
    document.getElementById('clearNotesFile')?.addEventListener('click', () => {
        clearFile('notes');
        clearFilePreview('notes');
    });
    
    document.getElementById('quizUpload')?.addEventListener('change', (e) => handleFileUpload(e, 'quiz'));
    document.getElementById('clearQuizFile')?.addEventListener('click', () => {
        clearFile('quiz');
        clearFilePreview('quiz');
    });
    
    document.getElementById('flashcardUpload')?.addEventListener('change', (e) => handleFileUpload(e, 'flashcards'));
    
    // Generation buttons
    document.getElementById('generateNotesBtn')?.addEventListener('click', generateNotes);
    document.getElementById('sampleNotesBtn')?.addEventListener('click', showSampleNotes);
    document.getElementById('generateQuizBtn')?.addEventListener('click', generateQuiz);
    document.getElementById('sampleQuizBtn')?.addEventListener('click', showSampleQuiz);
    document.getElementById('generateFlashcardsBtn')?.addEventListener('click', generateFlashcards);
    
    // Note type selection
    document.querySelectorAll('#notes .option-card').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('#notes .option-card').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Quiz type selection
    document.querySelectorAll('#quiz .option-card').forEach(opt => {
        opt.addEventListener('click', function() {
            document.querySelectorAll('#quiz .option-card').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
    
    // Flashcards manual input
    document.getElementById('textInputBtn')?.addEventListener('click', () => {
        document.getElementById('textInputModal').style.display = 'flex';
    });
    document.getElementById('processTextBtn')?.addEventListener('click', processTextForFlashcards);
    document.getElementById('cancelTextBtn')?.addEventListener('click', () => {
        document.getElementById('textInputModal').style.display = 'none';
    });
    document.getElementById('closeTextModal')?.addEventListener('click', () => {
        document.getElementById('textInputModal').style.display = 'none';
    });
    
    // Voice input (placeholder)
    document.getElementById('voiceInputBtn')?.addEventListener('click', () => {
        document.getElementById('voiceInputModal').style.display = 'flex';
    });
    document.getElementById('cancelVoiceBtn')?.addEventListener('click', () => {
        document.getElementById('voiceInputModal').style.display = 'none';
    });
    document.getElementById('closeVoiceModal')?.addEventListener('click', () => {
        document.getElementById('voiceInputModal').style.display = 'none';
    });
    
    // Flashcard interactions
    document.getElementById('flashcard')?.addEventListener('click', flipCard);
    document.getElementById('prevCardBtn')?.addEventListener('click', prevCard);
    document.getElementById('nextCardBtn')?.addEventListener('click', nextCard);
    document.getElementById('knowBtn')?.addEventListener('click', markAsKnown);
    document.getElementById('dontKnowBtn')?.addEventListener('click', markAsUnknown);
    document.getElementById('shuffleBtn')?.addEventListener('click', shuffleFlashcards);
    
    // Focus mode
    document.getElementById('focusModeBtn')?.addEventListener('click', () => {
        document.getElementById('focusMode').style.display = 'flex';
    });
    document.getElementById('exitFocusBtn')?.addEventListener('click', () => {
        document.getElementById('focusMode').style.display = 'none';
    });
    document.getElementById('startTimerBtn')?.addEventListener('click', startFocusTimer);
    
    // Download notes
    document.getElementById('downloadNotesBtn')?.addEventListener('click', downloadNotes);
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        const textModal = document.getElementById('textInputModal');
        const voiceModal = document.getElementById('voiceInputModal');
        const focusMode = document.getElementById('focusMode');
        const welcomeModal = document.getElementById('welcomeModal');
        
        if (e.target === textModal) textModal.style.display = 'none';
        if (e.target === voiceModal) voiceModal.style.display = 'none';
        if (e.target === focusMode) focusMode.style.display = 'none';
        if (e.target === welcomeModal) welcomeModal.style.display = 'none';
    });
}

// ===== HANDLERS =====
function handleStartJourney() {
    const name = document.getElementById('userName')?.value.trim();
    if (!name) {
        showNotification('Please enter your name', 'warning');
        return;
    }
    
    if (!state.user.goal) {
        showNotification('Please select a study goal', 'warning');
        return;
    }
    
    const level = document.getElementById('studyLevel')?.value;
    if (!level) {
        showNotification('Please select your study level', 'warning');
        return;
    }
    
    state.user.name = name;
    state.user.avatar = name.substring(0, 2).toUpperCase();
    state.user.level = level;
    state.user.streak = 1;
    
    saveUserData();
    updateUserDisplay();
    
    document.getElementById('welcomeModal').style.display = 'none';
    showAchievement('🎉 Welcome!', `Let's start learning, ${name}!`);
}

function handleFileUpload(event, type) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 50 * 1024 * 1024) {
        showNotification('File size must be less than 50MB', 'error');
        return;
    }
    
    state.currentFiles[type] = file;
    updateFilePreview(file, type);
    
    if (type === 'notes') {
        document.getElementById('generateNotesBtn').disabled = false;
    } else if (type === 'quiz') {
        document.getElementById('generateQuizBtn').disabled = false;
    }
    
    showNotification(`✅ ${file.name} uploaded`, 'success');
}

function showSampleNotes() {
    const sampleText = `Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. Deep learning uses neural networks with multiple layers to progressively extract higher-level features from raw input. Natural Language Processing allows computers to understand, interpret, and manipulate human language.`;
    
    const selected = document.querySelector('#notes .option-card.selected');
    const noteType = selected?.dataset.type || 'detailed';
    
    import('./pdf-processor.js').then(module => {
        const notes = module.generateNotesFromText(sampleText, noteType);
        document.getElementById('notesContent').innerHTML = notes;
        document.getElementById('notesResults').style.display = 'block';
    });
    
    showNotification('📚 Sample notes loaded', 'info');
}

function startFocusTimer() {
    let minutes = 25;
    let seconds = 0;
    const timerDisplay = document.getElementById('focusTimer');
    const startBtn = document.getElementById('startTimerBtn');
    
    if (!timerDisplay || !startBtn) return;
    
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Studying...';
    
    const timer = setInterval(() => {
        if (seconds === 0) {
            if (minutes === 0) {
                clearInterval(timer);
                startBtn.disabled = false;
                startBtn.innerHTML = '<i class="fas fa-play"></i> Start Session';
                timerDisplay.textContent = '25:00';
                
                showAchievement('⏱️ Focus Session Complete!', 'Great job! +25 XP');
                updateStat('studyTime', 0.42);
                updateStatsDisplay();
                return;
            }
            minutes--;
            seconds = 59;
        } else {
            seconds--;
        }
        
        timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
    
    window.focusTimerInterval = timer;
}

function downloadNotes() {
    const content = document.getElementById('notesContent')?.innerText;
    if (!content) {
        showNotification('No notes to download', 'warning');
        return;
    }
    
    const blob = new Blob([content], { type: 'text/plain' });
    if (window.saveAs) {
        window.saveAs(blob, `StudyBuddy-Notes-${new Date().toISOString().slice(0,10)}.txt`);
        showNotification('📥 Notes downloaded', 'success');
    }
}

// Auto-save every 30 seconds
setInterval(() => {
    if (state.user.name) saveUserData();
}, 30000);
