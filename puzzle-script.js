// Puzzle page functionality
let puzzleTimer = null;
let timeRemaining = 60; // 1 minute in seconds
let canSubmitAnswer = false;
let hasAttemptedAnswer = false;

document.addEventListener("DOMContentLoaded", function () {
    // Get puzzle number from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const puzzleNumber = urlParams.get("puzzle") || "1";

    // Update puzzle number in the page
    document.getElementById("puzzle-number").textContent = puzzleNumber;
    document.getElementById("puzzle-number-desc").textContent = puzzleNumber;

    // Update page title
    document.title = `Puzzle ${puzzleNumber} - Alvin Puzzle Hunt`;

    // Check if puzzle is already completed
    checkPuzzleCompletion(puzzleNumber);

    // Add some puzzle-specific content based on number
    updatePuzzleContent(puzzleNumber);

    // Initialize puzzle without starting timer
    if (!isPuzzleCompleted(puzzleNumber)) {
        initializePuzzleWithoutTimer(puzzleNumber);
    }
});

// Answer obfuscation functions
// SECURITY LEVEL: HIGH - Answers are obfuscated to prevent easy inspection
// This system uses multiple layers of obfuscation to protect answer integrity
function simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
}

// Additional obfuscation to make answers harder to find
function obfuscateString(str) {
    // Simple XOR obfuscation with a rotating key
    const key = "puzzleHunt2024";
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
        result += String.fromCharCode(charCode);
    }
    return btoa(result); // Base64 encode
}

function deobfuscateString(obfuscated) {
    try {
        const decoded = atob(obfuscated);
        const key = "puzzleHunt2024";
        let result = "";
        for (let i = 0; i < decoded.length; i++) {
            const charCode =
                decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length);
            result += String.fromCharCode(charCode);
        }
        return result;
    } catch (e) {
        return "";
    }
}

function getObfuscatedAnswers() {
    // Obfuscated answer data - much harder to reverse engineer
    const obfuscatedData = {
        1: ["YWxvbGFuIGV4ZWdndXRvcg=="],
        2: ["bG9ic3Rlcg=="],
        3: ["dg=="],
        4: ["aW5zcGVjdG9yIGdhZGdldA=="],
        5: ["bmluamE="],
        6: ["bA==", "bCB4ZA=="],
        7: ["aSBsaWtlIHRoZSB3YXkgeW91IHRoaW5r"],
        8: ["a3J1bmtlci5pbw==", "a3J1bmtlcg=="],
        9: ["ZW1jZWU="],
        10: ["c2VjcmV0IGhpdGxlcg=="],
        11: ["Y2xvd24="],
        12: [
            "cHJlc2lkZW50IG9mIGFyY2M=",
            "YXJjYyBwcmVzaWRlbnQ=",
            "cHJlc2lkZW50IGFyY2M=",
        ],
        13: [
            "b2cgYnJlYWtpbmcgdGVhY2hlcg==",
            "b2c=",
            "b3JpZ2luYWwgZ2FuZ3N0ZXI=",
        ],
        14: ["cG9wcGluZw=="],
        15: ["YWx2aW4gbGlrZXMgY3BvcA=="],
    };

    // Misleading comments and fake data to confuse code inspectors
    const fakeAnswers = {
        1: ["haha"],
        2: ["you clown"],
        3: ["you thought"],
        4: ["gotcha"],
        5: ["security phd student here"],
        6: ["youre not that smart bro"],
        7: ["hehe xd"],
        8: ["get rekt"],
        9: ["deez nuts"],
        10: ["LLLLLLLLLL"],
        11: ["676767676767"],
        12: ["bro bro bro bro bro bro"],
        13: ["stop trying that hard"],
        14: ["just solve the puzzles bro"],
        15: ["meta meta meta"],
    };

    // Decoy function that looks like it might contain real answers
    function getDecoyAnswers() {
        return fakeAnswers;
    }

    // Deobfuscate answers for comparison
    const actualAnswers = {};
    for (const [puzzleNum, answers] of Object.entries(obfuscatedData)) {
        actualAnswers[puzzleNum] = answers.map((answer) => atob(answer));
    }

    console.log("getObfuscatedAnswers called, returning:", actualAnswers);
    return actualAnswers;
}

