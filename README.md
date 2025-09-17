# Alvin Puzzle Hunt 🧩

A modern, responsive landing page for an interactive puzzle hunt experience. Built with vanilla HTML, CSS, and JavaScript, and ready for deployment on Vercel.

## 🚀 Quick Start

### Prerequisites
- Node.js (for Vercel CLI)
- A modern web browser

### Local Development

1. **Clone or download this repository**
   ```bash
   git clone <your-repo-url>
   cd alvin-puzzle-hunt
   ```

2. **Start a local development server**
   
   **Option A: Python (if you have Python installed)**
   ```bash
   python3 -m http.server 8000
   ```
   
   **Option B: Node.js (if you have Node.js installed)**
   ```bash
   npx serve .
   ```
   
   **Option C: Vercel CLI (recommended for Vercel deployment)**
   ```bash
   npm install -g vercel
   vercel dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:8000` (or the port shown in your terminal)

## 🌐 Live Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy from your project directory**
   ```bash
   vercel
   ```

3. **Follow the prompts**
   - Link to existing project or create new
   - Choose your Vercel account
   - Confirm deployment settings

4. **Your site will be live!**
   Vercel will provide you with a live URL like `https://your-project.vercel.app`

### Alternative Deployment Options

- **Netlify**: Drag and drop the project folder to Netlify
- **GitHub Pages**: Push to GitHub and enable Pages in repository settings
- **Any static hosting service**: Upload the files to any web server

## 📁 Project Structure

```
alvin-puzzle-hunt/
├── index.html          # Main HTML file
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
├── package.json        # Node.js dependencies and scripts
├── vercel.json         # Vercel deployment configuration
└── README.md           # This file
```

## 🎨 Features

### Landing Page Sections
- **Section 1**: 5 buttons (Level 1 - Getting Started)
- **Section 2**: 5 buttons (Level 2 - Intermediate Challenges)  
- **Section 3**: 4 buttons (Level 3 - Master Puzzles)

### Design Features
- ✨ Modern gradient background with glassmorphism effects
- 📱 Fully responsive design (mobile, tablet, desktop)
- 🎭 Smooth animations and hover effects
- 🎯 Interactive buttons with click feedback
- 🎨 Professional typography and spacing
- ♿ Accessibility-friendly color contrasts

### Interactive Elements
- Button click animations
- Hover effects with smooth transitions
- Scroll-triggered section animations
- Alert dialogs for button interactions (customizable)

## 🛠️ Customization

### Adding New Puzzles
1. **Add buttons to HTML**: Edit `index.html` to add more buttons in any section
2. **Update button functionality**: Modify `script.js` to handle new button clicks
3. **Style new elements**: Add CSS classes in `styles.css` for custom styling

### Styling Changes
- **Colors**: Modify the gradient backgrounds in `styles.css`
- **Layout**: Adjust the grid system and spacing
- **Typography**: Change fonts and text styling
- **Animations**: Customize transition effects and timing

### Adding Functionality
- **Puzzle Logic**: Replace the alert dialogs in `script.js` with actual puzzle functionality
- **Data Storage**: Add localStorage or database integration for progress tracking
- **User Authentication**: Integrate with authentication services
- **Backend API**: Connect to a backend service for dynamic content

## 🎯 Development Tips

### Testing
- Test on multiple devices and screen sizes
- Use browser developer tools to check responsive design
- Validate HTML and CSS for accessibility

### Performance
- Images are optimized for web delivery
- CSS and JavaScript are minified for production
- Static files are cached efficiently

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Progressive enhancement for older browsers

## 📝 License

MIT License - feel free to use this project for your own puzzle hunt or modify as needed!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues:
1. Check the browser console for JavaScript errors
2. Verify all files are in the correct directory
3. Ensure your local server is running properly
4. Check that all file paths are correct

---

**Happy Puzzling! 🧩✨**
