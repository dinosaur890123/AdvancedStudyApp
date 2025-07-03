// StudyPro - Advanced Study App
// Main application logic and state management

class StudyApp {
    constructor() {
        this.flashcards = JSON.parse(localStorage.getItem('studyapp-flashcards') || '[]');
        this.notes = JSON.parse(localStorage.getItem('studyapp-notes') || '[]');
        this.analytics = JSON.parse(localStorage.getItem('studyapp-analytics') || '{}');
        this.settings = JSON.parse(localStorage.getItem('studyapp-settings') || '{}');
        
        this.currentTab = 'dashboard';
        this.currentTheme = localStorage.getItem('studyapp-theme') || 'light';
        this.timerState = {
            isRunning: false,
            isPaused: false,
            timeLeft: 25 * 60, // 25 minutes in seconds
            workDuration: 25,
            breakDuration: 5,
            isBreak: false,
            sessionsToday: 0,
            focusTimeToday: 0
        };
        
        this.reviewSession = {
            cards: [],
            currentIndex: 0,
            isActive: false,
            showingAnswer: false
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadTheme();
        this.updateDashboard();
        this.updateFlashcardTab();
        this.updateNotesTab();
        this.updateTimer();
        this.loadTimerStats();
    }
    
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (e.target.id === 'theme-toggle') {
                    this.toggleTheme();
                    return;
                }
                const tab = e.target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            });
        });
        
        // Dashboard quick actions
        document.getElementById('review-cards')?.addEventListener('click', () => this.startReviewSession());
        document.getElementById('add-card')?.addEventListener('click', () => this.showFlashcardModal());
        document.getElementById('new-note')?.addEventListener('click', () => this.showNoteModal());
        document.getElementById('start-timer')?.addEventListener('click', () => {
            this.switchTab('timer');
            this.startTimer();
        });
        
        // Flashcard events
        document.getElementById('add-flashcard')?.addEventListener('click', () => this.showFlashcardModal());
        document.getElementById('save-flashcard')?.addEventListener('click', () => this.saveFlashcard());
        document.getElementById('cancel-flashcard')?.addEventListener('click', () => this.hideFlashcardModal());
        document.getElementById('close-flashcard-modal')?.addEventListener('click', () => this.hideFlashcardModal());
        document.getElementById('create-first-card')?.addEventListener('click', () => this.showFlashcardModal());
        
        // Note events
        document.getElementById('add-note')?.addEventListener('click', () => this.showNoteModal());
        document.getElementById('save-note')?.addEventListener('click', () => this.saveNote());
        document.getElementById('cancel-note')?.addEventListener('click', () => this.hideNoteModal());
        document.getElementById('close-note-modal')?.addEventListener('click', () => this.hideNoteModal());
        
        // Timer events
        document.getElementById('start-pause-timer')?.addEventListener('click', () => this.toggleTimer());
        document.getElementById('reset-timer')?.addEventListener('click', () => this.resetTimer());
        document.getElementById('work-duration')?.addEventListener('change', (e) => {
            this.timerState.workDuration = parseInt(e.target.value);
            if (!this.timerState.isRunning && !this.timerState.isBreak) {
                this.timerState.timeLeft = this.timerState.workDuration * 60;
                this.updateTimer();
            }
        });
        document.getElementById('break-duration')?.addEventListener('change', (e) => {
            this.timerState.breakDuration = parseInt(e.target.value);
        });
        
        // Review modal events
        document.getElementById('flip-card')?.addEventListener('click', () => this.flipCard());
        document.getElementById('review-again')?.addEventListener('click', () => this.reviewCard(1));
        document.getElementById('review-hard')?.addEventListener('click', () => this.reviewCard(2));
        document.getElementById('review-good')?.addEventListener('click', () => this.reviewCard(3));
        document.getElementById('review-easy')?.addEventListener('click', () => this.reviewCard(4));
        document.getElementById('close-review-modal')?.addEventListener('click', () => this.endReviewSession());
        
        // Modal backdrop clicks
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });
    }
    
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName)?.classList.add('active');
        
        // Add active class to corresponding nav button
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        
        this.currentTab = tabName;
        
        // Update tab content
        switch (tabName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'flashcards':
                this.updateFlashcardTab();
                break;
            case 'notes':
                this.updateNotesTab();
                break;
            case 'analytics':
                this.updateAnalytics();
                break;
        }
    }
    
    toggleTheme() {
        this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.loadTheme();
    }
    
    loadTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        localStorage.setItem('studyapp-theme', this.currentTheme);
        
        const themeIcon = document.querySelector('#theme-toggle .material-icons');
        if (themeIcon) {
            themeIcon.textContent = this.currentTheme === 'light' ? 'dark_mode' : 'light_mode';
        }
    }
    
    updateDashboard() {
        const today = new Date().toDateString();
        const todayStats = this.analytics[today] || { cardsReviewed: 0, focusTime: 0 };
        
        document.getElementById('today-cards').textContent = todayStats.cardsReviewed;
        document.getElementById('total-cards').textContent = this.flashcards.length;
        document.getElementById('focus-time').textContent = todayStats.focusTime;
        document.getElementById('study-streak').textContent = this.calculateStudyStreak();
        
        this.updateRecentActivity();
    }
    
    updateRecentActivity() {
        const activityList = document.getElementById('activity-list');
        if (!activityList) return;
        
        const activities = this.getRecentActivities();
        
        if (activities.length === 0) {
            activityList.innerHTML = '<p class="no-activity">No recent activity. Start studying to see your progress!</p>';
            return;
        }
        
        activityList.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <span class="activity-icon material-icons">${activity.icon}</span>
                <span class="activity-text">${activity.text}</span>
                <span class="activity-time">${activity.time}</span>
            </div>
        `).join('');
    }
    
    getRecentActivities() {
        // This would typically come from a more detailed activity log
        return [];
    }
    
    calculateStudyStreak() {
        const today = new Date();
        let streak = 0;
        let checkDate = new Date(today);
        
        while (true) {
            const dateString = checkDate.toDateString();
            const dayStats = this.analytics[dateString];
            
            if (!dayStats || dayStats.cardsReviewed === 0) {
                break;
            }
            
            streak++;
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        return streak;
    }
    
    updateFlashcardTab() {
        const totalElement = document.getElementById('flashcard-total');
        const dueElement = document.getElementById('flashcard-due');
        
        if (totalElement) totalElement.textContent = this.flashcards.length;
        if (dueElement) dueElement.textContent = this.getDueCards().length;
        
        this.updateSubjectFilter();
        this.updateSubjectList();
    }
    
    updateSubjectFilter() {
        const subjectFilter = document.getElementById('subject-filter');
        if (!subjectFilter) return;
        
        const subjects = [...new Set(this.flashcards.map(card => card.subject))];
        subjectFilter.innerHTML = '<option value="">All Subjects</option>';
        
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectFilter.appendChild(option);
        });
    }
    
    updateSubjectList() {
        const subjectList = document.getElementById('subject-list');
        if (!subjectList) return;
        
        if (this.flashcards.length === 0) {
            subjectList.innerHTML = '<p class="no-cards">No cards yet. <a href="#" id="create-first-card">Create your first flashcard!</a></p>';
            document.getElementById('create-first-card')?.addEventListener('click', () => this.showFlashcardModal());
            return;
        }
        
        const subjects = this.getSubjectStats();
        subjectList.innerHTML = subjects.map(subject => `
            <div class="subject-item">
                <div class="subject-info">
                    <h4>${subject.name}</h4>
                    <p>${subject.total} cards • ${subject.due} due</p>
                </div>
                <button class="btn primary" onclick="app.startSubjectReview('${subject.name}')">
                    Review
                </button>
            </div>
        `).join('');
    }
    
    getSubjectStats() {
        const subjects = {};
        
        this.flashcards.forEach(card => {
            if (!subjects[card.subject]) {
                subjects[card.subject] = { name: card.subject, total: 0, due: 0 };
            }
            subjects[card.subject].total++;
            if (this.isCardDue(card)) {
                subjects[card.subject].due++;
            }
        });
        
        return Object.values(subjects);
    }
    
    getDueCards() {
        return this.flashcards.filter(card => this.isCardDue(card));
    }
    
    isCardDue(card) {
        if (!card.nextReview) return true;
        return new Date(card.nextReview) <= new Date();
    }
    
    showFlashcardModal() {
        const modal = document.getElementById('flashcard-modal');
        modal.classList.add('show');
        document.getElementById('card-front').focus();
    }
    
    hideFlashcardModal() {
        const modal = document.getElementById('flashcard-modal');
        modal.classList.remove('show');
        this.clearFlashcardForm();
    }
    
    clearFlashcardForm() {
        document.getElementById('card-front').value = '';
        document.getElementById('card-back').value = '';
        document.getElementById('card-subject').value = '';
        document.getElementById('card-deck').value = 'default';
    }
    
    saveFlashcard() {
        const front = document.getElementById('card-front').value.trim();
        const back = document.getElementById('card-back').value.trim();
        const subject = document.getElementById('card-subject').value.trim();
        const deck = document.getElementById('card-deck').value;
        
        if (!front || !back || !subject) {
            alert('Please fill in all required fields');
            return;
        }
        
        const card = {
            id: Date.now(),
            front,
            back,
            subject,
            deck,
            created: new Date().toISOString(),
            reviews: 0,
            interval: 1,
            easeFactor: 2.5,
            nextReview: new Date().toISOString()
        };
        
        this.flashcards.push(card);
        this.saveFlashcards();
        this.hideFlashcardModal();
        this.updateFlashcardTab();
        this.updateDashboard();
    }
    
    saveFlashcards() {
        localStorage.setItem('studyapp-flashcards', JSON.stringify(this.flashcards));
    }
    
    startReviewSession(subject = null) {
        let cardsToReview = this.getDueCards();
        
        if (subject) {
            cardsToReview = cardsToReview.filter(card => card.subject === subject);
        }
        
        if (cardsToReview.length === 0) {
            alert('No cards due for review!');
            return;
        }
        
        this.reviewSession = {
            cards: this.shuffleArray(cardsToReview),
            currentIndex: 0,
            isActive: true,
            showingAnswer: false
        };
        
        this.showReviewModal();
    }
    
    startSubjectReview(subject) {
        this.startReviewSession(subject);
    }
    
    showReviewModal() {
        const modal = document.getElementById('review-modal');
        modal.classList.add('show');
        this.updateReviewModal();
    }
    
    updateReviewModal() {
        const currentCard = this.reviewSession.cards[this.reviewSession.currentIndex];
        
        document.getElementById('review-current').textContent = this.reviewSession.currentIndex + 1;
        document.getElementById('review-total').textContent = this.reviewSession.cards.length;
        document.getElementById('current-card-front').textContent = currentCard.front;
        document.getElementById('current-card-back').textContent = currentCard.back;
        
        // Reset card display
        document.getElementById('card-front-review').classList.remove('hidden');
        document.getElementById('card-back-review').classList.add('hidden');
        document.getElementById('review-buttons').classList.add('hidden');
        document.getElementById('flip-card').classList.remove('hidden');
        
        this.reviewSession.showingAnswer = false;
    }
    
    flipCard() {
        document.getElementById('card-front-review').classList.add('hidden');
        document.getElementById('card-back-review').classList.remove('hidden');
        document.getElementById('review-buttons').classList.remove('hidden');
        document.getElementById('flip-card').classList.add('hidden');
        
        this.reviewSession.showingAnswer = true;
    }
    
    reviewCard(quality) {
        const card = this.reviewSession.cards[this.reviewSession.currentIndex];
        this.updateCardSpacedRepetition(card, quality);
        
        // Update analytics
        const today = new Date().toDateString();
        if (!this.analytics[today]) {
            this.analytics[today] = { cardsReviewed: 0, focusTime: 0 };
        }
        this.analytics[today].cardsReviewed++;
        this.saveAnalytics();
        
        // Move to next card
        this.reviewSession.currentIndex++;
        
        if (this.reviewSession.currentIndex >= this.reviewSession.cards.length) {
            this.completeReviewSession();
        } else {
            this.updateReviewModal();
        }
    }
    
    updateCardSpacedRepetition(card, quality) {
        card.reviews++;
        
        if (quality >= 3) {
            if (card.reviews === 1) {
                card.interval = 1;
            } else if (card.reviews === 2) {
                card.interval = 6;
            } else {
                card.interval = Math.round(card.interval * card.easeFactor);
            }
        } else {
            card.interval = 1;
        }
        
        card.easeFactor = Math.max(1.3, card.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
        
        const nextReview = new Date();
        nextReview.setDate(nextReview.getDate() + card.interval);
        card.nextReview = nextReview.toISOString();
        
        this.saveFlashcards();
    }
    
    completeReviewSession() {
        alert(`Review session complete! You reviewed ${this.reviewSession.cards.length} cards.`);
        this.endReviewSession();
    }
    
    endReviewSession() {
        this.reviewSession = {
            cards: [],
            currentIndex: 0,
            isActive: false,
            showingAnswer: false
        };
        
        const modal = document.getElementById('review-modal');
        modal.classList.remove('show');
        
        this.updateDashboard();
        this.updateFlashcardTab();
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    // Notes functionality
    updateNotesTab() {
        const notesGrid = document.getElementById('notes-grid');
        if (!notesGrid) return;
        
        if (this.notes.length === 0) {
            notesGrid.innerHTML = `
                <div class="empty-state">
                    <span class="material-icons">note</span>
                    <h3>No notes yet</h3>
                    <p>Create your first note to get started!</p>
                </div>
            `;
            return;
        }
        
        notesGrid.innerHTML = this.notes.map(note => `
            <div class="note-card">
                <h3>${note.title}</h3>
                <p>${note.content.substring(0, 100)}${note.content.length > 100 ? '...' : ''}</p>
                <div class="note-meta">
                    <span class="note-date">${new Date(note.created).toLocaleDateString()}</span>
                    <div class="note-actions">
                        <button class="btn-sm" onclick="app.editNote(${note.id})">Edit</button>
                        <button class="btn-sm danger" onclick="app.deleteNote(${note.id})">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    showNoteModal() {
        const modal = document.getElementById('note-modal');
        modal.classList.add('show');
        document.getElementById('note-title').focus();
    }
    
    hideNoteModal() {
        const modal = document.getElementById('note-modal');
        modal.classList.remove('show');
        this.clearNoteForm();
    }
    
    clearNoteForm() {
        document.getElementById('note-title').value = '';
        document.getElementById('note-content').value = '';
        document.getElementById('note-tags').value = '';
    }
    
    saveNote() {
        const title = document.getElementById('note-title').value.trim();
        const content = document.getElementById('note-content').value.trim();
        const tags = document.getElementById('note-tags').value.trim();
        
        if (!title || !content) {
            alert('Please fill in title and content');
            return;
        }
        
        const note = {
            id: Date.now(),
            title,
            content,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            created: new Date().toISOString(),
            modified: new Date().toISOString()
        };
        
        this.notes.push(note);
        this.saveNotes();
        this.hideNoteModal();
        this.updateNotesTab();
    }
    
    saveNotes() {
        localStorage.setItem('studyapp-notes', JSON.stringify(this.notes));
    }
    
    editNote(noteId) {
        // Implementation for editing notes
        console.log('Edit note:', noteId);
    }
    
    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(note => note.id !== noteId);
            this.saveNotes();
            this.updateNotesTab();
        }
    }
    
    // Timer functionality
    startTimer() {
        if (!this.timerState.isRunning) {
            this.timerState.isRunning = true;
            this.timerState.isPaused = false;
            this.timerInterval = setInterval(() => {
                this.updateTimerTick();
            }, 1000);
        }
        this.updateTimerButton();
    }
    
    pauseTimer() {
        this.timerState.isRunning = false;
        this.timerState.isPaused = true;
        clearInterval(this.timerInterval);
        this.updateTimerButton();
    }
    
    toggleTimer() {
        if (this.timerState.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }
    
    resetTimer() {
        this.timerState.isRunning = false;
        this.timerState.isPaused = false;
        this.timerState.timeLeft = this.timerState.workDuration * 60;
        this.timerState.isBreak = false;
        clearInterval(this.timerInterval);
        this.updateTimer();
        this.updateTimerButton();
    }
    
    updateTimerTick() {
        this.timerState.timeLeft--;
        
        if (this.timerState.timeLeft <= 0) {
            this.timerComplete();
        }
        
        this.updateTimer();
    }
    
    timerComplete() {
        clearInterval(this.timerInterval);
        this.timerState.isRunning = false;
        
        if (this.timerState.isBreak) {
            // Break completed, start work session
            this.timerState.isBreak = false;
            this.timerState.timeLeft = this.timerState.workDuration * 60;
            alert('Break time is over! Ready for another work session?');
        } else {
            // Work session completed
            this.timerState.sessionsToday++;
            this.timerState.focusTimeToday += this.timerState.workDuration;
            
            // Update analytics
            const today = new Date().toDateString();
            if (!this.analytics[today]) {
                this.analytics[today] = { cardsReviewed: 0, focusTime: 0 };
            }
            this.analytics[today].focusTime += this.timerState.workDuration;
            this.saveAnalytics();
            
            // Start break
            this.timerState.isBreak = true;
            this.timerState.timeLeft = this.timerState.breakDuration * 60;
            alert('Work session complete! Time for a break.');
        }
        
        this.updateTimer();
        this.updateTimerButton();
        this.saveTimerStats();
    }
    
    updateTimer() {
        const minutes = Math.floor(this.timerState.timeLeft / 60);
        const seconds = this.timerState.timeLeft % 60;
        
        document.getElementById('timer-minutes').textContent = minutes.toString().padStart(2, '0');
        document.getElementById('timer-seconds').textContent = seconds.toString().padStart(2, '0');
        
        this.drawTimerCircle();
    }
    
    drawTimerCircle() {
        const canvas = document.getElementById('timer-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 120;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        // Progress circle
        const totalTime = this.timerState.isBreak ? 
            this.timerState.breakDuration * 60 : 
            this.timerState.workDuration * 60;
        const progress = (totalTime - this.timerState.timeLeft) / totalTime;
        const angle = 2 * Math.PI * progress - Math.PI / 2;
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, -Math.PI / 2, angle);
        ctx.strokeStyle = this.timerState.isBreak ? '#4CAF50' : '#2196F3';
        ctx.lineWidth = 8;
        ctx.stroke();
    }
    
    updateTimerButton() {
        const button = document.getElementById('start-pause-timer');
        if (!button) return;
        
        const icon = button.querySelector('.material-icons');
        if (this.timerState.isRunning) {
            icon.textContent = 'pause';
            button.innerHTML = '<span class="material-icons">pause</span> Pause';
        } else {
            icon.textContent = 'play_arrow';
            button.innerHTML = '<span class="material-icons">play_arrow</span> Start';
        }
    }
    
    loadTimerStats() {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem('studyapp-timer-stats') || '{}');
        const todayStats = stats[today] || { sessions: 0, focusTime: 0 };
        
        this.timerState.sessionsToday = todayStats.sessions;
        this.timerState.focusTimeToday = todayStats.focusTime;
        
        document.getElementById('sessions-today').textContent = this.timerState.sessionsToday;
        document.getElementById('focus-time-today').textContent = `${this.timerState.focusTimeToday} min`;
    }
    
    saveTimerStats() {
        const today = new Date().toDateString();
        const stats = JSON.parse(localStorage.getItem('studyapp-timer-stats') || '{}');
        
        stats[today] = {
            sessions: this.timerState.sessionsToday,
            focusTime: this.timerState.focusTimeToday
        };
        
        localStorage.setItem('studyapp-timer-stats', JSON.stringify(stats));
        
        document.getElementById('sessions-today').textContent = this.timerState.sessionsToday;
        document.getElementById('focus-time-today').textContent = `${this.timerState.focusTimeToday} min`;
    }
    
    // Analytics functionality
    updateAnalytics() {
        this.drawProgressChart();
        this.drawSubjectChart();
        this.drawPerformanceChart();
        this.updateAnalyticsSummary();
    }
    
    drawProgressChart() {
        const canvas = document.getElementById('progress-chart');
        if (!canvas) return;
        
        // Basic chart drawing - in a real app, you'd use a proper charting library
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText('Progress Chart - Data visualization would go here', 10, 100);
    }
    
    drawSubjectChart() {
        const canvas = document.getElementById('subject-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText('Subject Distribution - Pie chart would go here', 10, 100);
    }
    
    drawPerformanceChart() {
        const canvas = document.getElementById('performance-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = '#333';
        ctx.font = '16px Arial';
        ctx.fillText('Performance Trends - Line chart would go here', 10, 100);
    }
    
    updateAnalyticsSummary() {
        const totalStudyTime = Object.values(this.analytics).reduce((sum, day) => sum + (day.focusTime || 0), 0);
        const totalReviews = Object.values(this.analytics).reduce((sum, day) => sum + (day.cardsReviewed || 0), 0);
        
        document.getElementById('total-study-time').textContent = `${totalStudyTime} min`;
        document.getElementById('total-reviews').textContent = totalReviews;
        document.getElementById('average-accuracy').textContent = '85%'; // Placeholder
    }
    
    saveAnalytics() {
        localStorage.setItem('studyapp-analytics', JSON.stringify(this.analytics));
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StudyApp();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