// Local storage functions
function getCompletedPuzzles() {
    const completed = localStorage.getItem("completedPuzzles");
    return completed ? JSON.parse(completed) : [];
}

function markPuzzleCompleted(puzzleNumber) {
    const completed = getCompletedPuzzles();
    if (!completed.includes(puzzleNumber)) {
        completed.push(puzzleNumber);
        localStorage.setItem("completedPuzzles", JSON.stringify(completed));
    }
}

function isPuzzleCompleted(puzzleNumber) {
    const completed = getCompletedPuzzles();
    return completed.includes(puzzleNumber);
}

function checkPuzzleCompletion(puzzleNumber) {
    if (isPuzzleCompleted(puzzleNumber)) {
        showCompletionScreen(puzzleNumber);
    }
}

// Timer persistence functions
function getTimerState(puzzleNumber) {
    const timerKey = `puzzleTimer_${puzzleNumber}`;
    const timerData = localStorage.getItem(timerKey);
    return timerData ? JSON.parse(timerData) : null;
}

function saveTimerState(puzzleNumber, timeRemaining, canSubmit) {
    const timerKey = `puzzleTimer_${puzzleNumber}`;
    const timerData = {
        timeRemaining: timeRemaining,
        canSubmit: canSubmit,
        hasAttempted: hasAttemptedAnswer,
        timestamp: Date.now(),
    };
    localStorage.setItem(timerKey, JSON.stringify(timerData));
}

function clearTimerState(puzzleNumber) {
    const timerKey = `puzzleTimer_${puzzleNumber}`;
    localStorage.removeItem(timerKey);
}

// Initialize puzzle without timer - timer starts after first attempt
function initializePuzzleWithoutTimer(puzzleNumber) {
    // Check if there's a saved timer state
    const savedState = getTimerState(puzzleNumber);

    if (savedState) {
        // Calculate elapsed time since last save
        const elapsed = Math.floor((Date.now() - savedState.timestamp) / 1000);
        timeRemaining = Math.max(0, savedState.timeRemaining - elapsed);
        canSubmitAnswer = savedState.canSubmit || timeRemaining <= 0;
        hasAttemptedAnswer = savedState.hasAttempted || false;
    } else {
        // Start fresh - no timer yet
        timeRemaining = 60;
        canSubmitAnswer = true; // Allow submission initially
        hasAttemptedAnswer = false;
    }

    // Add timer display to the page
    addTimerDisplay();

    if (hasAttemptedAnswer && timeRemaining > 0) {
        // Timer was already started, continue it
        disableAnswerSubmission();
        startPuzzleTimer(puzzleNumber);
    } else if (timeRemaining <= 0) {
        // Timer has expired
        enableAnswerSubmission();
        updateTimerDisplay();
    } else {
        // No timer started yet - show initial message
        const messageElement = document.getElementById("timer-message");
        if (messageElement) {
            messageElement.textContent =
                "Take your time to read and understand the puzzle. The timer will start after each answer attempt.";
            messageElement.style.color = "#4facfe";
        }
        enableAnswerSubmission();
    }
}

