import { state, updateStat } from './state.js';
import { showNotification, showLoading, hideLoading, showAchievement } from './ui.js';
import { extractTextFromPDF } from './pdf-processor.js';

export async function generateQuiz() {
    if (!state.currentFiles.quiz) {
        showNotification('Please upload a file first', 'warning');
        return;
    }
    
    showLoading('Generating quiz questions...');
    
    try {
        let text = '';
        if (state.currentFiles.quiz.type.includes('pdf')) {
            text = await extractTextFromPDF(state.currentFiles.quiz);
        } else {
            text = await state.currentFiles.quiz.text();
        }
        
        const selectedOption = document.querySelector('#quiz .option-card.selected');
        const quizType = selectedOption?.dataset.type || 'mcq';
        
        const quizHTML = generateQuizFromText(text, quizType);
        
        const quizContent = document.getElementById('quizContent');
        const quizResults = document.getElementById('quizResults');
        
        if (quizContent) quizContent.innerHTML = quizHTML;
        if (quizResults) {
            quizResults.style.display = 'block';
            quizResults.scrollIntoView({ behavior: 'smooth' });
        }
        
        hideLoading();
        initQuizInteraction();
        
        const leveledUp = updateStat('quiz', 1);
        showNotification('✅ Quiz generated!', 'success');
        if (leveledUp) showAchievement('🎯 Level Up!', `You reached level ${state.user.levelNumber}!`);
        
    } catch (error) {
        hideLoading();
        showNotification('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

function generateQuizFromText(text, type) {
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 30 && s.length < 200);
    
    const keywords = extractKeywords(text).slice(0, 10);
    
    let questions = [];
    
    switch(type) {
        case 'mcq':
            questions = generateMCQ(sentences, keywords, 5);
            break;
        case 'truefalse':
            questions = generateTrueFalse(sentences, 5);
            break;
        case 'short':
            questions = generateShortAnswer(keywords, 5);
            break;
        case 'mixed':
            questions = [
                ...generateMCQ(sentences, keywords, 2),
                ...generateTrueFalse(sentences, 2),
                ...generateShortAnswer(keywords, 1)
            ];
            break;
    }
    
    return buildQuizHTML(questions);
}

function generateMCQ(sentences, keywords, count) {
    const questions = [];
    const shuffled = [...sentences].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        const sentence = shuffled[i];
        const words = sentence.split(' ').filter(w => w.length > 5);
        if (words.length === 0) continue;
        
        const keyword = words[Math.floor(Math.random() * words.length)];
        const questionText = sentence.replace(keyword, '__________');
        
        const options = [keyword];
        while (options.length < 4) {
            const randomWord = keywords[Math.floor(Math.random() * keywords.length)] || 'Concept';
            if (!options.includes(randomWord)) options.push(randomWord);
        }
        // Shuffle options
        for (let j = options.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [options[j], options[k]] = [options[k], options[j]];
        }
        
        const correctIndex = options.indexOf(keyword);
        
        questions.push({
            type: 'mcq',
            text: questionText,
            options,
            correct: correctIndex,
            explanation: `The correct answer is "${keyword}".`
        });
    }
    return questions;
}

function generateTrueFalse(sentences, count) {
    const questions = [];
    const shuffled = [...sentences].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(count, shuffled.length); i++) {
        const sentence = shuffled[i];
        const isTrue = Math.random() > 0.5;
        let statement = sentence;
        
        if (!isTrue) {
            const words = sentence.split(' ');
            if (words.length > 3) {
                const idx = Math.floor(Math.random() * (words.length - 2)) + 1;
                words[idx] = ['never', 'always', 'not', 'rarely'][Math.floor(Math.random() * 4)];
                statement = words.join(' ');
            }
        }
        
        questions.push({
            type: 'truefalse',
            text: statement,
            options: ['True', 'False'],
            correct: isTrue ? 0 : 1,
            explanation: isTrue ? 'This statement is true.' : 'This statement is false.'
        });
    }
    return questions;
}

function generateShortAnswer(keywords, count) {
    return keywords.slice(0, count).map(keyword => ({
        type: 'short',
        text: `Explain the concept of "${keyword}".`,
        correct: keyword,
        explanation: `Your answer should include definition, characteristics, and examples of ${keyword}.`
    }));
}

function buildQuizHTML(questions) {
    let html = '';
    
    questions.forEach((q, idx) => {
        html += `
            <div class="quiz-question" data-question="${idx}" data-correct="${q.correct}">
                <div class="question-header">
                    <span class="question-number">${idx + 1}</span>
                    <span class="question-type">${q.type.toUpperCase()}</span>
                </div>
                <div class="question-text">${q.text}</div>
                <div class="quiz-options">
                    ${q.options ? q.options.map((opt, optIdx) => `
                        <div class="quiz-option" data-option="${optIdx}">
                            <span class="option-letter">${String.fromCharCode(65 + optIdx)}</span>
                            <span class="option-text">${opt}</span>
                        </div>
                    `).join('') : ''}
                    ${q.type === 'short' ? `<textarea class="form-input short-answer" placeholder="Type your answer..."></textarea>` : ''}
                </div>
                <div class="question-explanation" style="display: none;">${q.explanation}</div>
            </div>
        `;
    });
    
    html += `
        <div class="action-buttons">
            <button class="btn btn-primary" id="submitQuizBtn"><i class="fas fa-check-circle"></i> Submit</button>
            <button class="btn btn-outline" id="resetQuizBtn"><i class="fas fa-redo"></i> Reset</button>
        </div>
        <div id="quizScore" style="display: none; margin-top: 30px; padding: 24px; background: var(--surface-light); border-radius: 20px;"></div>
    `;
    
    return html;
}

