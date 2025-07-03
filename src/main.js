import './style.css'

// Material Design 3 Ripple Effect
function createRipple(event) {
  const button = event.currentTarget;
  
  const circle = document.createElement("span");
  const diameter = Math.max(button.clientWidth, button.clientHeight);
  const radius = diameter / 2;

  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - button.offsetLeft - radius}px`;
  circle.style.top = `${event.clientY - button.offsetTop - radius}px`;
  circle.classList.add("ripple");

  const ripple = button.getElementsByClassName("ripple")[0];

  if (ripple) {
    ripple.remove();
  }

  button.appendChild(circle);
}

// Add ripple effect to all buttons
function initializeRippleEffects() {
  document.querySelectorAll('.btn, .nav-btn, .fab').forEach(button => {
    button.addEventListener('click', createRipple);
  });
}

// Material Design 3 Theme Utilities
function showSnackbar(message, action = null) {
  const snackbar = document.createElement('div');
  snackbar.className = 'md-snackbar';
  snackbar.innerHTML = `
    <span>${message}</span>
    ${action ? `<button class="md-snackbar-action">${action.text}</button>` : ''}
  `;
  
  document.body.appendChild(snackbar);
  
  // Show snackbar
  setTimeout(() => snackbar.classList.add('show'), 100);
  
  // Auto-hide after 4 seconds
  setTimeout(() => {
    snackbar.classList.remove('show');
    setTimeout(() => snackbar.remove(), 300);
  }, 4000);
  
  // Handle action click
  if (action) {
    snackbar.querySelector('.md-snackbar-action').addEventListener('click', action.callback);
  }
}

// Application State
class StudyApp {
  constructor() {
    this.data = {
      cards: this.safeParseJSON(localStorage.getItem('studyapp_cards')) || [],
      notes: this.safeParseJSON(localStorage.getItem('studyapp_notes')) || [],
      subjects: this.safeParseJSON(localStorage.getItem('studyapp_subjects')) || [
        { id: 'general', name: 'General', color: '#6366f1', topics: [] }
      ],
      decks: this.safeParseJSON(localStorage.getItem('studyapp_decks')) || [{ id: 'default', name: 'Default Deck' }],
      stats: this.safeParseJSON(localStorage.getItem('studyapp_stats')) || {
        dailyStats: {},
        totalSessions: 0,
        totalFocusTime: 0,
        studyStreak: 0,
        lastStudyDate: null
      },
      settings: this.safeParseJSON(localStorage.getItem('studyapp_settings')) || {
        theme: 'light',
        focusTime: 25,
        breakTime: 5,
        autoStartBreaks: false,
        notifications: true
      }
    };

    this.currentCard = null;
    this.currentCardIndex = 0;
    this.reviewCards = [];
    this.currentNote = null;
    this.timer = {
      isRunning: false,
      isPaused: false,
      timeLeft: 0,
      totalTime: 0,
      mode: 'focus', // 'focus' or 'break'
      interval: null
    };

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadTheme();
    this.renderSubjects();
    this.updateDashboard();
    this.renderCards();
    this.updateCardStats();
    this.renderNotes();
    this.setupTimer();
    this.restoreTimerProgress();
    this.enhanceNoteEditor();
    this.checkStudyStreak();
    this.setupKeyboardShortcuts();
    this.displayStudyRecommendations();
    initializeRippleEffects();
  }

  setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Dashboard actions
    document.querySelector('[data-action="review"]')?.addEventListener('click', () => {
      this.switchTab('flashcards');
      this.startReview();
    });
    
    document.querySelector('[data-action="new-card"]')?.addEventListener('click', () => {
      this.switchTab('flashcards');
      this.openCardModal();
    });
    
    document.querySelector('[data-action="new-note"]')?.addEventListener('click', () => {
      this.switchTab('notes');
      this.createNewNote();
    });
    
    document.querySelector('[data-action="start-timer"]')?.addEventListener('click', () => {
      this.switchTab('timer');
      this.startTimer();
    });

    // Flashcard events
    document.getElementById('addCardBtn')?.addEventListener('click', () => this.openCardModal());
    document.getElementById('flipCard')?.addEventListener('click', () => this.flipCard());
    document.getElementById('startReviewBtn')?.addEventListener('click', () => this.startReview());
    
    document.querySelectorAll('.review-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.rateCard(parseInt(e.target.dataset.difficulty));
      });
    });

    // Card modal events
    document.getElementById('saveCard')?.addEventListener('click', () => this.saveCard());
    document.getElementById('cancelCard')?.addEventListener('click', () => this.closeCardModal());
    document.querySelector('.modal-close')?.addEventListener('click', () => this.closeCardModal());

    // Notes events
    document.getElementById('newNoteBtn')?.addEventListener('click', () => this.createNewNote());
    document.getElementById('saveNote')?.addEventListener('click', () => this.saveCurrentNote());
    document.getElementById('deleteNote')?.addEventListener('click', () => this.deleteCurrentNote());
    document.getElementById('noteSearch')?.addEventListener('input', (e) => this.searchNotes(e.target.value));
    document.getElementById('manageSubjectsBtn')?.addEventListener('click', () => this.openSubjectModal());
    document.getElementById('newTopicBtn')?.addEventListener('click', () => this.openTopicModal());

    // Subject and topic filtering
    document.getElementById('subjectSelect')?.addEventListener('change', (e) => this.filterNotesBySubject(e.target.value));
    document.getElementById('topicSelect')?.addEventListener('change', (e) => this.filterNotesByTopic(e.target.value));
    document.getElementById('noteSubject')?.addEventListener('change', (e) => this.updateTopicsForNote(e.target.value));

    // Subject management events
    document.getElementById('addSubjectBtn')?.addEventListener('click', () => this.addSubject());
    document.getElementById('closeSubjectModal')?.addEventListener('click', () => this.closeSubjectModal());
    document.getElementById('saveTopic')?.addEventListener('click', () => this.saveTopic());
    document.getElementById('cancelTopic')?.addEventListener('click', () => this.closeTopicModal());

    // Color preset selection
    document.querySelectorAll('.color-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.getElementById('subjectColor').value = e.target.dataset.color;
        document.querySelectorAll('.color-preset').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Editor toolbar events
    document.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        document.execCommand(e.target.dataset.command, false, null);
      });
    });

    // Timer events
    document.getElementById('startTimer')?.addEventListener('click', () => this.startTimer());
    document.getElementById('pauseTimer')?.addEventListener('click', () => this.pauseTimer());
    document.getElementById('resetTimer')?.addEventListener('click', () => this.resetTimer());
    
    // Timer settings
    document.getElementById('focusTimeSlider')?.addEventListener('input', (e) => {
      this.data.settings.focusTime = parseInt(e.target.value);
      document.getElementById('focusTimeValue').textContent = e.target.value;
      this.saveData();
    });
    
    document.getElementById('breakTimeSlider')?.addEventListener('input', (e) => {
      this.data.settings.breakTime = parseInt(e.target.value);
      document.getElementById('breakTimeValue').textContent = e.target.value;
      this.saveData();
    });

    // Close modal on background click
    document.getElementById('cardModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'cardModal') {
        this.closeCardModal();
      }
    });

    document.getElementById('subjectModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'subjectModal') {
        this.closeSubjectModal();
      }
    });

    document.getElementById('topicModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'topicModal') {
        this.closeTopicModal();
      }
    });

    // Close modal buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal');
        if (modal) modal.classList.remove('active');
      });
    });

    // Import/Export functionality
    document.getElementById('exportCards')?.addEventListener('click', () => this.exportCards());
    document.getElementById('importCards')?.addEventListener('click', () => this.importCards());

    // Card subject filtering
    document.getElementById('cardSubjectFilter')?.addEventListener('change', (e) => {
      this.filterCardsBySubject(e.target.value);
    });

    // Subject-specific review buttons
    document.querySelectorAll('.review-subject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subjectId = e.target.dataset.subjectId;
        this.startReviewBySubject(subjectId);
      });
    });
  }

  // Theme Management
  toggleTheme() {
    const newTheme = this.data.settings.theme === 'light' ? 'dark' : 'light';
    this.data.settings.theme = newTheme;
    this.loadTheme();
    this.saveData();
  }

  loadTheme() {
    document.documentElement.setAttribute('data-theme', this.data.settings.theme);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.textContent = this.data.settings.theme === 'light' ? '🌙' : '☀️';
    }
  }

  // Navigation
  switchTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(tab => {
      tab.classList.toggle('active', tab.id === tabName);
    });

    // Tab-specific actions
    if (tabName === 'analytics') {
      this.renderAnalytics();
    }

    this.currentTab = tabName; // Track current tab
  }

  // Dashboard
  updateDashboard() {
    const today = new Date().toDateString();
    const todayStats = this.data.stats.dailyStats[today] || { cardsReviewed: 0, focusTime: 0 };

    document.getElementById('todayCards').textContent = todayStats.cardsReviewed || 0;
    document.getElementById('studyStreak').textContent = this.data.stats.studyStreak || 0;
    document.getElementById('totalCards').textContent = this.data.cards.length;
    document.getElementById('focusTime').textContent = Math.round((todayStats.focusTime || 0) / 60);

    this.updateRecentActivity();
  }

  updateRecentActivity() {
    const recentList = document.getElementById('recentList');
    const activities = this.getRecentActivities();
    
    if (activities.length === 0) {
      recentList.innerHTML = '<p class="empty-state">No recent activity. Start studying to see your progress!</p>';
      return;
    }

    recentList.innerHTML = activities.map(activity => `
      <div class="activity-item">
        <span>${activity.text}</span>
        <span class="activity-time">${activity.time}</span>
      </div>
    `).join('');
  }

  getRecentActivities() {
    const activities = [];
    const today = new Date().toDateString();
    const todayStats = this.data.stats.dailyStats[today];
    
    if (todayStats) {
      if (todayStats.cardsReviewed > 0) {
        activities.push({
          text: `Reviewed ${todayStats.cardsReviewed} cards`,
          time: 'Today'
        });
      }
      if (todayStats.focusTime > 0) {
        activities.push({
          text: `Focused for ${Math.round(todayStats.focusTime / 60)} minutes`,
          time: 'Today'
        });
      }
    }

    return activities.slice(0, 5);
  }

  checkStudyStreak() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastStudyDate = this.data.stats.lastStudyDate ? new Date(this.data.stats.lastStudyDate) : null;
    
    if (!lastStudyDate) {
      this.data.stats.studyStreak = 0;
    } else if (lastStudyDate.toDateString() === yesterday.toDateString()) {
      // Continue streak if studied yesterday
    } else if (lastStudyDate.toDateString() !== today.toDateString()) {
      // Reset streak if last study was more than a day ago
      this.data.stats.studyStreak = 0;
    }
    
    this.saveData();
  }

  // Flashcards
  openCardModal(card = null) {
    const modal = document.getElementById('cardModal');
    const title = document.getElementById('cardModalTitle');
    const frontInput = document.getElementById('cardFrontInput');
    const backInput = document.getElementById('cardBackInput');
    const tagsInput = document.getElementById('cardTags');
    const subjectSelect = document.getElementById('cardSubject');

    if (card) {
      title.textContent = 'Edit Card';
      frontInput.value = card.front;
      backInput.value = card.back;
      tagsInput.value = card.tags ? card.tags.join(', ') : '';
      if (subjectSelect) {
        subjectSelect.value = card.subjectId || '';
      }
      this.editingCard = card;
    } else {
      title.textContent = 'Add New Card';
      frontInput.value = '';
      backInput.value = '';
      tagsInput.value = '';
      if (subjectSelect) {
        subjectSelect.value = this.currentCardSubjectFilter || '';
      }
      this.editingCard = null;
    }

    modal.classList.add('active');
    frontInput.focus();
  }

  closeCardModal() {
    document.getElementById('cardModal').classList.remove('active');
    this.editingCard = null;
  }

  saveCard() {
    const front = document.getElementById('cardFrontInput').value.trim();
    const back = document.getElementById('cardBackInput').value.trim();
    const tagsText = document.getElementById('cardTags').value.trim();
    const subjectId = document.getElementById('cardSubject')?.value || '';

    if (!front || !back) {
      alert('Please fill in both front and back of the card.');
      return;
    }

    const tags = tagsText ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    if (this.editingCard) {
      // Edit existing card
      this.editingCard.front = front;
      this.editingCard.back = back;
      this.editingCard.tags = tags;
      this.editingCard.subjectId = subjectId;
      this.editingCard.lastModified = new Date().toISOString();
    } else {
      // Create new card
      const card = {
        id: Date.now().toString(),
        front,
        back,
        tags,
        subjectId,
        deck: 'default',
        created: new Date().toISOString(),
        lastReviewed: null,
        nextReview: new Date().toISOString(),
        interval: 1,
        easeFactor: 2.5,
        reviewCount: 0
      };
      this.data.cards.push(card);
    }

    this.saveData();
    this.renderCards();
    this.updateDashboard();
    this.closeCardModal();
  }

  renderCards() {
    const cardsGrid = document.getElementById('cardsGrid');
    
    // Filter cards by selected subject if any
    let filteredCards = [...this.data.cards];
    if (this.currentCardSubjectFilter) {
      filteredCards = filteredCards.filter(card => card.subjectId === this.currentCardSubjectFilter);
    }
    
    if (filteredCards.length === 0) {
      const filterText = this.currentCardSubjectFilter ? ' for this subject' : '';
      cardsGrid.innerHTML = `<p class="empty-state">No cards${filterText}. Create your first flashcard!</p>`;
      return;
    }

    // Group cards by subject
    const cardsBySubject = {};
    filteredCards.forEach(card => {
      const subjectId = card.subjectId || 'unassigned';
      if (!cardsBySubject[subjectId]) {
        cardsBySubject[subjectId] = [];
      }
      cardsBySubject[subjectId].push(card);
    });

    // Render cards grouped by subject
    let html = '';
    Object.entries(cardsBySubject).forEach(([subjectId, cards]) => {
      const subject = subjectId !== 'unassigned' ? 
        this.data.subjects.find(s => s.id === subjectId) : null;
      
      const subjectName = subject ? subject.name : 'Unassigned';
      const subjectColor = subject ? subject.color : '#6366f1';
      
      html += `
        <div class="cards-subject-group">
          <div class="cards-subject-header" style="--subject-color: ${subjectColor}">
            <h3 class="cards-subject-title">
              <span class="subject-color-dot" style="background: ${subjectColor}"></span>
              ${subjectName}
            </h3>
            <span class="cards-count">${cards.length} cards</span>
          </div>
          <div class="cards-subject-grid">
            ${cards.map(card => `
              <div class="card-item" data-card-id="${card.id}" style="--subject-color: ${subjectColor}">
                <div class="card-item-front">${this.truncateText(card.front, 100)}</div>
                <div class="card-item-back">${this.truncateText(card.back, 80)}</div>
                ${card.tags && card.tags.length > 0 ? `
                  <div class="card-item-tags">
                    ${card.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                  </div>
                ` : ''}
                <div class="card-item-meta">
                  <span class="card-review-count">${card.reviewCount || 0} reviews</span>
                  <span class="card-interval">${card.interval || 1}d interval</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    });

    cardsGrid.innerHTML = html;

    // Add click listeners
    document.querySelectorAll('.card-item').forEach(item => {
      item.addEventListener('click', () => {
        const cardId = item.dataset.cardId;
        const card = this.data.cards.find(c => c.id === cardId);
        this.openCardModal(card);
      });
    });
  }

  startReview() {
    this.reviewCards = this.getCardsForReview();
    
    if (this.reviewCards.length === 0) {
      alert('No cards are due for review right now!');
      return;
    }

    this.currentCardIndex = 0;
    this.showReviewInterface();
    this.displayCurrentCard();
  }

  getCardsForReview() {
    const now = new Date();
    return this.data.cards.filter(card => new Date(card.nextReview) <= now);
  }

  showReviewInterface() {
    document.getElementById('cardsList').style.display = 'none';
    document.getElementById('reviewArea').style.display = 'block';
  }

  hideReviewInterface() {
    document.getElementById('cardsList').style.display = 'block';
    document.getElementById('reviewArea').style.display = 'none';
  }

  displayCurrentCard() {
    if (this.currentCardIndex >= this.reviewCards.length) {
      this.finishReview();
      return;
    }

    const card = this.reviewCards[this.currentCardIndex];
    this.currentCard = card;

    document.getElementById('cardFront').textContent = card.front;
    document.getElementById('cardBack').textContent = card.back;
    
    // Reset card display
    document.querySelector('.flashcard').classList.remove('flipped');
    document.querySelector('.card-back').style.display = 'none';
    document.getElementById('flipCard').style.display = 'block';
    document.getElementById('flipCard').textContent = 'Show Answer';
    document.getElementById('reviewButtons').style.display = 'none';
  }

  flipCard() {
    const card = document.querySelector('.flashcard');
    const cardBack = document.querySelector('.card-back');
    const flipBtn = document.getElementById('flipCard');
    const reviewButtons = document.getElementById('reviewButtons');

    if (card.classList.contains('flipped')) {
      // Already flipped, show review buttons
      flipBtn.style.display = 'none';
      reviewButtons.style.display = 'flex';
    } else {
      // Flip the card
      card.classList.add('flipped');
      cardBack.style.display = 'flex';
      flipBtn.textContent = 'Rate Your Performance';
    }
  }

  rateCard(difficulty) {
    if (!this.currentCard) return;

    // Update card using spaced repetition algorithm
    this.updateCardSpacing(this.currentCard, difficulty);
    
    // Update stats
    this.updateStats('cardReviewed');
    
    // Move to next card
    this.currentCardIndex++;
    this.displayCurrentCard();
  }

  updateCardSpacing(card, difficulty) {
    const now = new Date();
    card.lastReviewed = now.toISOString();
    card.reviewCount++;

    // Enhanced spaced repetition algorithm (SM-2 based)
    let newInterval = card.interval;
    let newEaseFactor = card.easeFactor;

    if (difficulty === 1) { // Hard - reset to beginning with penalty
      newInterval = 1;
      newEaseFactor = Math.max(1.3, card.easeFactor - 0.2);
      card.lapses = (card.lapses || 0) + 1;
    } else if (difficulty === 2) { // Good - normal progression
      if (card.interval === 1) {
        newInterval = 6; // First successful review: 6 days
      } else if (card.interval < 6) {
        newInterval = 6; // Second successful review
      } else {
        newInterval = Math.round(card.interval * newEaseFactor);
      }
      newEaseFactor = Math.max(1.3, card.easeFactor - 0.02);
    } else { // Easy - accelerated progression
      if (card.interval === 1) {
        newInterval = 4; // Easy first review
      } else {
        newInterval = Math.round(card.interval * card.easeFactor * 1.3);
      }
      newEaseFactor = Math.min(2.5, card.easeFactor + 0.15);
    }

    // Apply retention rate adjustments
    const retentionRate = this.calculateRetentionRate(card);
    if (retentionRate < 0.8) {
      newInterval = Math.floor(newInterval * 0.8); // Reduce interval if struggling
    }

    card.interval = Math.max(1, newInterval);
    card.easeFactor = newEaseFactor;
    card.retentionRate = retentionRate;

    // Set next review date with some randomization to spread workload
    const nextReview = new Date(now);
    const randomOffset = Math.floor(Math.random() * Math.max(1, card.interval * 0.1));
    nextReview.setDate(nextReview.getDate() + card.interval + randomOffset);
    card.nextReview = nextReview.toISOString();

    this.saveData();
  }

  calculateRetentionRate(card) {
    if (!card.reviewHistory) {
      card.reviewHistory = [];
    }
    
    // Add current review to history
    card.reviewHistory.push({
      date: new Date().toISOString(),
      difficulty: arguments[1] || 2,
      interval: card.interval
    });

    // Keep only last 10 reviews for calculation
    if (card.reviewHistory.length > 10) {
      card.reviewHistory = card.reviewHistory.slice(-10);
    }

    // Calculate retention rate based on recent performance
    const recentSuccesses = card.reviewHistory.filter(r => r.difficulty >= 2).length;
    return card.reviewHistory.length > 0 ? recentSuccesses / card.reviewHistory.length : 1.0;
  }

  finishReview() {
    alert(`Review complete! You reviewed ${this.reviewCards.length} cards.`);
    this.hideReviewInterface();
    this.updateDashboard();
  }

  // Notes
  createNewNote() {
    const note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '',
      subjectId: '',
      topicId: '',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };

    this.data.notes.unshift(note);
    this.currentNote = note;
    this.renderNotes();
    this.showNoteEditor();
    this.saveData();

    // Focus on title
    setTimeout(() => {
      document.getElementById('noteTitle').focus();
      document.getElementById('noteTitle').select();
    }, 100);
  }

  renderNotes() {
    const notesList = document.getElementById('notesList');
    
    // Filter notes based on selected subject/topic
    let filteredNotes = [...this.data.notes];
    
    if (this.currentSubjectFilter) {
      filteredNotes = filteredNotes.filter(note => note.subjectId === this.currentSubjectFilter);
    }
    
    if (this.currentTopicFilter) {
      filteredNotes = filteredNotes.filter(note => note.topicId === this.currentTopicFilter);
    }
    
    if (filteredNotes.length === 0) {
      notesList.innerHTML = '<p class="empty-state">No notes found for the selected filters.</p>';
      return;
    }

    notesList.innerHTML = filteredNotes.map(note => {
      const subject = note.subjectId ? this.data.subjects.find(s => s.id === note.subjectId) : null;
      const topic = note.topicId && subject ? subject.topics.find(t => t.id === note.topicId) : null;
      
      return `
        <div class="note-item ${this.currentNote?.id === note.id ? 'active' : ''}" 
             data-note-id="${note.id}" 
             style="--subject-color: ${subject?.color || '#6366f1'}">
          ${subject || topic ? `
            <div class="note-item-meta">
              ${subject ? `<span class="note-subject-tag" style="background: ${subject.color}">${subject.name}</span>` : ''}
              ${topic ? `<span class="note-topic-tag">${topic.name}</span>` : ''}
            </div>
          ` : ''}
          <div class="note-item-title">${note.title}</div>
          <div class="note-item-preview">${this.getTextContent(note.content).substring(0, 50)}...</div>
        </div>
      `;
    }).join('');

    // Add click listeners
    document.querySelectorAll('.note-item').forEach(item => {
      item.addEventListener('click', () => {
        const noteId = item.dataset.noteId;
        this.selectNote(noteId);
      });
    });
  }

  selectNote(noteId) {
    this.currentNote = this.data.notes.find(note => note.id === noteId);
    this.renderNotes();
    this.showNoteEditor();
  }

  showNoteEditor() {
    if (!this.currentNote) return;

    const editor = document.getElementById('noteEditor');
    const titleInput = document.getElementById('noteTitle');
    const contentDiv = document.getElementById('noteContent');
    const subjectSelect = document.getElementById('noteSubject');
    const topicSelect = document.getElementById('noteTopic');

    titleInput.value = this.currentNote.title;
    contentDiv.innerHTML = this.currentNote.content;
    
    // Set subject selection
    if (subjectSelect) {
      subjectSelect.value = this.currentNote.subjectId || '';
      this.updateTopicsForNote(this.currentNote.subjectId);
    }
    
    // Set topic selection
    if (topicSelect && this.currentNote.topicId) {
      setTimeout(() => {
        topicSelect.value = this.currentNote.topicId || '';
      }, 100);
    }

    editor.style.display = 'flex';
  }

  saveCurrentNote() {
    if (!this.currentNote) return;

    this.currentNote.title = document.getElementById('noteTitle').value || 'Untitled Note';
    this.currentNote.content = document.getElementById('noteContent').innerHTML;
    this.currentNote.subjectId = document.getElementById('noteSubject').value || '';
    this.currentNote.topicId = document.getElementById('noteTopic').value || '';
    this.currentNote.lastModified = new Date().toISOString();

    this.saveData();
    this.renderNotes();
  }

  deleteCurrentNote() {
    if (!this.currentNote) return;

    if (confirm('Are you sure you want to delete this note?')) {
      this.data.notes = this.data.notes.filter(note => note.id !== this.currentNote.id);
      this.currentNote = null;
      document.getElementById('noteEditor').style.display = 'none';
      this.saveData();
      this.renderNotes();
    }
  }

  searchNotes(query) {
    const noteItems = document.querySelectorAll('.note-item');
    
    noteItems.forEach(item => {
      const title = item.querySelector('.note-item-title').textContent.toLowerCase();
      const preview = item.querySelector('.note-item-preview').textContent.toLowerCase();
      const matches = title.includes(query.toLowerCase()) || preview.includes(query.toLowerCase());
      item.style.display = matches ? 'block' : 'none';
    });
  }

  // Enhanced Timer with Productivity Features
  setupTimer() {
    this.timer.timeLeft = this.data.settings.focusTime * 60;
    this.timer.totalTime = this.timer.timeLeft;
    this.timer.currentSession = 1;
    this.timer.completedSessions = 0;
    this.timer.dailyGoal = this.data.settings.dailyGoal || 8; // 8 pomodoros per day
    this.timer.sessionStartTime = null;
    this.timer.totalFocusTimeToday = this.getTodayFocusTime();
    this.updateTimerDisplay();
    this.updateTimerSettings();
    this.updateSessionProgress();
  }

  startTimer() {
    if (this.timer.isPaused) {
      this.timer.isPaused = false;
    } else {
      this.timer.timeLeft = this.timer.mode === 'focus' ? 
        this.data.settings.focusTime * 60 : this.data.settings.breakTime * 60;
      this.timer.totalTime = this.timer.timeLeft;
      this.timer.sessionStartTime = new Date();
    }

    this.timer.isRunning = true;
    this.updateTimerControls();
    this.trackTimeInBackground();
    
    this.timer.interval = setInterval(() => {
      this.timer.timeLeft--;
      this.updateTimerDisplay();
      
      // Auto-save progress every minute
      if (this.timer.timeLeft % 60 === 0) {
        this.autosaveTimerProgress();
      }
      
      if (this.timer.timeLeft <= 0) {
        this.timerComplete();
      }
    }, 1000);

    // Play focus sound
    this.playTimerSound('start');
  }

  timerComplete() {
    clearInterval(this.timer.interval);
    this.timer.isRunning = false;
    this.timer.isPaused = false;
    
    const sessionDuration = this.timer.mode === 'focus' ? 
      this.data.settings.focusTime : this.data.settings.breakTime;
    
    if (this.timer.mode === 'focus') {
      // Focus session complete
      this.timer.completedSessions++;
      this.updateStats('focusSession', sessionDuration);
      this.trackFocusTime(sessionDuration);
      
      // Determine break type (short or long)
      const isLongBreak = this.timer.completedSessions % 4 === 0;
      const breakTime = isLongBreak ? 
        (this.data.settings.longBreakTime || 15) : this.data.settings.breakTime;
      
      this.playNotification(`Focus session ${this.timer.completedSessions} complete! ${isLongBreak ? 'Long break' : 'Short break'} time.`);
      this.playTimerSound('complete');
      
      // Auto-start break if enabled
      if (this.data.settings.autoStartBreaks) {
        setTimeout(() => {
          this.timer.mode = 'break';
          this.timer.timeLeft = breakTime * 60;
          this.timer.totalTime = this.timer.timeLeft;
          this.startTimer();
        }, 2000);
      } else {
        this.timer.mode = 'break';
        this.timer.timeLeft = breakTime * 60;
        this.timer.totalTime = this.timer.timeLeft;
      }
    } else {
      // Break complete
      this.playNotification('Break time over! Ready for another focus session?');
      this.playTimerSound('break-end');
      this.timer.mode = 'focus';
      this.timer.timeLeft = this.data.settings.focusTime * 60;
      this.timer.totalTime = this.timer.timeLeft;
    }
    
    this.updateTimerDisplay();
    this.updateTimerControls();
    this.updateSessionProgress();
    this.updateDashboard();
    this.checkDailyGoal();
  }

  // Track background time for productivity insights
  trackTimeInBackground() {
    if (!this.timer.backgroundTracker) {
      this.timer.backgroundTracker = setInterval(() => {
        // Track if user is away from tab
        if (document.hidden && this.timer.isRunning) {
          this.timer.awayTime = (this.timer.awayTime || 0) + 1;
        }
      }, 1000);
    }
  }

  // Auto-save timer progress
  autosaveTimerProgress() {
    const progress = {
      timeLeft: this.timer.timeLeft,
      totalTime: this.timer.totalTime,
      mode: this.timer.mode,
      completedSessions: this.timer.completedSessions,
      sessionStartTime: this.timer.sessionStartTime,
      lastSaved: new Date().toISOString()
    };
    localStorage.setItem('studyapp_timer_progress', JSON.stringify(progress));
  }

  // Restore timer progress on app load
  restoreTimerProgress() {
    const saved = localStorage.getItem('studyapp_timer_progress');
    if (saved) {
      const progress = JSON.parse(saved);
      const now = new Date();
      const lastSaved = new Date(progress.lastSaved);
      
      // Only restore if less than 30 minutes ago
      if (now - lastSaved < 30 * 60 * 1000) {
        this.timer.timeLeft = progress.timeLeft;
        this.timer.totalTime = progress.totalTime;
        this.timer.mode = progress.mode;
        this.timer.completedSessions = progress.completedSessions;
        this.updateTimerDisplay();
        
        showSnackbar('Timer progress restored from previous session');
      }
    }
  }

  // Enhanced timer sounds
  playTimerSound(type) {
    if (!this.data.settings.sounds) return;
    
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    let frequency, duration;
    switch (type) {
      case 'start':
        frequency = 800;
        duration = 0.2;
        break;
      case 'complete':
        frequency = 1000;
        duration = 0.5;
        // Play three ascending notes
        setTimeout(() => this.playBeep(audioContext, 1200, 0.3), 200);
        setTimeout(() => this.playBeep(audioContext, 1400, 0.3), 400);
        break;
      case 'break-end':
        frequency = 600;
        duration = 0.3;
        break;
      default:
        frequency = 440;
        duration = 0.2;
    }
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  playBeep(audioContext, frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }

  // Daily goal tracking
  checkDailyGoal() {
    if (this.timer.completedSessions >= this.timer.dailyGoal) {
      showSnackbar('🎉 Congratulations! You\'ve reached your daily goal!', {
        text: 'View Stats',
        callback: () => this.switchTab('analytics')
      });
    }
  }

  updateSessionProgress() {
    const progress = (this.timer.completedSessions / this.timer.dailyGoal) * 100;
    const progressElement = document.getElementById('sessionProgress');
    if (progressElement) {
      progressElement.style.width = `${Math.min(progress, 100)}%`;
    }
    
    const sessionText = document.getElementById('sessionCount');
    if (sessionText) {
      sessionText.textContent = `${this.timer.completedSessions}/${this.timer.dailyGoal} sessions today`;
    }
  }

  getTodayFocusTime() {
    const today = new Date().toISOString().split('T')[0];
    return this.data.stats.dailyStats[today]?.focusTime || 0;
  }

  trackFocusTime(minutes) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.stats.dailyStats[today]) {
      this.data.stats.dailyStats[today] = { focusTime: 0, sessions: 0, cardsReviewed: 0 };
    }
    this.data.stats.dailyStats[today].focusTime += minutes;
    this.data.stats.dailyStats[today].sessions++;
    this.data.stats.totalFocusTime += minutes;
    this.data.stats.totalSessions++;
    this.saveData();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timer.timeLeft / 60);
    const seconds = this.timer.timeLeft % 60;
    const timeText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timerTime').textContent = timeText;
    document.getElementById('timerLabel').textContent = this.timer.mode === 'focus' ? 'Focus Time' : 'Break Time';
    
    // Update progress circle
    const progress = ((this.timer.totalTime - this.timer.timeLeft) / this.timer.totalTime) * 565.48;
    document.getElementById('timerProgress').style.strokeDashoffset = 565.48 - progress;
  }

  updateTimerControls() {
    const startBtn = document.getElementById('startTimer');
    const pauseBtn = document.getElementById('pauseTimer');
    
    if (this.timer.isRunning) {
      startBtn.style.display = 'none';
      pauseBtn.style.display = 'inline-flex';
    } else {
      startBtn.style.display = 'inline-flex';
      pauseBtn.style.display = 'none';
      startBtn.textContent = this.timer.isPaused ? '▶️ Resume' : '▶️ Start';
    }
  }

  updateTimerSettings() {
    document.getElementById('focusTimeSlider').value = this.data.settings.focusTime;
    document.getElementById('focusTimeValue').textContent = this.data.settings.focusTime;
    document.getElementById('breakTimeSlider').value = this.data.settings.breakTime;
    document.getElementById('breakTimeValue').textContent = this.data.settings.breakTime;
    
    this.updateSessionStats();
  }

  updateSessionStats() {
    const today = new Date().toDateString();
    const todayStats = this.data.stats.dailyStats[today] || { sessions: 0, focusTime: 0 };
    
    document.getElementById('completedSessions').textContent = todayStats.sessions || 0;
    document.getElementById('totalFocusTime').textContent = Math.round((todayStats.focusTime || 0) / 60);
  }

  // Smart Study Recommendations Engine
  generateStudyRecommendations() {
    const recommendations = [];
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Check for overdue cards
    const overdueCards = this.data.cards.filter(card => {
      const nextReview = new Date(card.nextReview);
      return nextReview <= now;
    });
    
    if (overdueCards.length > 0) {
      recommendations.push({
        type: 'urgent',
        title: `${overdueCards.length} cards need review`,
        description: 'These cards are overdue for review. Reviewing them now will help maintain your learning progress.',
        action: 'Start Review',
        callback: () => this.startReview()
      });
    }
    
    // Check for struggling cards (low retention rate)
    const strugglingCards = this.data.cards.filter(card => 
      card.retentionRate && card.retentionRate < 0.7 && card.reviewCount > 3
    );
    
    if (strugglingCards.length > 0) {
      recommendations.push({
        type: 'warning',
        title: `${strugglingCards.length} cards need extra attention`,
        description: 'These cards have low retention rates. Consider creating additional notes or breaking them into smaller concepts.',
        action: 'Review Difficult Cards',
        callback: () => this.reviewDifficultCards()
      });
    }
    
    // Check daily study streak
    const streakData = this.calculateStudyStreak();
    if (streakData.streak > 7) {
      recommendations.push({
        type: 'success',
        title: `Amazing! ${streakData.streak} day study streak! 🔥`,
        description: 'Keep up the excellent work! Consistency is key to long-term learning success.',
        action: 'View Progress',
        callback: () => this.switchTab('analytics')
      });
    }
    
    // Check if user should take a break
    const todayFocusTime = this.getTodayFocusTime();
    if (todayFocusTime > 240) { // More than 4 hours
      recommendations.push({
        type: 'info',
        title: 'Consider taking a longer break',
        description: `You've studied for ${Math.floor(todayFocusTime / 60)} hours today. Great job! Consider taking a longer break to avoid burnout.`,
        action: 'Set Reminder',
        callback: () => this.setBreakReminder()
      });
    }
    
    // Suggest creating notes for new concepts
    const recentCards = this.data.cards.filter(card => {
      const created = new Date(card.created);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return created > weekAgo && (!card.lastReviewed || card.reviewCount < 3);
    });
    
    if (recentCards.length > 5) {
      recommendations.push({
        type: 'tip',
        title: 'Consider creating summary notes',
        description: `You've added ${recentCards.length} new cards recently. Creating summary notes can help reinforce these concepts.`,
        action: 'Create Note',
        callback: () => {
          this.switchTab('notes');
          this.createNewNote();
        }
      });
    }
    
    return recommendations;
  }

  reviewDifficultCards() {
    const difficultCards = this.data.cards.filter(card => 
      card.retentionRate && card.retentionRate < 0.7 && card.reviewCount > 3
    );
    
    if (difficultCards.length === 0) {
      showSnackbar('No difficult cards found!');
      return;
    }
    
    this.reviewCards = difficultCards;
    this.currentCardIndex = 0;
    this.switchTab('flashcards');
    this.showReviewInterface();
    this.displayCurrentCard();
    
    showSnackbar(`Starting focused review of ${difficultCards.length} difficult cards`);
  }

  // Enhanced Analytics
  generateDetailedAnalytics() {
    const analytics = {
      overview: this.getOverviewStats(),
      performance: this.getPerformanceStats(),
      patterns: this.getStudyPatterns(),
      predictions: this.getPredictions()
    };
    
    return analytics;
  }

  getOverviewStats() {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisWeek = this.getWeekDates(now);
    const thisMonth = now.getMonth();
    
    return {
      totalCards: this.data.cards.length,
      totalNotes: this.data.notes.length,
      studyStreak: this.calculateStudyStreak().streak,
      todayFocusTime: this.getTodayFocusTime(),
      weeklyFocusTime: this.getWeeklyFocusTime(thisWeek),
      monthlyFocusTime: this.getMonthlyFocusTime(thisMonth),
      averageSessionLength: this.getAverageSessionLength()
    };
  }

  getPerformanceStats() {
    const cardStats = this.data.cards.map(card => ({
      retention: card.retentionRate || 1.0,
      interval: card.interval,
      reviewCount: card.reviewCount,
      easeFactor: card.easeFactor
    }));
    
    const avgRetention = cardStats.reduce((sum, card) => sum + card.retention, 0) / cardStats.length || 0;
    const avgInterval = cardStats.reduce((sum, card) => sum + card.interval, 0) / cardStats.length || 0;
    
    return {
      averageRetention: avgRetention,
      averageInterval: avgInterval,
      masteredCards: this.data.cards.filter(card => card.interval > 30).length,
      learningCards: this.data.cards.filter(card => card.interval <= 30 && card.reviewCount > 0).length,
      newCards: this.data.cards.filter(card => card.reviewCount === 0).length
    };
  }

  getStudyPatterns() {
    const dailyStats = this.data.stats.dailyStats;
    const patterns = {
      bestStudyDays: [],
      bestStudyTimes: [],
      consistencyScore: 0
    };
    
    // Analyze study days
    const dayTotals = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    Object.entries(dailyStats).forEach(([date, stats]) => {
      const dayOfWeek = new Date(date).getDay();
      dayTotals[dayOfWeek] += stats.focusTime;
    });
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    patterns.bestStudyDays = Object.entries(dayTotals)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day, time]) => ({ day: dayNames[day], totalTime: time }));
    
    // Calculate consistency score
    const last30Days = this.getLast30DaysStats();
    const studyDays = last30Days.filter(day => day.focusTime > 0).length;
    patterns.consistencyScore = (studyDays / 30) * 100;
    
    return patterns;
  }

  getPredictions() {
    const predictions = {};
    
    // Predict completion time for current deck
    const overdueCards = this.data.cards.filter(card => {
      const nextReview = new Date(card.nextReview);
      return nextReview <= new Date();
    });
    
    const avgReviewTime = 30; // seconds per card
    predictions.reviewTimeEstimate = Math.ceil((overdueCards.length * avgReviewTime) / 60);
    
    // Predict study streak
    const currentStreak = this.calculateStudyStreak().streak;
    const todayStudied = this.getTodayFocusTime() > 0;
    predictions.streakRisk = currentStreak > 0 && !todayStudied ? 'high' : 'low';
    
    return predictions;
  }

  // Helper methods for analytics
  getWeekDates(date) {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day.toISOString().split('T')[0]);
    }
    
    return week;
  }

  getWeeklyFocusTime(weekDates) {
    return weekDates.reduce((total, date) => {
      return total + (this.data.stats.dailyStats[date]?.focusTime || 0);
    }, 0);
  }

  getMonthlyFocusTime(month) {
    return Object.entries(this.data.stats.dailyStats)
      .filter(([date]) => new Date(date).getMonth() === month)
      .reduce((total, [, stats]) => total + stats.focusTime, 0);
  }

  getLast30DaysStats() {
    const now = new Date();
    const stats = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      stats.push(this.data.stats.dailyStats[dateStr] || { focusTime: 0, sessions: 0, cardsReviewed: 0 });
    }
    
    return stats;
  }

  getAverageSessionLength() {
    const sessions = this.data.stats.totalSessions;
    const totalTime = this.data.stats.totalFocusTime;
    return sessions > 0 ? Math.round(totalTime / sessions) : 0;
  }

  setBreakReminder() {
    if ('Notification' in window) {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          setTimeout(() => {
            new Notification('Study Break Reminder', {
              body: 'Remember to take a longer break to avoid burnout!',
              icon: '/study-icon.svg'
            });
          }, 30 * 60 * 1000); // 30 minutes
          
          showSnackbar('Break reminder set for 30 minutes');
        }
      });
    }
  }

  // Data Management
  saveData() {
    this.safeSaveToStorage('studyapp_cards', this.data.cards);
    this.safeSaveToStorage('studyapp_notes', this.data.notes);
    this.safeSaveToStorage('studyapp_subjects', this.data.subjects);
    this.safeSaveToStorage('studyapp_decks', this.data.decks);
    this.safeSaveToStorage('studyapp_stats', this.data.stats);
    this.safeSaveToStorage('studyapp_settings', this.data.settings);
  }

  // Safe localStorage methods
  safeParseJSON(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      console.warn('Error parsing JSON from localStorage:', error);
      return null;
    }
  }

  safeSaveToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.warn('Error saving to localStorage:', error);
      // Could implement fallback storage or show user notification
    }
  }

  // Utility functions
  truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  getTextContent(html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || div.innerText || '';
  }

  // Stats Management
  updateStats(type, value = 1) {
    const today = new Date().toDateString();
    
    if (!this.data.stats.dailyStats[today]) {
      this.data.stats.dailyStats[today] = { cardsReviewed: 0, focusTime: 0, sessions: 0 };
    }
    
    const todayStats = this.data.stats.dailyStats[today];
    
    switch (type) {
      case 'cardReviewed':
        todayStats.cardsReviewed++;
        break;
      case 'focusSession':
        todayStats.sessions++;
        todayStats.focusTime += value * 60; // Convert minutes to seconds
        this.data.stats.totalSessions++;
        this.data.stats.totalFocusTime += value * 60;
        break;
    }
    
    // Update study streak
    if (todayStats.cardsReviewed > 0 || todayStats.sessions > 0) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      
      if (this.data.stats.lastStudyDate === yesterdayString || !this.data.stats.lastStudyDate) {
        if (this.data.stats.lastStudyDate !== today) {
          this.data.stats.studyStreak++;
        }
      } else {
        this.data.stats.studyStreak = 1;
      }
      
      this.data.stats.lastStudyDate = today;
    }
    
    this.saveData();
  }

  // Subject and Topic Management
  renderSubjects() {
    const subjectSelect = document.getElementById('subjectSelect');
    const noteSubjectSelect = document.getElementById('noteSubject');
    const cardSubjectSelect = document.getElementById('cardSubject');
    const cardSubjectFilter = document.getElementById('cardSubjectFilter');
    
    const subjectOptions = `
      <option value="">All Subjects</option>
      ${this.data.subjects.map(subject => 
        `<option value="${subject.id}">${subject.name}</option>`
      ).join('')}
    `;

    const noteSubjectOptions = `
      <option value="">Select Subject</option>
      ${this.data.subjects.map(subject => 
        `<option value="${subject.id}">${subject.name}</option>`
      ).join('')}
    `;

    if (subjectSelect) {
      subjectSelect.innerHTML = subjectOptions;
    }

    if (noteSubjectSelect) {
      noteSubjectSelect.innerHTML = noteSubjectOptions;
    }

    if (cardSubjectSelect) {
      cardSubjectSelect.innerHTML = noteSubjectOptions;
    }

    if (cardSubjectFilter) {
      cardSubjectFilter.innerHTML = subjectOptions;
    }

    // Update subject review buttons
    this.renderSubjectReviewButtons();
  }

  renderSubjectReviewButtons() {
    const container = document.getElementById('subjectReviewButtons');
    if (!container) return;

    const subjectsWithCards = this.data.subjects.filter(subject => {
      return this.data.cards.some(card => card.subjectId === subject.id);
    });

    if (subjectsWithCards.length === 0) {
      container.innerHTML = '<p class="empty-state">No subjects with cards yet.</p>';
      return;
    }

    container.innerHTML = subjectsWithCards.map(subject => {
      const subjectCards = this.data.cards.filter(card => card.subjectId === subject.id);
      const overdueCards = subjectCards.filter(card => {
        const nextReview = new Date(card.nextReview);
        return nextReview <= new Date();
      });

      return `
        <div class="subject-review-card" style="--subject-color: ${subject.color}">
          <div class="subject-review-header">
            <span class="subject-color-dot" style="background: ${subject.color}"></span>
            <h4>${subject.name}</h4>
          </div>
          <div class="subject-review-stats">
            <span class="stat-item">
              <span class="stat-value">${subjectCards.length}</span>
              <span class="stat-label">Total Cards</span>
            </span>
            <span class="stat-item ${overdueCards.length > 0 ? 'urgent' : ''}">
              <span class="stat-value">${overdueCards.length}</span>
              <span class="stat-label">Due Now</span>
            </span>
          </div>
          <div class="subject-review-actions">
            <button class="btn small secondary" onclick="studyApp.filterCardsBySubject('${subject.id}')">
              View Cards
            </button>
            ${overdueCards.length > 0 ? `
              <button class="btn small primary review-subject-btn" data-subject-id="${subject.id}">
                Review Now
              </button>
            ` : `
              <button class="btn small disabled" disabled>
                No Cards Due
              </button>
            `}
          </div>
        </div>
      `;
    }).join('');

    // Re-attach event listeners for new buttons
    container.querySelectorAll('.review-subject-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const subjectId = e.target.dataset.subjectId;
        this.startReviewBySubject(subjectId);
      });
    });
  }

  openSubjectModal() {
    const modal = document.getElementById('subjectModal');
    modal.classList.add('active');
    this.renderSubjectsList();
  }

  closeSubjectModal() {
    document.getElementById('subjectModal').classList.remove('active');
    document.getElementById('subjectName').value = '';
    document.getElementById('subjectColor').value = '#6366f1';
  }

  addSubject() {
    const name = document.getElementById('subjectName').value.trim();
    const color = document.getElementById('subjectColor').value;

    if (!name) {
      alert('Please enter a subject name.');
      return;
    }

    const subject = {
      id: Date.now().toString(),
      name,
      color,
      topics: [],
      created: new Date().toISOString()
    };

    this.data.subjects.push(subject);
    this.saveData();
    this.renderSubjects();
    this.renderSubjectsList();
    
    // Clear form
    document.getElementById('subjectName').value = '';
    document.getElementById('subjectColor').value = '#6366f1';
  }

  renderSubjectsList() {
    const subjectsList = document.getElementById('subjectsList');
    
    if (this.data.subjects.length === 0) {
      subjectsList.innerHTML = '<p class="empty-state">No subjects yet.</p>';
      return;
    }

    subjectsList.innerHTML = this.data.subjects.map(subject => `
      <div class="subject-item">
        <div class="subject-info">
          <div class="subject-color-indicator" style="background: ${subject.color};"></div>
          <div class="subject-details">
            <h5>${subject.name}</h5>
            <p>${subject.topics.length} topics</p>
          </div>
        </div>
        <div class="subject-actions">
          <button class="btn small secondary" onclick="studyApp.editSubject('${subject.id}')">Edit</button>
          <button class="btn small danger" onclick="studyApp.deleteSubject('${subject.id}')">Delete</button>
        </div>
      </div>
    `).join('');
  }

  deleteSubject(subjectId) {
    if (confirm('Are you sure you want to delete this subject? All notes in this subject will lose their subject association.')) {
      this.data.subjects = this.data.subjects.filter(s => s.id !== subjectId);
      
      // Remove subject from notes
      this.data.notes.forEach(note => {
        if (note.subjectId === subjectId) {
          delete note.subjectId;
          delete note.topicId;
        }
      });
      
      this.saveData();
      this.renderSubjects();
      this.renderSubjectsList();
      this.renderNotes();
    }
  }

  openTopicModal(subjectId = null) {
    this.currentSubjectForTopic = subjectId || document.getElementById('subjectSelect').value;
    
    if (!this.currentSubjectForTopic) {
      alert('Please select a subject first.');
      return;
    }

    const modal = document.getElementById('topicModal');
    const title = document.getElementById('topicModalTitle');
    const subject = this.data.subjects.find(s => s.id === this.currentSubjectForTopic);
    
    title.textContent = `Add Topic to ${subject.name}`;
    modal.classList.add('active');
    
    document.getElementById('topicName').focus();
  }

  closeTopicModal() {
    document.getElementById('topicModal').classList.remove('active');
    document.getElementById('topicName').value = '';
    document.getElementById('topicDescription').value = '';
    this.currentSubjectForTopic = null;
  }

  saveTopic() {
    const name = document.getElementById('topicName').value.trim();
    const description = document.getElementById('topicDescription').value.trim();

    if (!name) {
      alert('Please enter a topic name.');
      return;
    }

    const subject = this.data.subjects.find(s => s.id === this.currentSubjectForTopic);
    if (!subject) return;

    const topic = {
      id: Date.now().toString(),
      name,
      description,
      created: new Date().toISOString()
    };

    subject.topics.push(topic);
    this.saveData();
    this.updateTopicsForSubject(this.currentSubjectForTopic);
    this.renderSubjectsList();
    this.closeTopicModal();
  }

  updateTopicsForSubject(subjectId) {
    const topicSelect = document.getElementById('topicSelect');
    const notTopicSelect = document.getElementById('noteTopic');
    const topicSelector = document.querySelector('.topic-selector');
    
    const subject = this.data.subjects.find(s => s.id === subjectId);
    
    if (!subject || subject.topics.length === 0) {
      if (topicSelector) topicSelector.style.display = 'none';
      return;
    }

    if (topicSelector) topicSelector.style.display = 'block';

    // Update filter dropdown
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">All Topics</option>';
      subject.topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.name;
        topicSelect.appendChild(option);
      });
    }

    // Update note editor dropdown
    if (notTopicSelect) {
      notTopicSelect.innerHTML = '<option value="">Select Topic</option>';
      subject.topics.forEach(topic => {
        const option = document.createElement('option');
        option.value = topic.id;
        option.textContent = topic.name;
        notTopicSelect.appendChild(option);
      });
    }
  }

  updateTopicsForNote(subjectId) {
    this.updateTopicsForSubject(subjectId);
  }

  filterNotesBySubject(subjectId) {
    this.currentSubjectFilter = subjectId;
    this.updateTopicsForSubject(subjectId);
    this.renderNotes();
  }

  filterNotesByTopic(topicId) {
    this.currentTopicFilter = topicId;
    this.renderNotes();
  }

  // Card Import/Export functionality
  exportCards() {
    const dataToExport = {
      cards: this.data.cards,
      decks: this.data.decks,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flashcards-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSnackbar('Cards exported successfully!');
  }

  importCards() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importData = JSON.parse(event.target.result);
          
          if (!importData.cards || !Array.isArray(importData.cards)) {
            throw new Error('Invalid file format');
          }
          
          // Merge imported cards with existing ones
          const importedCount = importData.cards.length;
          importData.cards.forEach(card => {
            // Generate new ID to avoid conflicts
            card.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
            card.imported = new Date().toISOString();
          });
          
          this.data.cards.push(...importData.cards);
          this.saveData();
          this.renderCards();
          this.updateDashboard();
          
          showSnackbar(`Successfully imported ${importedCount} cards!`);
        } catch (error) {
          showSnackbar('Error importing file. Please check the file format.');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  // Bulk card operations
  bulkDeleteCards(cardIds) {
    if (!confirm(`Are you sure you want to delete ${cardIds.length} cards? This cannot be undone.`)) {
      return;
    }
    
    this.data.cards = this.data.cards.filter(card => !cardIds.includes(card.id));
    this.saveData();
    this.renderCards();
    this.updateDashboard();
    
    showSnackbar(`Deleted ${cardIds.length} cards successfully!`);
  }

  // Advanced card search and filtering
  searchCards(query, options = {}) {
    const { tags, deck, difficulty, lastReviewedBefore, lastReviewedAfter } = options;
    
    return this.data.cards.filter(card => {
      // Text search
      if (query) {
        const searchText = query.toLowerCase();
        const matchesText = card.front.toLowerCase().includes(searchText) || 
                           card.back.toLowerCase().includes(searchText) ||
                           (card.tags && card.tags.some(tag => tag.toLowerCase().includes(searchText)));
        if (!matchesText) return false;
      }
      
      // Tag filter
      if (tags && tags.length > 0) {
        const hasMatchingTag = tags.some(tag => card.tags && card.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      // Deck filter
      if (deck && card.deck !== deck) {
        return false;
      }
      
      // Date filters
      if (lastReviewedBefore) {
        const cardDate = new Date(card.lastReviewed || card.created);
        if (cardDate >= new Date(lastReviewedBefore)) return false;
      }
      
      if (lastReviewedAfter) {
        const cardDate = new Date(card.lastReviewed || card.created);
        if (cardDate <= new Date(lastReviewedAfter)) return false;
      }
      
      return true;
    });
  }

  // Keyboard Shortcuts System
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Only handle shortcuts when not typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.contentEditable === 'true') {
        return;
      }

      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case '1':
            e.preventDefault();
            this.switchTab('dashboard');
            break;
          case '2':
            e.preventDefault();
            this.switchTab('flashcards');
            break;
          case '3':
            e.preventDefault();
            this.switchTab('notes');
            break;
          case '4':
            e.preventDefault();
            this.switchTab('timer');
            break;
          case '5':
            e.preventDefault();
            this.switchTab('analytics');
            break;
          case 'n':
            e.preventDefault();
            if (this.currentTab === 'flashcards') {
              this.openCardModal();
            } else if (this.currentTab === 'notes') {
              this.createNewNote();
            }
            break;
          case 's':
            e.preventDefault();
            if (this.currentTab === 'notes' && this.currentNote) {
              this.saveCurrentNote();
            }
            break;
          case 'f':
            e.preventDefault();
            this.focusSearch();
            break;
        }
      }

      // Review shortcuts (when in review mode)
      if (this.reviewCards.length > 0 && this.currentCardIndex < this.reviewCards.length) {
        switch (e.key) {
          case ' ':
          case 'Enter':
            e.preventDefault();
            this.flipCard();
            break;
          case '1':
            e.preventDefault();
            this.rateCard(1); // Hard
            break;
          case '2':
            e.preventDefault();
            this.rateCard(2); // Good
            break;
          case '3':
            e.preventDefault();
            this.rateCard(3); // Easy
            break;
        }
      }

      // Timer shortcuts
      if (this.currentTab === 'timer') {
        switch (e.key) {
          case ' ':
            e.preventDefault();
            if (this.timer.isRunning) {
              this.pauseTimer();
            } else {
              this.startTimer();
            }
            break;
          case 'r':
            e.preventDefault();
            this.resetTimer();
            break;
        }
      }
    });

    // Show keyboard shortcuts help
    this.showKeyboardShortcuts();
  }

  showKeyboardShortcuts() {
    // Create floating help panel
    const helpPanel = document.createElement('div');
    helpPanel.className = 'keyboard-shortcuts-help';
    helpPanel.innerHTML = `
      <div class="shortcuts-content">
        <h3>Keyboard Shortcuts</h3>
        <div class="shortcut-group">
          <h4>Navigation</h4>
          <div class="shortcut"><kbd>Ctrl</kbd> + <kbd>1-5</kbd> Switch tabs</div>
          <div class="shortcut"><kbd>Ctrl</kbd> + <kbd>N</kbd> New item</div>
          <div class="shortcut"><kbd>Ctrl</kbd> + <kbd>S</kbd> Save note</div>
          <div class="shortcut"><kbd>Ctrl</kbd> + <kbd>F</kbd> Focus search</div>
        </div>
        <div class="shortcut-group">
          <h4>Review Mode</h4>
          <div class="shortcut"><kbd>Space</kbd> / <kbd>Enter</kbd> Flip card</div>
          <div class="shortcut"><kbd>1</kbd> Hard</div>
          <div class="shortcut"><kbd>2</kbd> Good</div>
          <div class="shortcut"><kbd>3</kbd> Easy</div>
        </div>
        <div class="shortcut-group">
          <h4>Timer</h4>
          <div class="shortcut"><kbd>Space</kbd> Start/Pause</div>
          <div class="shortcut"><kbd>R</kbd> Reset</div>
        </div>
      </div>
    `;
    
    // Add to body temporarily for one-time display
    document.body.appendChild(helpPanel);
    setTimeout(() => {
      helpPanel.style.opacity = '1';
      setTimeout(() => {
        helpPanel.style.opacity = '0';
        setTimeout(() => helpPanel.remove(), 300);
      }, 3000);
    }, 100);
  }

  focusSearch() {
    const searchInput = document.getElementById('noteSearch') || 
                       document.querySelector('input[type="search"]') ||
                       document.querySelector('.search-input');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  // Enhanced Note Features
  enhanceNoteEditor() {
    const editor = document.getElementById('noteContent');
    if (!editor) return;

    // Add auto-save functionality
    let autoSaveTimeout;
    editor.addEventListener('input', () => {
      clearTimeout(autoSaveTimeout);
      autoSaveTimeout = setTimeout(() => {
        this.autoSaveNote();
      }, 2000); // Auto-save after 2 seconds of inactivity
    });

    // Add markdown shortcuts
    editor.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.wrapSelection('**');
            break;
          case 'i':
            e.preventDefault();
            this.wrapSelection('*');
            break;
          case 'k':
            e.preventDefault();
            this.insertLink();
            break;
        }
      }

      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        editor.value = editor.value.substring(0, start) + '    ' + editor.value.substring(end);
        editor.selectionStart = editor.selectionEnd = start + 4;
      }
    });

    // Add word count
    this.updateWordCount(editor);
    editor.addEventListener('input', () => this.updateWordCount(editor));
  }

  wrapSelection(wrapper) {
    const editor = document.getElementById('noteContent');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    
    const newText = wrapper + selectedText + wrapper;
    editor.value = editor.value.substring(0, start) + newText + editor.value.substring(end);
    
    // Restore selection
    editor.selectionStart = start + wrapper.length;
    editor.selectionEnd = end + wrapper.length;
    editor.focus();
  }

  insertLink() {
    const url = prompt('Enter URL:');
    if (url) {
      const text = prompt('Enter link text:', url);
      const linkText = `[${text || url}](${url})`;
      
      const editor = document.getElementById('noteContent');
      const start = editor.selectionStart;
      editor.value = editor.value.substring(0, start) + linkText + editor.value.substring(editor.selectionEnd);
      editor.selectionStart = editor.selectionEnd = start + linkText.length;
      editor.focus();
    }
  }

  updateWordCount(editor) {
    const words = editor.value.trim().split(/\s+/).filter(word => word.length > 0).length;
    const chars = editor.value.length;
    
    let countElement = document.getElementById('wordCount');
    if (!countElement) {
      countElement = document.createElement('div');
      countElement.id = 'wordCount';
      countElement.className = 'word-count';
      editor.parentNode.appendChild(countElement);
    }
    
    countElement.textContent = `${words} words, ${chars} characters`;
  }

  autoSaveNote() {
    if (this.currentNote) {
      const title = document.getElementById('noteTitle').value;
      const content = document.getElementById('noteContent').value;
      
      this.currentNote.title = title || 'Untitled Note';
      this.currentNote.content = content;
      this.currentNote.lastModified = new Date().toISOString();
      
      this.saveData();
      
      // Show subtle auto-save indicator
      this.showAutoSaveIndicator();
    }
  }

  showAutoSaveIndicator() {
    let indicator = document.getElementById('autoSaveIndicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'autoSaveIndicator';
      indicator.className = 'auto-save-indicator';
      indicator.textContent = 'Auto-saved';
      document.body.appendChild(indicator);
    }
    
    indicator.style.opacity = '1';
    setTimeout(() => {
      indicator.style.opacity = '0';
    }, 2000);
  }

  // Note templates
  createNoteFromTemplate(templateType) {
    const templates = {
      'cornell': {
        title: 'Cornell Notes - [Topic]',
        content: `# Cornell Notes

**Date:** ${new Date().toLocaleDateString()}
**Subject:** 
**Topic:** 

## Notes
[Main notes go here]

## Cues/Questions
- 
- 
- 

## Summary
[Write a summary of the key points]`
      },
      'outline': {
        title: 'Outline - [Topic]',
        content: `# [Topic] Outline

## I. Main Point
   A. Supporting detail
   B. Supporting detail
      1. Sub-detail
      2. Sub-detail

## II. Main Point
   A. Supporting detail
   B. Supporting detail

## III. Main Point
   A. Supporting detail
   B. Supporting detail`
      },
      'qa': {
        title: 'Q&A - [Topic]',
        content: `# Questions & Answers - [Topic]

**Date:** ${new Date().toLocaleDateString()}

## Question 1
**Q:** 
**A:** 

## Question 2
**Q:** 
**A:** 

## Question 3
**Q:** 
**A:** `
      }
    };

    const template = templates[templateType];
    if (template) {
      const note = {
        id: Date.now().toString(),
        title: template.title,
        content: template.content,
        subjectId: '',
        topicId: '',
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        template: templateType
      };

      this.data.notes.unshift(note);
      this.currentNote = note;
      this.renderNotes();
      this.showNoteEditor();
      this.saveData();
    }
  }

  displayStudyRecommendations() {
    const recommendations = this.generateStudyRecommendations();
    const container = document.getElementById('recommendationsContainer');
    
    if (!container || recommendations.length === 0) return;
    
    container.innerHTML = recommendations.map(rec => `
      <div class="recommendation-card ${rec.type}">
        <div class="recommendation-content">
          <h4>${rec.title}</h4>
          <p>${rec.description}</p>
        </div>
        <button class="btn secondary recommendation-action" data-recommendation="${rec.title}">
          ${rec.action}
        </button>
      </div>
    `).join('');
    
    // Add click handlers for recommendation actions
    container.querySelectorAll('.recommendation-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const title = e.target.dataset.recommendation;
        const recommendation = recommendations.find(r => r.title === title);
        if (recommendation && recommendation.callback) {
          recommendation.callback();
        }
      });
    });
  }

  // Card filtering by subject
  filterCardsBySubject(subjectId) {
    this.currentCardSubjectFilter = subjectId;
    this.renderCards();
    this.updateCardStats();
  }

  updateCardStats() {
    const filteredCards = this.currentCardSubjectFilter ? 
      this.data.cards.filter(card => card.subjectId === this.currentCardSubjectFilter) :
      this.data.cards;
    
    const overdueCards = filteredCards.filter(card => {
      const nextReview = new Date(card.nextReview);
      return nextReview <= new Date();
    });

    const statsElement = document.getElementById('cardStats');
    if (statsElement) {
      statsElement.innerHTML = `
        <div class="stat-item">
          <span class="stat-label">Total Cards:</span>
          <span class="stat-value">${filteredCards.length}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Due for Review:</span>
          <span class="stat-value ${overdueCards.length > 0 ? 'urgent' : ''}">${overdueCards.length}</span>
        </div>
      `;
    }
  }

  // Enhanced review functionality to support subject filtering
  startReviewBySubject(subjectId = null) {
    let cardsToReview = this.getCardsForReview();
    
    if (subjectId) {
      cardsToReview = cardsToReview.filter(card => card.subjectId === subjectId);
      const subject = this.data.subjects.find(s => s.id === subjectId);
      if (cardsToReview.length === 0) {
        showSnackbar(`No cards due for review in ${subject ? subject.name : 'this subject'}!`);
        return;
      }
    }
    
    if (cardsToReview.length === 0) {
      showSnackbar('No cards are due for review right now!');
      return;
    }

    this.reviewCards = cardsToReview;
    this.currentCardIndex = 0;
    this.showReviewInterface();
    this.displayCurrentCard();
    
    if (subjectId) {
      const subject = this.data.subjects.find(s => s.id === subjectId);
      showSnackbar(`Starting review of ${cardsToReview.length} cards from ${subject ? subject.name : 'selected subject'}`);
    }
  }

  // ...existing code...
}

// Request notification permission
if ('Notification' in window && Notification.permission === 'default') {
  Notification.requestPermission();
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.studyApp = new StudyApp();
  initializeRippleEffects();
});

// Register service worker for offline functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = import.meta.env.BASE_URL + 'sw.js';
    navigator.serviceWorker.register(swPath)
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