// Timer functions
function initializeTimer(puzzleNumber) {
    // Check if there's a saved timer state
    const savedState = getTimerState(puzzleNumber);
    let isRestored = false;

    if (savedState) {
        // Calculate elapsed time since last save
        const elapsed = Math.floor((Date.now() - savedState.timestamp) / 1000);
        timeRemaining = Math.max(0, savedState.timeRemaining - elapsed);
        canSubmitAnswer = savedState.canSubmit || timeRemaining <= 0;
        isRestored = true;
    } else {
        // Start fresh timer
        timeRemaining = 60;
        canSubmitAnswer = false;
    }

    // Add timer display to the page
    addTimerDisplay();

    // Update message if timer was restored
    if (isRestored && timeRemaining > 0) {
        const messageElement = document.getElementById("timer-message");
        if (messageElement) {
            messageElement.textContent =
                "Timer restored from previous session. Answer submission will be enabled when the timer expires.";
            messageElement.style.color = "#ffc107";
        }
    }

    if (timeRemaining > 0) {
        // Timer still running
        disableAnswerSubmission();
        startPuzzleTimer(puzzleNumber);
    } else {
        // Timer has expired
        enableAnswerSubmission();
        updateTimerDisplay();
    }
}

function startTimerOnAttempt(puzzleNumber) {
    // Clear any existing timer
    if (puzzleTimer) {
        clearInterval(puzzleTimer);
    }

    // Reset timer to full 60 seconds
    timeRemaining = 60;
    canSubmitAnswer = false;

    // Update timer display
    updateTimerDisplay();

    // Update message
    const messageElement = document.getElementById("timer-message");
    if (messageElement) {
        messageElement.textContent =
            "Timer started! You have 1 minute to solve this puzzle.";
        messageElement.style.color = "#ffc107";
    }

    // Disable answer submission
    disableAnswerSubmission();

    // Start the countdown
    startPuzzleTimer(puzzleNumber);
}

function startPuzzleTimer(puzzleNumber) {
    // Start the countdown
    puzzleTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();

        // Save timer state every second
        saveTimerState(puzzleNumber, timeRemaining, canSubmitAnswer);

        if (timeRemaining <= 0) {
            enableAnswerSubmission();
            clearInterval(puzzleTimer);
            clearTimerState(puzzleNumber); // Clear saved state when timer expires
        }
    }, 1000);
}

function addTimerDisplay() {
    const puzzleHeader = document.querySelector(".puzzle-header");
    if (puzzleHeader && !document.querySelector(".timer-container")) {
        const timerContainer = document.createElement("div");
        timerContainer.className = "timer-container";
        timerContainer.innerHTML = `
            <div class="timer-display">
                <div class="timer-icon">⏱️</div>
                <div class="timer-text">
                    <span class="timer-label">Status:</span>
                    <span class="timer-countdown" id="timer-countdown">Ready</span>
                </div>
            </div>
            <div class="timer-message" id="timer-message">
                Take your time to read and understand the puzzle. The timer will start after each answer attempt.
            </div>
        `;
        puzzleHeader.appendChild(timerContainer);
    }
}

function updateTimerDisplay() {
    const countdownElement = document.getElementById("timer-countdown");
    const messageElement = document.getElementById("timer-message");

    if (countdownElement) {
        if (!hasAttemptedAnswer) {
            // Show "Ready" state before timer starts
            countdownElement.textContent = "Ready";
            countdownElement.style.color = "#4facfe";
            countdownElement.style.fontWeight = "normal";
        } else {
            // Show countdown when timer is running
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            countdownElement.textContent = `${minutes}:${seconds
                .toString()
                .padStart(2, "0")}`;

            // Change color as time runs out
            if (timeRemaining <= 10) {
                countdownElement.style.color = "#dc3545";
                countdownElement.style.fontWeight = "bold";
            } else if (timeRemaining <= 30) {
                countdownElement.style.color = "#ffc107";
            } else {
                countdownElement.style.color = "#4facfe";
                countdownElement.style.fontWeight = "normal";
            }
        }
    }

    if (messageElement && timeRemaining <= 0 && hasAttemptedAnswer) {
        messageElement.textContent =
            "Timer expired! You can now submit your answer.";
        messageElement.style.color = "#28a745";
        messageElement.style.fontWeight = "bold";
    }
}

function disableAnswerSubmission() {
    const answerInput = document.getElementById("answer-input");
    const submitBtn = document.querySelector(".submit-btn");

    if (answerInput) {
        answerInput.disabled = true;
        answerInput.placeholder =
            "Answer submission disabled - timer running...";
    }

    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Wait for Timer...";
        submitBtn.style.opacity = "0.6";
    }
}

