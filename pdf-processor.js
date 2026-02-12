import { state, updateStat } from './state.js';
import { showNotification, showLoading, updateProgress, hideLoading, showAchievement } from './ui.js';

// Initialize PDF.js worker
if (typeof pdfjsLib !== 'undefined') {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
}

export async function extractTextFromPDF(file) {
    if (!file) throw new Error('No file provided');
    
    showLoading('Extracting text from PDF...', true);
    
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        
        let fullText = '';
        const totalPages = pdf.numPages;
        
        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += pageText + '\n\n';
            updateProgress((i / totalPages) * 100);
        }
        
        hideLoading();
        return fullText;
    } catch (error) {
        hideLoading();
        throw new Error('Failed to extract text: ' + error.message);
    }
}

export async function generateNotes() {
    if (!state.currentFiles.notes) {
        showNotification('Please upload a PDF file', 'warning');
        return;
    }
    
    try {
        const text = await extractTextFromPDF(state.currentFiles.notes);
        const selectedOption = document.querySelector('#notes .option-card.selected');
        const noteType = selectedOption?.dataset.type || 'detailed';
        
        const notes = generateNotesFromText(text, noteType);
        
        const notesContent = document.getElementById('notesContent');
        const notesResults = document.getElementById('notesResults');
        
        if (notesContent) notesContent.innerHTML = notes;
        if (notesResults) {
            notesResults.style.display = 'block';
            notesResults.scrollIntoView({ behavior: 'smooth' });
        }
        
        const leveledUp = updateStat('notes', 1);
        updateStat('studyTime', 0.25);
        
        showNotification('✅ Notes generated successfully!', 'success');
        if (leveledUp) showAchievement('🎯 Level Up!', `You reached level ${state.user.levelNumber}!`);
        
    } catch (error) {
        showNotification('❌ Error: ' + error.message, 'error');
        console.error(error);
    }
}

export function generateNotesFromText(text, type) {
    // Clean and split text
    const sentences = text.split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 20);
    
    const maxSentences = Math.min(sentences.length, 25);
    const keySentences = sentences.slice(0, maxSentences);
    
    // Extract keywords
    const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
    const stopWords = ['the','and','or','but','for','with','this','that','from','have','are','was','were','can','will','has','had'];
    const wordFreq = {};
    words.forEach(word => {
        if (!stopWords.includes(word) && word.length > 3) {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
    });
    
    const keywords = Object.entries(wordFreq)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 20)
        .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
    
    // Identify definitions
    const definitions = sentences.filter(s => 
        /\b(is|are|refers to|means|defined as|consists of)\b/i.test(s)
    ).slice(0, 5);
    
    switch(type) {
        case 'summary':
            return `
                <div style="margin-bottom: 28px;">
                    <h4 style="color: var(--primary); margin-bottom: 16px;"><i class="fas fa-file-contract"></i> Executive Summary</h4>
                    <p style="line-height: 1.8; background: var(--surface-light); padding: 20px; border-radius: 16px;">${keySentences.slice(0, 3).join(' ')}</p>
                </div>
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 16px;"><i class="fas fa-tags"></i> Key Concepts</h4>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        ${keywords.slice(0, 15).map(word => 
                            `<span style="background: var(--surface-light); padding: 6px 16px; border-radius: 30px; border: 1px solid var(--border);">${word}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
            
        case 'detailed':
            return `
                <div style="margin-bottom: 28px;">
                    <h4 style="color: var(--primary); margin-bottom: 16px;"><i class="fas fa-align-left"></i> Full Analysis</h4>
                    <div style="background: var(--surface-light); padding: 24px; border-radius: 16px; line-height: 1.8;">
                        ${keySentences.slice(0, 15).join(' ')}
                    </div>
                </div>
                ${definitions.length ? `
                <div>
                    <h4 style="color: var(--primary); margin-bottom: 16px;"><i class="fas fa-book"></i> Definitions</h4>
                    ${definitions.map(def => 
                        `<div style="background: rgba(139,92,246,0.08); padding: 16px 20px; border-radius: 12px; border-left: 4px solid var(--primary); margin-bottom: 12px;">${def}</div>`
                    ).join('')}
                </div>
                ` : ''}
            `;
            
        case 'bullet':
            return `
                <h4 style="color: var(--primary); margin-bottom: 20px;"><i class="fas fa-list-ul"></i> Key Takeaways</h4>
                <ul style="list-style: none; padding: 0;">
                    ${keySentences.slice(0, 15).map(s => 
                        `<li style="margin-bottom: 16px; padding: 12px 20px; background: var(--surface-light); border-radius: 12px; display: flex; gap: 12px;">
                            <span style="color: var(--primary);">→</span>
                            <span>${s}</span>
                        </li>`
                    ).join('')}
                </ul>
            `;
            
        case 'mindmap':
            return `
                <div style="text-align: center; padding: 40px 20px; background: var(--surface-light); border-radius: 20px;">
                    <i class="fas fa-project-diagram" style="font-size: 4rem; color: var(--primary); margin-bottom: 20px;"></i>
                    <h4 style="margin-bottom: 16px;">Concept Map Preview</h4>
                    <p style="color: var(--text-muted); margin-bottom: 24px;">Central theme: <strong>${keywords[0] || 'Document'}</strong></p>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">
                        ${keywords.slice(1, 9).map(word => 
                            `<span style="background: var(--surface); padding: 8px 16px; border-radius: 30px; border: 1px solid var(--primary);">${word}</span>`
                        ).join('')}
                    </div>
                </div>
            `;
            
        default:
            return `<p>${keySentences.slice(0, 10).join(' ')}</p>`;
    }
}

export function clearFile(type) {
    if (type === 'notes') {
        state.currentFiles.notes = null;
        const btn = document.getElementById('generateNotesBtn');
        if (btn) btn.disabled = true;
    } else if (type === 'quiz') {
        state.currentFiles.quiz = null;
        const btn = document.getElementById('generateQuizBtn');
        if (btn) btn.disabled = true;
    }
}