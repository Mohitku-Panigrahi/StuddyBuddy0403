// ===== THEME SWITCHER =====

// Theme definitions (already in CSS, this just controls the UI)
const THEMES = ['default', 'orange', 'pink', 'red'];

export function initTheme() {
    // Load saved theme
    const savedTheme = localStorage.getItem('studybuddy_theme') || 'default';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Setup event listeners
    const themeToggle = document.getElementById('themeToggleBtn');
    const themeDropdown = document.getElementById('themeDropdown');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            themeDropdown.classList.toggle('show');
        });
    }
    
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            setTheme(theme);
            themeDropdown.classList.remove('show');
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.theme-switcher')) {
            themeDropdown?.classList.remove('show');
        }
    });
}

export function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    
    document.body.setAttribute('data-theme', theme);
    localStorage.setItem('studybuddy_theme', theme);
    
    // Update primary RGB for box-shadows (approximate)
    const primaryColors = {
        default: '139, 92, 246',
        orange: '249, 115, 22',
        pink: '236, 72, 153',
        red: '239, 68, 68'
    };
    
    document.body.style.setProperty('--primary-rgb', primaryColors[theme]);
}