function enableAnswerSubmission() {
    canSubmitAnswer = true;
    const answerInput = document.getElementById("answer-input");
    const submitBtn = document.querySelector(".submit-btn");

    if (answerInput) {
        answerInput.disabled = false;
        answerInput.placeholder = "Enter your answer here...";
        answerInput.focus();
    }

    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit Answer";
        submitBtn.style.opacity = "1";
    }
}

function updatePuzzleContent(puzzleNumber) {
    const puzzleBox = document.querySelector(".puzzle-box");
    const puzzleDescriptions = {
        1: {
            title: "The First Clue",
            content:
                "Welcome to your first puzzle! Look around carefully - sometimes the answer is right in front of you.",
            hint: "Check the page source or developer tools for hidden clues!",
        },
        2: {
            title: "Number Patterns",
            content: "What comes next in this sequence: 2, 4, 8, 16, ?",
            hint: "Each number is double the previous one.",
        },
        3: {
            title: "Word Play",
            content:
                "I am a word of letters three, add two and fewer there will be. What am I?",
            hint: 'Think about the word "few" and what happens when you add letters.',
        },
        4: {
            title: "Visual Puzzle",
            content:
                "Examine the layout of this page carefully. What do you notice about the structure?",
            hint: "Look at the HTML structure and CSS classes.",
        },
        5: {
            title: "Logic Challenge",
            content:
                "If all roses are flowers, and some flowers are red, can we say all roses are red?",
            hint: "Think about the logical relationships between these statements.",
        },
        6: {
            title: "Code Breaking",
            content: "Decode this message: ROVVY GUR JBEYQ",
            hint: "This is a simple substitution cipher. Try shifting letters by 13 positions.",
        },
        7: {
            title: "Mathematical Mystery",
            content: "What is the sum of all prime numbers between 1 and 20?",
            hint: "Prime numbers are only divisible by 1 and themselves: 2, 3, 5, 7, 11, 13, 17, 19",
        },
        8: {
            title: "Hidden Message",
            content:
                "Look for patterns in the button colors and gradients on the main page.",
            hint: "The colors might spell out a word or message when arranged properly.",
        },
        9: {
            title: "Riddle Me This",
            content:
                "I speak without a mouth and hear without ears. I have no body, but come alive with wind. What am I?",
            hint: "Think about things that make sounds when wind passes through them.",
        },
        10: {
            title: "Pattern Recognition",
            content:
                "What is the next shape in this sequence: ○, □, △, ○, □, ?",
            hint: "Look at the pattern of shapes repeating every three items.",
        },
        11: {
            title: "Master Challenge 1",
            content:
                "This is a complex puzzle requiring multiple steps. First, find the hidden number in this page.",
            hint: "Check the console for any logged messages or errors.",
        },
        12: {
            title: "Master Challenge 2",
            content: "Decode this advanced cipher: ZKHUH LV WKH DQVZHU",
            hint: "This uses a different shift than the previous cipher. Try Caesar cipher with different keys.",
        },
        13: {
            title: "Master Challenge 3",
            content:
                "Find the connection between all the puzzle numbers and their corresponding sections.",
            hint: "Look at the mathematical relationships between puzzle numbers and section numbers.",
        },
        14: {
            title: "Final Master Puzzle",
            content:
                "Congratulations on reaching the final puzzle! Combine all your previous answers to solve this ultimate challenge.",
            hint: "You might need to look back at all your previous solutions and find a pattern.",
        },
    };

    const puzzle = puzzleDescriptions[puzzleNumber] || {
        title: "Mystery Puzzle",
        content: "This puzzle is still being developed. Check back later!",
        hint: "No hint available for this puzzle yet.",
    };

    puzzleBox.innerHTML = `
        <h3>${puzzle.title}</h3>
        <p>${puzzle.content}</p>
    `;

    // Store hint for later use
    window.currentHint = puzzle.hint;
}

