import { state, updateStat } from './state.js';
import { showNotification, showLoading, hideLoading, showAchievement } from './ui.js';
import { extractTextFromPDF } from './pdf-processor.js';

// ===== GENERATE FLASHCARDS =====
export async function generateFlashcards() {
    if (!state.currentFiles.flashcards) {
        // No file uploaded – open text input modal
        document.getElementById('textInputModal').style.display = 'flex';
        return;
    }
    
    showLoading('Creating flashcards...');
    
    try {
        let text = '';
        if (state.currentFiles.flashcards.type.includes('pdf')) {
            text = await extractTextFromPDF(state.currentFiles.flashcards);
        } else {
            text = await state.currentFiles.flashcards.text();
        }
        
        createFlashcardsFromText(text);
        
        hideLoading();
        displayFlashcard(0);
        document.getElementById('flashcardsResults').style.display = 'block';
        
        const leveledUp = updateStat('flashcards', state.flashcards.length);
        showNotification(`✅ ${state.flashcards.length} flashcards created!`, 'success');
        if (leveledUp) showAchievement('🎯 Level Up!', `You reached level ${state.user.levelNumber}!`);
        
    } catch (error) {
        hideLoading();
        showNotification('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

export function processTextForFlashcards() {
    const textarea = document.getElementById('flashcardTextInput');
    const text = textarea?.value.trim();
    
    if (!text) {
        showNotification('Please enter some text', 'warning');
        return;
    }
    
    createFlashcardsFromText(text);
    document.getElementById('textInputModal').style.display = 'none';
    textarea.value = '';
    document.getElementById('flashcardsResults').style.display = 'block';
    
    const leveledUp = updateStat('flashcards', state.flashcards.length);
    showNotification(`✅ ${state.flashcards.length} flashcards created!`, 'success');
    if (leveledUp) showAchievement('🎯 Level Up!', `You reached level ${state.user.levelNumber}!`);
}

function createFlashcardsFromText(text) {
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20 && s.length < 200)
        .slice(0, 20);
    
    state.flashcards = sentences.map(sentence => {
        const words = sentence.split(' ');
        const firstFew = words.slice(0, 3).join(' ');
        const keyWord = words.find(w => w.length > 5) || words[0] || 'Concept';
        
        return {
            front: `What is ${keyWord}?` || `Explain: ${firstFew}...`,
            back: sentence,
            mastered: false,
            category: 'auto'
        };
    });
    
    state.currentCardIndex = 0;
    updateRetentionRate();
}

// ===== FLASHCARD INTERACTION =====
export function displayFlashcard(index = state.currentCardIndex) {
    if (!state.flashcards.length) return;
    
    const card = state.flashcards[index];
    const flashcard = document.getElementById('flashcard');
    const front = flashcard?.querySelector('.flashcard-front h3');
    const backTitle = flashcard?.querySelector('.flashcard-back h3');
    const backText = flashcard?.querySelector('.flashcard-back p');
    const counter = document.getElementById('cardCounter');
    const prevBtn = document.getElementById('prevCardBtn');
    const nextBtn = document.getElementById('nextCardBtn');
    
    if (front) front.textContent = card.front;
    if (backTitle) backTitle.textContent = 'Answer';
    if (backText) backText.textContent = card.back;
    if (counter) counter.textContent = `${index + 1}/${state.flashcards.length}`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === state.flashcards.length - 1;
    
    // Remove flip state
    if (flashcard) flashcard.classList.remove('flipped');
    
    updateRetentionRate();
}

export function flipCard() {
    const flashcard = document.getElementById('flashcard');
    if (flashcard) flashcard.classList.toggle('flipped');
}

export function nextCard() {
    if (state.currentCardIndex < state.flashcards.length - 1) {
        state.currentCardIndex++;
        displayFlashcard();
    }
}

export function prevCard() {
    if (state.currentCardIndex > 0) {
        state.currentCardIndex--;
        displayFlashcard();
    }
}

export function markAsKnown() {
    if (!state.flashcards.length) return;
    state.flashcards[state.currentCardIndex].mastered = true;
    updateRetentionRate();
    
    // Auto-advance
    setTimeout(() => {
        if (state.currentCardIndex < state.flashcards.length - 1) {
            nextCard();
        }
    }, 400);
    
    // Check all mastered
    if (state.flashcards.every(c => c.mastered)) {
        showAchievement('🏆 Flashcard Master', 'You mastered all flashcards!');
    }
}

export function markAsUnknown() {
    if (!state.flashcards.length) return;
    state.flashcards[state.currentCardIndex].mastered = false;
    updateRetentionRate();
}

export function shuffleFlashcards() {
    for (let i = state.flashcards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.flashcards[i], state.flashcards[j]] = [state.flashcards[j], state.flashcards[i]];
    }
    state.currentCardIndex = 0;
    displayFlashcard();
    showNotification('🔀 Flashcards shuffled', 'info');
}

function updateRetentionRate() {
    const mastered = state.flashcards.filter(c => c.mastered).length;
    const rate = state.flashcards.length ? Math.round((mastered / state.flashcards.length) * 100) : 0;
    const retentionEl = document.getElementById('retentionRate');
    if (retentionEl) retentionEl.textContent = rate + '%';
}
