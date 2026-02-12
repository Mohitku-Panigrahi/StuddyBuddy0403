// ===== GLOBAL STATE =====

export const state = {
    user: {
        name: '',
        avatar: 'JD',
        goal: 'learn',
        level: 'undergrad',
        levelNumber: 1,
        xp: 0,
        streak: 0
    },
    stats: {
        notesCreated: 0,
        quizzesTaken: 0,
        flashcardsReviewed: 0,
        studyTime: 0,
        focusScore: 85,
        quizScores: []
    },
    currentFiles: {
        notes: null,
        quiz: null,
        flashcards: null
    },
    flashcards: [],
    currentCardIndex: 0,
    achievements: []
};

// ===== STATE UPDATE FUNCTIONS =====

export function updateStat(type, value = 1) {
    let leveledUp = false;
    
    switch(type) {
        case 'notes':
            state.stats.notesCreated += value;
            state.user.xp += 50 * value;
            break;
        case 'quiz':
            state.stats.quizzesTaken += value;
            state.user.xp += 75 * value;
            break;
        case 'flashcards':
            state.stats.flashcardsReviewed += value;
            state.user.xp += 25 * value;
            break;
        case 'studyTime':
            state.stats.studyTime += value;
            state.user.xp += Math.floor(value * 10);
            break;
        case 'quizScore':
            state.stats.quizScores.push(value);
            state.stats.focusScore = Math.min(100, state.stats.focusScore + 2);
            break;
    }
    
    // Level up every 100 XP
    if (state.user.xp >= state.user.levelNumber * 100) {
        state.user.levelNumber++;
        leveledUp = true;
    }
    
    saveUserData();
    return leveledUp;
}

export function saveUserData() {
    localStorage.setItem('studybuddy_user', JSON.stringify(state.user));
    localStorage.setItem('studybuddy_stats', JSON.stringify(state.stats));
    localStorage.setItem('studybuddy_achievements', JSON.stringify(state.achievements));
}

export function loadUserData() {
    const savedUser = localStorage.getItem('studybuddy_user');
    const savedStats = localStorage.getItem('studybuddy_stats');
    const savedAchievements = localStorage.getItem('studybuddy_achievements');
    
    if (savedUser) Object.assign(state.user, JSON.parse(savedUser));
    if (savedStats) Object.assign(state.stats, JSON.parse(savedStats));
    if (savedAchievements) state.achievements = JSON.parse(savedAchievements);
}

export function resetState() {
    state.user = { name: '', avatar: 'JD', goal: 'learn', level: 'undergrad', levelNumber: 1, xp: 0, streak: 0 };
    state.stats = { notesCreated: 0, quizzesTaken: 0, flashcardsReviewed: 0, studyTime: 0, focusScore: 85, quizScores: [] };
    state.currentFiles = { notes: null, quiz: null, flashcards: null };
    state.flashcards = [];
    state.currentCardIndex = 0;
    state.achievements = [];
    localStorage.clear();
}