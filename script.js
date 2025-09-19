// Add interactive functionality to buttons
document.addEventListener("DOMContentLoaded", function () {
    // Check and display progress
    updateProgressDisplay();

    // Get all buttons
    const buttons = document.querySelectorAll(".btn");

    // Add click event listeners to all buttons
    buttons.forEach((button, index) => {
        button.addEventListener("click", function () {
            // Add a click animation
            this.style.transform = "scale(0.95)";
            setTimeout(() => {
                this.style.transform = "";
            }, 150);

            // Navigate to puzzle page
            const buttonText = this.textContent;
            // Extract puzzle number, handling both "Puzzle X" and "✅ Puzzle X" formats
            const puzzleNumber = buttonText.replace(/[^\d]/g, "");
            window.location.href = `puzzle${puzzleNumber}.html`;
        });

        // Add hover sound effect (optional)
        button.addEventListener("mouseenter", function () {
            this.style.transform = "translateY(-3px)";
        });

        button.addEventListener("mouseleave", function () {
            this.style.transform = "";
        });
    });

    // Add smooth scrolling for better UX
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute("href")).scrollIntoView({
                behavior: "smooth",
            });
        });
    });

    // Add a subtle animation on page load
    const sections = document.querySelectorAll(".section");
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                }
            });
        },
        { threshold: 0.1 }
    );

    sections.forEach((section) => {
        section.style.opacity = "0";
        section.style.transform = "translateY(30px)";
        section.style.transition = "opacity 0.6s ease, transform 0.6s ease";
        observer.observe(section);
    });
});

// Progress tracking functions
function getCompletedPuzzles() {
    const completed = localStorage.getItem("completedPuzzles");
    return completed ? JSON.parse(completed) : [];
}

function updateProgressDisplay() {
    const completed = getCompletedPuzzles();
    const totalPuzzles = 14;
    const completedCount = completed.length;

    // Update header with progress
    const header = document.querySelector("header p");
    if (header) {
        header.innerHTML = `Welcome to the ultimate puzzle adventure!<br><strong>Progress: ${completedCount}/${totalPuzzles} puzzles completed</strong>`;
    }

    // Add progress bar to header
    addProgressBar(completedCount, totalPuzzles);

    // Update button styles based on completion status
    updateButtonStyles(completed);
}

function addProgressBar(completed, total) {
    const header = document.querySelector("header");
    if (header && !document.querySelector(".progress-bar-container")) {
        const progressContainer = document.createElement("div");
        progressContainer.className = "progress-bar-container";
        progressContainer.innerHTML = `
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${
                    (completed / total) * 100
                }%"></div>
            </div>
            <p class="progress-text">${completed} of ${total} puzzles completed</p>
        `;
        header.appendChild(progressContainer);
    }
}

function updateButtonStyles(completed) {
    const buttons = document.querySelectorAll(".btn");
    buttons.forEach((button, index) => {
        const puzzleNumber = (index + 1).toString();
        if (completed.includes(puzzleNumber)) {
            button.classList.add("completed");
            button.innerHTML = `✅ Puzzle ${puzzleNumber}`;
        }
    });
}