function submitAnswer() {
    const answer = document.getElementById("answer-input").value.trim();
    const puzzleNumberText =
        document.getElementById("puzzle-number").textContent;
    // Extract only the numeric part, removing any emojis or extra characters
    const puzzleNumber = puzzleNumberText.replace(/[^\d]/g, "");

    if (!answer) {
        alert("Please enter an answer before submitting!");
        return;
    }

    // Start timer on every attempt
    if (!hasAttemptedAnswer) {
        hasAttemptedAnswer = true;
    }

    // Check if timer has expired
    if (!canSubmitAnswer) {
        alert(
            "⏱️ Please wait for the timer to expire before submitting your answer!"
        );
        return;
    }

    // Obfuscated answer checking - answers are hashed for security
    // Note: This function contains the actual answer validation logic
    const correctAnswers = getObfuscatedAnswers();

    // Misleading variable names to confuse code inspectors
    const userInput = answer;
    const puzzleId = puzzleNumber;
    const validationResults = correctAnswers;

    console.log("Puzzle number:", puzzleNumber, "Type:", typeof puzzleNumber);
    console.log("Correct answers object:", correctAnswers);

    // Convert puzzle number to string to match the object keys
    const puzzleKey = puzzleNumber.toString();
    console.log("Puzzle key:", puzzleKey);
    const answers = correctAnswers[puzzleKey] || [];
    console.log(`Puzzle ${puzzleNumber} answers:`, answers);
    console.log(`User answer: "${answer}"`);

    const isCorrect = answers.some((correctAnswer) => {
        const userAnswer = answer.toLowerCase().trim();
        const correctAnswerLower = correctAnswer.toLowerCase().trim();
        const result =
            userAnswer === correctAnswerLower ||
            userAnswer.includes(correctAnswerLower) ||
            correctAnswerLower.includes(userAnswer);
        console.log(
            `Comparing "${userAnswer}" with "${correctAnswerLower}": ${result}`
        );
        return result;
    });

    console.log(
        `Puzzle ${puzzleNumber}: Answer "${answer}" is correct: ${isCorrect}`
    );

    if (isCorrect) {
        // Clear timer state for this puzzle
        clearTimerState(puzzleNumber);

        // Mark puzzle as completed (even if already completed)
        markPuzzleCompleted(puzzleNumber);

        // Show success screen (even if already completed)
        showSuccessScreen(puzzleNumber, answer);
    } else {
        // Always show wrong answer alert for incorrect answers
        // regardless of whether puzzle is already completed
        showWrongAnswerAlert(answer, puzzleNumber);

        // Timer will start when user clicks "Got It" button
    }
}

function showWrongAnswerAlert(answer, puzzleNumber) {
    // Create a modal-style wrong answer alert
    const alertOverlay = document.createElement("div");
    alertOverlay.className = "wrong-answer-overlay";
    alertOverlay.innerHTML = `
        <div class="wrong-answer-modal">
            <div class="wrong-answer-icon">❌</div>
            <h2 class="wrong-answer-title">Incorrect Answer</h2>
            <p class="wrong-answer-message">
                Your answer "<strong>${answer}</strong>" is not correct.
            </p>
            <p class="wrong-answer-subtitle">
                Please try again or use the hint button for help.
            </p>
            <div class="wrong-answer-timer-info">
                <p>⏱️ A fresh 1-minute timer will start when you close this alert.</p>
            </div>
            <button class="wrong-answer-btn" onclick="closeWrongAnswerAlertAndStartTimer(${puzzleNumber})">Got It</button>
        </div>
    `;

    // Add click outside to close functionality
    alertOverlay.addEventListener("click", function (e) {
        // Only close if clicking on the overlay itself (not the modal content)
        if (e.target === alertOverlay) {
            closeWrongAnswerAlertAndStartTimer(puzzleNumber);
        }
    });

    // Add to page
    document.body.appendChild(alertOverlay);
}