function initQuizInteraction() {
    setTimeout(() => {
        // MCQ / TF selection
        document.querySelectorAll('.quiz-option').forEach(opt => {
            opt.addEventListener('click', function() {
                const parent = this.closest('.quiz-question');
                parent.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                this.classList.add('selected');
            });
        });
        
        // Submit button
        const submitBtn = document.getElementById('submitQuizBtn');
        if (submitBtn) {
            submitBtn.addEventListener('click', evaluateQuiz);
        }
        
        // Reset button
        const resetBtn = document.getElementById('resetQuizBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                document.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
                document.querySelectorAll('.short-answer').forEach(ta => ta.value = '');
                document.getElementById('quizScore').style.display = 'none';
            });
        }
    }, 100);
}

function evaluateQuiz() {
    const questions = document.querySelectorAll('.quiz-question');
    let score = 0;
    let total = questions.length;
    let reviewHTML = '';
    
    questions.forEach((q, idx) => {
        const type = q.querySelector('.question-type')?.textContent.toLowerCase() || '';
        const correct = parseInt(q.dataset.correct);
        let isCorrect = false;
        let userAnswer = '';
        
        if (type.includes('mcq') || type.includes('truefalse')) {
            const selected = q.querySelector('.quiz-option.selected');
            if (selected) {
                const optIdx = parseInt(selected.dataset.option);
                isCorrect = optIdx === correct;
                userAnswer = selected.querySelector('.option-text').textContent;
            }
        } else if (type.includes('short')) {
            const textarea = q.querySelector('textarea');
            userAnswer = textarea?.value.trim() || '';
            isCorrect = userAnswer.length > 10; // Simple heuristic
        }
        
        if (isCorrect) score++;
        
        reviewHTML += `
            <div style="margin-bottom: 16px; padding: 16px; background: ${isCorrect ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}; border-radius: 12px; border-left: 4px solid ${isCorrect ? 'var(--secondary)' : 'var(--danger)'};">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <strong>Question ${idx + 1}</strong>
                    <span style="color: ${isCorrect ? 'var(--secondary)' : 'var(--danger)'};">${isCorrect ? '✓ Correct' : '✗ Incorrect'}</span>
                </div>
                <p style="color: var(--text-muted); font-size: 0.95rem;">${userAnswer ? 'Your answer: ' + userAnswer : 'No answer'}</p>
            </div>
        `;
    });
    
    const percentage = Math.round((score / total) * 100);
    const scoreDiv = document.getElementById('quizScore');
    if (scoreDiv) {
        scoreDiv.style.display = 'block';
        scoreDiv.innerHTML = `
            <h3 style="margin-bottom: 16px;">Quiz Score: ${score}/${total} (${percentage}%)</h3>
            ${reviewHTML}
            <div style="margin-top: 20px; text-align: center;">
                ${percentage >= 70 ? '🎉 Great job!' : '📚 Keep practicing!'}
            </div>
        `;
        scoreDiv.scrollIntoView({ behavior: 'smooth' });
    }
    
    updateStat('quizScore', percentage / 100);
    if (percentage >= 80) {
        showAchievement('🏆 Quiz Master', 'Scored 80% or higher!');
    }
}

function extractKeywords(text) {
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = ['the','and','or','but','for','with','this','that','from','have','are','was','were'];
    const freq = {};
    words.forEach(w => { if (!stopWords.includes(w)) freq[w] = (freq[w] || 0) + 1; });
    return Object.entries(freq).sort((a,b) => b[1] - a[1]).map(e => e[0]);
}

// Sample quiz for demo
export function showSampleQuiz() {
    const sampleText = "Machine learning is a subset of artificial intelligence. Neural networks are computing systems inspired by biological neural networks. Deep learning uses multiple layers to extract higher-level features from raw input.";
    const quizType = document.querySelector('#quiz .option-card.selected')?.dataset.type || 'mcq';
    const quizHTML = generateQuizFromText(sampleText, quizType);
    
    const quizContent = document.getElementById('quizContent');
    const quizResults = document.getElementById('quizResults');
    
    if (quizContent) quizContent.innerHTML = quizHTML;
    if (quizResults) {
        quizResults.style.display = 'block';
        quizResults.scrollIntoView({ behavior: 'smooth' });
    }
    
    initQuizInteraction();
    showNotification('📝 Sample quiz loaded', 'info');

}
