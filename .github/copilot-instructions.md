<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# StudyPro - Advanced Study App

This is a modern web-based study application built with Vite and vanilla JavaScript. The app features:

## Core Features
- **Spaced Repetition Flashcards**: Smart algorithm for optimal review timing
- **Rich Note-Taking**: Advanced editor with formatting capabilities  
- **Pomodoro Timer**: Customizable focus/break sessions with progress tracking
- **Study Analytics**: Comprehensive progress tracking and data visualization
- **Dark/Light Themes**: User preference support
- **Progressive Web App**: Offline capability with service worker

## Architecture
- **Frontend**: Vanilla JavaScript ES6+ with modules
- **Styling**: CSS3 with custom properties for theming
- **Build Tool**: Vite for fast development and optimized production builds
- **Storage**: localStorage for client-side data persistence
- **Charts**: Canvas-based visualizations for analytics
- **PWA**: Service worker for offline functionality

## Code Guidelines
- Use modern JavaScript features (ES6+, async/await, destructuring)
- Follow the existing class-based architecture for the main StudyApp class
- Maintain consistent naming conventions (camelCase for variables/functions)
- Use CSS custom properties for theming and consistent design
- Ensure responsive design for mobile/tablet compatibility
- Implement proper error handling and user feedback
- Keep localStorage data structure consistent
- Follow the existing modal/tab switching patterns

## Key Files
- `src/main.js`: Main application logic and state management
- `src/style.css`: All styling with CSS custom properties
- `index.html`: Main HTML structure with semantic markup
- `vite.config.js`: Build configuration optimized for GitHub Pages
- `public/manifest.json`: PWA configuration
- `public/sw.js`: Service worker for offline functionality

## Development Notes
- The app uses a single-page application pattern with tab-based navigation
- All data is stored locally using localStorage with JSON serialization
- The spaced repetition algorithm is implemented using interval-based scheduling
- Charts are drawn using HTML5 Canvas for performance
- The timer uses setInterval with proper cleanup on pause/reset
- Theme switching is handled via CSS custom properties and data attributes