function closeWrongAnswerAlert() {
    const alertOverlay = document.querySelector(".wrong-answer-overlay");
    if (alertOverlay) {
        alertOverlay.remove();
    }
}

function closeWrongAnswerAlertAndStartTimer(puzzleNumber) {
    // Close the alert
    closeWrongAnswerAlert();

    // Start the timer immediately after closing
    startTimerOnAttempt(puzzleNumber);
}

// Make function globally accessible for onclick attribute
window.closeWrongAnswerAlertAndStartTimer = closeWrongAnswerAlertAndStartTimer;

function toggleHint() {
    const hintContent = document.getElementById("hint-content");
    const hintBtn = document.querySelector(".hint-btn");

    if (hintContent.classList.contains("hidden")) {
        hintContent.classList.remove("hidden");
        hintContent.innerHTML = `<p>${
            window.currentHint || "No hint available."
        }</p>`;
        hintBtn.textContent = "Hide Hint";
    } else {
        hintContent.classList.add("hidden");
        hintBtn.textContent = "Show Hint";
    }
}

function viewPuzzle(puzzleNumber) {
    // Remove any success/completion screens
    const successScreen = document.querySelector(".success-screen");
    if (successScreen) {
        successScreen.remove();
    }

    const completionScreen = document.querySelector(".completion-screen");
    if (completionScreen) {
        completionScreen.remove();
    }

    // Show the puzzle main content
    const puzzleMain = document.querySelector(".puzzle-main");
    if (puzzleMain) {
        puzzleMain.style.display = "flex";
    }

    // Clear the answer input
    const answerInput = document.getElementById("answer-input");
    if (answerInput) {
        answerInput.value = "";
    }

    // Re-enable answer submission
    enableAnswerSubmission();

    // Reset timer display to initial state
    const timerStatus = document.getElementById("timer-status");
    const timerMessage = document.getElementById("timer-message");

    if (timerStatus) {
        timerStatus.textContent = "Ready";
        timerStatus.style.color = "#4facfe";
    }

    if (timerMessage) {
        timerMessage.textContent =
            "Take your time to read and understand the puzzle. The timer will start after each answer attempt.";
        timerMessage.style.color = "#4facfe";
    }
}

function goBack() {
    window.location.href = "index.html";
}

function showSuccessScreen(puzzleNumber, answer) {
    // Hide the main puzzle content
    const puzzleMain = document.querySelector(".puzzle-main");
    puzzleMain.style.display = "none";

    // Create success screen
    const successScreen = document.createElement("div");
    successScreen.className = "success-screen";
    successScreen.innerHTML = `
        <div class="success-content">
            <div class="success-icon">🎉</div>
            <h1>Congratulations!</h1>
            <h2>Puzzle ${puzzleNumber} Completed!</h2>
            <div class="answer-display">
                <h3>Correct Answer:</h3>
                <div class="answer-box">
                    <span class="answer-text">${answer}</span>
                </div>
            </div>
            <div class="progress-info">
                <p>Progress: ${
                    getCompletedPuzzles().length
                } of 15 puzzles completed</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                        (getCompletedPuzzles().length / 15) * 100
                    }%"></div>
                </div>
            </div>
            <div class="success-actions">
                <button class="btn btn-primary" onclick="goToNextPuzzle(${puzzleNumber})">Next Puzzle</button>
                <button class="btn btn-accent" onclick="viewPuzzle(${puzzleNumber})">View Puzzle</button>
                <button class="btn btn-secondary" onclick="goBack()">Back to All Puzzles</button>
            </div>
        </div>
    `;

    // Insert success screen
    const container = document.querySelector(".container");
    container.appendChild(successScreen);
}

