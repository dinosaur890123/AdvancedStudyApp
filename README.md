# StudyPro - Advanced Study App

A powerful, web-based study application featuring spaced repetition flashcards, note-taking, Pomodoro timer, and detailed analytics.

## ✨ Features

### 📚 Spaced Repetition Flashcards
- **Smart Review System**: Cards appear for review based on your performance
- **Customizable Decks**: Organize cards into different subjects
- **Tagging System**: Tag cards for easy organization and filtering
- **Performance Tracking**: Monitor your learning progress over time

### 📝 Advanced Note-Taking
- **Rich Text Editor**: Format your notes with bold, italic, underline, and lists
- **Search Functionality**: Quickly find notes by title or content
- **Auto-save**: Never lose your work with automatic saving
- **Organized Storage**: All notes stored locally in your browser

### ⏰ Pomodoro Timer
- **Customizable Sessions**: Adjust focus and break times to your preference
- **Visual Progress**: Beautiful circular progress indicator
- **Session Tracking**: Monitor daily focus time and completed sessions
- **Break Reminders**: Automatic break notifications

### 📊 Study Analytics
- **Daily Progress**: Track study time and card reviews over time
- **Performance Charts**: Visualize your learning performance
- **Study Streaks**: Maintain motivation with streak tracking
- **Success Metrics**: Monitor cards mastered and success rates

### 🎨 Modern Interface
- **Dark/Light Theme**: Switch between themes for comfortable studying
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- **Intuitive Navigation**: Easy-to-use tabbed interface
- **Smooth Animations**: Polished user experience

### 🔄 Offline Capability
- **Progressive Web App**: Install on your device like a native app
- **Local Storage**: All data stored locally for privacy and offline access
- **Service Worker**: Cached resources for fast loading

## 🚀 Quick Start

### Option 1: Use Online (Recommended)
Visit the live app at: `https://yourusername.github.io/AdvancedStudyapp/`

### Option 2: Run Locally
1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser

### Option 3: Deploy to GitHub Pages
1. Push this code to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Set source to "GitHub Actions"
4. Run the deploy command:
   ```bash
   npm run deploy
   ```

## 🎯 How to Use

### Getting Started
1. **Dashboard**: View your daily progress and quick actions
2. **Add Cards**: Create flashcards with questions and answers
3. **Review**: Study cards with the spaced repetition system
4. **Take Notes**: Create and organize study notes
5. **Focus Sessions**: Use the Pomodoro timer for concentrated study
6. **Track Progress**: Monitor your learning in the Analytics tab

### Spaced Repetition System
- **Easy**: Card will appear again in 4+ days
- **Good**: Card will appear again in 2-3 days  
- **Hard**: Card will appear again in 1 day or less

The algorithm adapts to your performance, showing difficult cards more frequently.

### Study Tips
1. **Daily Review**: Aim to review cards daily for best retention
2. **Focus Sessions**: Use 25-minute focus blocks with 5-minute breaks
3. **Note-Taking**: Summarize key concepts in your own words
4. **Consistency**: Maintain your study streak for better habits

## 💾 Data Storage

All your data is stored locally in your browser using localStorage:
- **Flashcards**: Questions, answers, review history
- **Notes**: Content and metadata
- **Statistics**: Study time, streaks, performance metrics
- **Settings**: Theme preferences, timer settings

Your data remains private and accessible offline.

## 🛠 Technical Details

### Built With
- **Vite**: Fast build tool and development server
- **Vanilla JavaScript**: No framework dependencies for maximum performance
- **CSS3**: Modern styling with CSS custom properties
- **Chart.js**: Beautiful data visualizations
- **Service Worker**: Offline functionality and caching

### Browser Compatibility
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### File Structure
```
AdvancedStudyapp/
├── public/
│   ├── manifest.json      # PWA manifest
│   ├── sw.js             # Service worker
│   └── study-icon.svg    # App icon
├── src/
│   ├── main.js           # Application logic
│   └── style.css         # Styles
├── index.html            # Main HTML file
├── package.json          # Dependencies
└── vite.config.js        # Build configuration
```

## 🔧 Customization

### Themes
Modify CSS custom properties in `src/style.css` to customize colors:
```css
:root {
  --primary-color: #6366f1;    /* Main brand color */
  --accent-color: #10b981;     /* Success/positive actions */
  --danger-color: #ef4444;     /* Delete/negative actions */
}
```

### Timer Settings
Default timer settings can be modified in `src/main.js`:
```javascript
settings: {
  focusTime: 25,    // Focus session minutes
  breakTime: 5,     // Break session minutes
}
```

## 📱 Mobile Installation

### iOS (Safari)
1. Open the app in Safari
2. Tap the Share button
3. Tap "Add to Home Screen"

### Android (Chrome)
1. Open the app in Chrome
2. Tap the menu (three dots)
3. Tap "Add to Home Screen"

## 🤝 Contributing

Feel free to submit issues, feature requests, or pull requests to improve the app!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Spaced repetition algorithm inspired by Anki and SuperMemo
- Icons and design patterns following modern web standards
- Built with performance and accessibility in mind

---

**Happy Studying! 📚✨**

Start your learning journey today and experience the power of spaced repetition combined with modern study tools.