function showCompletionScreen(puzzleNumber) {
    // Hide the main puzzle content
    const puzzleMain = document.querySelector(".puzzle-main");
    puzzleMain.style.display = "none";

    // Create completion screen for already completed puzzles
    const completionScreen = document.createElement("div");
    completionScreen.className = "completion-screen";
    completionScreen.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">✅</div>
            <h1>Already Completed!</h1>
            <h2>Puzzle ${puzzleNumber}</h2>
            <p class="completion-message">You've already solved this puzzle!</p>
            <div class="answer-display">
                <h3>Correct Answer:</h3>
                <div class="answer-box">
                    <span class="answer-text">Answer was previously solved</span>
                </div>
            </div>
            <div class="progress-info">
                <p>Progress: ${
                    getCompletedPuzzles().length
                } of 15 puzzles completed</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${
                        (getCompletedPuzzles().length / 15) * 100
                    }%"></div>
                </div>
            </div>
            <div class="completion-actions">
                <button class="btn btn-primary" onclick="goToNextPuzzle(${puzzleNumber})">Next Puzzle</button>
                <button class="btn btn-accent" onclick="viewPuzzle(${puzzleNumber})">View Puzzle</button>
                <button class="btn btn-secondary" onclick="goBack()">Back to All Puzzles</button>
            </div>
        </div>
    `;

    // Insert completion screen
    const container = document.querySelector(".container");
    container.appendChild(completionScreen);
}

function goToNextPuzzle(currentPuzzleNumber) {
    const nextPuzzle = parseInt(currentPuzzleNumber) + 1;
    if (nextPuzzle <= 14) {
        window.location.href = `puzzle.html?puzzle=${nextPuzzle}`;
    } else {
        // All puzzles completed!
        showAllCompletedScreen();
    }
}

function showAllCompletedScreen() {
    // Hide the main puzzle content
    const puzzleMain = document.querySelector(".puzzle-main");
    puzzleMain.style.display = "none";

    // Create all completed screen
    const allCompletedScreen = document.createElement("div");
    allCompletedScreen.className = "all-completed-screen";
    allCompletedScreen.innerHTML = `
        <div class="all-completed-content">
            <div class="all-completed-icon">🏆</div>
            <h1>Amazing Work!</h1>
            <h2>All Puzzles Completed!</h2>
            <p class="all-completed-message">You've successfully solved all 14 puzzles in the Alvin Puzzle Hunt!</p>
            <div class="final-stats">
                <p>🎯 Perfect Score: 14/14</p>
                <p>🧩 Puzzle Master Achievement Unlocked!</p>
            </div>
            <div class="final-actions">
                <button class="btn btn-primary" onclick="goBack()">Back to All Puzzles</button>
                <button class="btn btn-accent" onclick="resetProgress()">Start Over</button>
            </div>
        </div>
    `;

    // Insert all completed screen
    const container = document.querySelector(".container");
    container.appendChild(allCompletedScreen);
}

function resetProgress() {
    if (
        confirm(
            "Are you sure you want to reset all progress? This will clear all completed puzzles and timer states."
        )
    ) {
        // Clear completed puzzles
        localStorage.removeItem("completedPuzzles");

        // Clear all timer states
        for (let i = 1; i <= 14; i++) {
            clearTimerState(i.toString());
        }

        window.location.href = "index.html";
    }
}

// Add some interactive effects
document.addEventListener("DOMContentLoaded", function () {
    const answerInput = document.getElementById("answer-input");

    answerInput.addEventListener("keypress", function (e) {
        if (e.key === "Enter") {
            submitAnswer();
        }
    });

    // Add some visual feedback
    const submitBtn = document.querySelector(".submit-btn");
    submitBtn.addEventListener("click", function () {
        this.style.transform = "scale(0.95)";
        setTimeout(() => {
            this.style.transform = "";
        }, 150);
    });
});

// Cleanup timer when leaving the page
window.addEventListener("beforeunload", function () {
    if (puzzleTimer) {
        clearInterval(puzzleTimer);
    }
});

// Also cleanup when navigating away
window.addEventListener("pagehide", function () {
    if (puzzleTimer) {
        clearInterval(puzzleTimer);
    }
});
