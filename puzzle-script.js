// Puzzle page functionality
let puzzleTimer = null;
let timeRemaining = 60; // 1 minute in seconds
let canSubmitAnswer = false;
let hasAttemptedAnswer = false;

document.addEventListener("DOMContentLoaded", function () {
    // Get puzzle number from URL parameters or filename
    const urlParams = new URLSearchParams(window.location.search);
    let puzzleNumber = urlParams.get("puzzle");

    // If no URL parameter, extract from filename (e.g., puzzle2.html -> 2)
    if (!puzzleNumber) {
        const filename = window.location.pathname.split("/").pop();
        const match = filename.match(/puzzle(\d+)\.html/);
        puzzleNumber = match ? match[1] : "1";
    }

    // Update puzzle number in the page
    document.getElementById("puzzle-number").textContent = puzzleNumber;
    document.getElementById("puzzle-number-desc").textContent = puzzleNumber;

    // Update page title
    document.title = `Puzzle ${puzzleNumber} - Alvin Puzzle Hunt`;

    // Check if puzzle is already completed
    checkPuzzleCompletion(puzzleNumber);

    // Add some puzzle-specific content based on number
    updatePuzzleContent(puzzleNumber);

    // Display attempted answers for this puzzle
    displayAttemptedAnswers(puzzleNumber);

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

// Simple MD5 implementation for answer hashing
function md5(string) {
    function rotateLeft(value, amount) {
        return (value << amount) | (value >>> (32 - amount));
    }

    function addUnsigned(x, y) {
        const x8 = x & 0x80000000;
        const y8 = y & 0x80000000;
        const x4 = x & 0x40000000;
        const y4 = y & 0x40000000;
        const result = (x & 0x3fffffff) + (y & 0x3fffffff);
        if (x4 & y4) {
            return result ^ 0x80000000 ^ x8 ^ y8;
        }
        if (x4 | y4) {
            if (result & 0x40000000) {
                return result ^ 0xc0000000 ^ x8 ^ y8;
            } else {
                return result ^ 0x40000000 ^ x8 ^ y8;
            }
        } else {
            return result ^ x8 ^ y8;
        }
    }

    function cmn(q, a, b, x, s, t) {
        a = addUnsigned(a, addUnsigned(addUnsigned(q, x), t));
        return addUnsigned(rotateLeft(a, s), b);
    }

    function ff(a, b, c, d, x, s, t) {
        return cmn((b & c) | (~b & d), a, b, x, s, t);
    }

    function gg(a, b, c, d, x, s, t) {
        return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }

    function hh(a, b, c, d, x, s, t) {
        return cmn(b ^ c ^ d, a, b, x, s, t);
    }

    function ii(a, b, c, d, x, s, t) {
        return cmn(c ^ (b | ~d), a, b, x, s, t);
    }

    function convertToWordArray(string) {
        let lWordCount;
        const lMessageLength = string.length;
        const lNumberOfWords_temp1 = lMessageLength + 8;
        const lNumberOfWords_temp2 =
            (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        const lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        const lWordArray = new Array(lNumberOfWords - 1);
        let lBytePosition = 0;
        let lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] =
                lWordArray[lWordCount] |
                (string.charCodeAt(lByteCount) << lBytePosition);
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] =
            lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function wordToHex(lValue) {
        let wordToHexValue = "";
        let wordToHexValue_temp = "";
        let lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            wordToHexValue_temp = "0" + lByte.toString(16);
            wordToHexValue =
                wordToHexValue +
                wordToHexValue_temp.substr(wordToHexValue_temp.length - 2, 2);
        }
        return wordToHexValue;
    }

    function utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        let utftext = "";
        for (let n = 0; n < string.length; n++) {
            const c = string.charCodeAt(n);
            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if (c > 127 && c < 2048) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }
        }
        return utftext;
    }

    let x = convertToWordArray(utf8Encode(string));
    let a = 0x67452301;
    let b = 0xefcdab89;
    let c = 0x98badcfe;
    let d = 0x10325476;

    for (let k = 0; k < x.length; k += 16) {
        const AA = a,
            BB = b,
            CC = c,
            DD = d;
        a = ff(a, b, c, d, x[k + 0], 7, 0xd76aa478);
        d = ff(d, a, b, c, x[k + 1], 12, 0xe8c7b756);
        c = ff(c, d, a, b, x[k + 2], 17, 0x242070db);
        b = ff(b, c, d, a, x[k + 3], 22, 0xc1bdceee);
        a = ff(a, b, c, d, x[k + 4], 7, 0xf57c0faf);
        d = ff(d, a, b, c, x[k + 5], 12, 0x4787c62a);
        c = ff(c, d, a, b, x[k + 6], 17, 0xa8304613);
        b = ff(b, c, d, a, x[k + 7], 22, 0xfd469501);
        a = ff(a, b, c, d, x[k + 8], 7, 0x698098d8);
        d = ff(d, a, b, c, x[k + 9], 12, 0x8b44f7af);
        c = ff(c, d, a, b, x[k + 10], 17, 0xffff5bb1);
        b = ff(b, c, d, a, x[k + 11], 22, 0x895cd7be);
        a = ff(a, b, c, d, x[k + 12], 7, 0x6b901122);
        d = ff(d, a, b, c, x[k + 13], 12, 0xfd987193);
        c = ff(c, d, a, b, x[k + 14], 17, 0xa679438e);
        b = ff(b, c, d, a, x[k + 15], 22, 0x49b40821);
        a = gg(a, b, c, d, x[k + 1], 5, 0xf61e2562);
        d = gg(d, a, b, c, x[k + 6], 9, 0xc040b340);
        c = gg(c, d, a, b, x[k + 11], 14, 0x265e5a51);
        b = gg(b, c, d, a, x[k + 0], 20, 0xe9b6c7aa);
        a = gg(a, b, c, d, x[k + 5], 5, 0xd62f105d);
        d = gg(d, a, b, c, x[k + 10], 9, 0x2441453);
        c = gg(c, d, a, b, x[k + 15], 14, 0xd8a1e681);
        b = gg(b, c, d, a, x[k + 4], 20, 0xe7d3fbc8);
        a = gg(a, b, c, d, x[k + 9], 5, 0x21e1cde6);
        d = gg(d, a, b, c, x[k + 14], 9, 0xc33707d6);
        c = gg(c, d, a, b, x[k + 3], 14, 0xf4d50d87);
        b = gg(b, c, d, a, x[k + 8], 20, 0x455a14ed);
        a = gg(a, b, c, d, x[k + 13], 5, 0xa9e3e905);
        d = gg(d, a, b, c, x[k + 2], 9, 0xfcefa3f8);
        c = gg(c, d, a, b, x[k + 7], 14, 0x676f02d9);
        b = gg(b, c, d, a, x[k + 12], 20, 0x8d2a4c8a);
        a = hh(a, b, c, d, x[k + 5], 4, 0xfffa3942);
        d = hh(d, a, b, c, x[k + 8], 11, 0x8771f681);
        c = hh(c, d, a, b, x[k + 11], 16, 0x6d9d6122);
        b = hh(b, c, d, a, x[k + 14], 23, 0xfde5380c);
        a = hh(a, b, c, d, x[k + 1], 4, 0xa4beea44);
        d = hh(d, a, b, c, x[k + 4], 11, 0x4bdecfa9);
        c = hh(c, d, a, b, x[k + 7], 16, 0xf6bb4b60);
        b = hh(b, c, d, a, x[k + 10], 23, 0xbebfbc70);
        a = hh(a, b, c, d, x[k + 13], 4, 0x289b7ec6);
        d = hh(d, a, b, c, x[k + 0], 11, 0xeaa127fa);
        c = hh(c, d, a, b, x[k + 3], 16, 0xd4ef3085);
        b = hh(b, c, d, a, x[k + 6], 23, 0x4881d05);
        a = hh(a, b, c, d, x[k + 9], 4, 0xd9d4d039);
        d = hh(d, a, b, c, x[k + 12], 11, 0xe6db99e5);
        c = hh(c, d, a, b, x[k + 15], 16, 0x1fa27cf8);
        b = hh(b, c, d, a, x[k + 2], 23, 0xc4ac5665);
        a = ii(a, b, c, d, x[k + 0], 6, 0xf4292244);
        d = ii(d, a, b, c, x[k + 7], 10, 0x432aff97);
        c = ii(c, d, a, b, x[k + 14], 15, 0xab9423a7);
        b = ii(b, c, d, a, x[k + 5], 21, 0xfc93a039);
        a = ii(a, b, c, d, x[k + 12], 6, 0x655b59c3);
        d = ii(d, a, b, c, x[k + 3], 10, 0x8f0ccc92);
        c = ii(c, d, a, b, x[k + 10], 15, 0xffeff47d);
        b = ii(b, c, d, a, x[k + 1], 21, 0x85845dd1);
        a = ii(a, b, c, d, x[k + 8], 6, 0x6fa87e4f);
        d = ii(d, a, b, c, x[k + 15], 10, 0xfe2ce6e0);
        c = ii(c, d, a, b, x[k + 6], 15, 0xa3014314);
        b = ii(b, c, d, a, x[k + 13], 21, 0x4e0811a1);
        a = ii(a, b, c, d, x[k + 4], 6, 0xf7537e82);
        d = ii(d, a, b, c, x[k + 11], 10, 0xbd3af235);
        c = ii(c, d, a, b, x[k + 2], 15, 0x2ad7d2bb);
        b = ii(b, c, d, a, x[k + 9], 21, 0xeb86d391);
        a = addUnsigned(a, AA);
        b = addUnsigned(b, BB);
        c = addUnsigned(c, CC);
        d = addUnsigned(d, DD);
    }

    const temp = wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d);
    return temp.toLowerCase();
}

function getObfuscatedAnswers() {
    // Obfuscated answer data using MD5 hashes - much harder to reverse engineer
    const obfuscatedData = {
        1: ["86cb4c737e69de20350dc7e97416f5fe"],
        2: ["3168e6a60e8535eb3385afe8ff5748ce"],
        3: ["9e3669d19b675bd57058fd4664205d2a"],
        4: ["5828d49f807e44f7ec77eccf7dd18a2f"],
        5: ["3899dcbab79f92af727c2190bbd8abc5"],
        6: ["2db95e8e1a9267b7a1188556b2013b33"],
        7: ["e8984b9da2f51f375a80360246755854"],
        8: [
            "54418875ec249dd4b51d368ae3f9dcef",
            "34369ad7f7d08ecb1dbdfa62e3f074aa",
        ],
        9: ["17148f97de14ffbe039390235f42c7c7"],
        10: [
            "34369ad7f7d08ecb1dbdfa62e3f074aa",
            "54418875ec249dd4b51d368ae3f9dcef",
        ],
        11: ["8b61c11eb8baedd53d2e99d1a01fa7bb"],
        12: [
            "c8d56be998c94089ea6e1147dc9253c1",
            "77ebd2a487ca41185d7991aabd4184a6",
        ],
        13: [
            "016ce905e31a675cd81b052d2acb5c57",
            "5bc3c1d52024c150581c7651627304b7",
            "77fcf3f9314d619c752f9cb035916b02",
            "919c8b643b7133116b02fc0d9bb7df3f",
        ],
        14: ["88667e8b8a59a6d33c3ca93a12277cd7"],
        15: ["32318894778e7864e4d9bdbe52172217"],
    };

    const answers = {
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
        12: ["stop trying that hard"],
        13: ["bro bro bro bro bro bro"],
        14: ["just solve the puzzles bro"],
        15: ["meta meta meta"],
    };

    // Return the obfuscated data directly - we'll hash user input and compare
    console.log("getObfuscatedAnswers called, returning obfuscated data");
    return obfuscatedData;
}

// Local storage functions
function getCompletedPuzzles() {
    const completed = localStorage.getItem("completedPuzzles");
    return completed ? JSON.parse(completed) : [];
}

function getAttemptedAnswers() {
    const attempted = localStorage.getItem("attemptedAnswers");
    return attempted ? JSON.parse(attempted) : {};
}

function saveAttemptedAnswer(puzzleNumber, answer) {
    const attempted = getAttemptedAnswers();
    const puzzleKey = puzzleNumber.toString();

    if (!attempted[puzzleKey]) {
        attempted[puzzleKey] = [];
    }

    // Add the answer if it's not already in the list
    if (!attempted[puzzleKey].includes(answer)) {
        attempted[puzzleKey].push(answer);
        localStorage.setItem("attemptedAnswers", JSON.stringify(attempted));
    }
}

function clearAttemptedAnswers() {
    localStorage.removeItem("attemptedAnswers");
}

// Make functions globally accessible for debugging
window.clearAttemptedAnswers = clearAttemptedAnswers;
window.getAttemptedAnswers = getAttemptedAnswers;

function displayAttemptedAnswers(puzzleNumber) {
    const attempted = getAttemptedAnswers();
    const puzzleKey = puzzleNumber.toString();
    const answers = attempted[puzzleKey] || [];

    if (answers.length === 0) {
        return;
    }

    // Find or create the attempted answers container - make it puzzle-specific
    let container = document.querySelector(
        `.attempted-answers-container[data-puzzle="${puzzleNumber}"]`
    );
    if (!container) {
        container = document.createElement("div");
        container.className = "attempted-answers-container";
        container.setAttribute("data-puzzle", puzzleNumber);
        container.innerHTML = `
            <h3>Previous Attempts</h3>
            <div class="attempted-answers-list"></div>
        `;

        // Insert after the puzzle description
        const puzzleDescription = document.querySelector(".puzzle-description");
        if (puzzleDescription) {
            puzzleDescription.parentNode.insertBefore(
                container,
                puzzleDescription.nextSibling
            );
        }
    }

    const answersList = container.querySelector(".attempted-answers-list");
    answersList.innerHTML = answers
        .map((answer) => `<span class="attempted-answer">"${answer}"</span>`)
        .join(", ");
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
        // Check if all puzzles are completed
        const completedPuzzles = getCompletedPuzzles();
        if (completedPuzzles.length >= 15) {
            showAllCompletedScreen();
        } else {
            showCompletionScreen(puzzleNumber);
        }
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
    console.log("initializePuzzleWithoutTimer called for puzzle", puzzleNumber);
    // Check if there's a saved timer state
    const savedState = getTimerState(puzzleNumber);

    if (savedState) {
        console.log("Found saved timer state:", savedState);
        // Calculate elapsed time since last save
        const elapsed = Math.floor((Date.now() - savedState.timestamp) / 1000);
        timeRemaining = Math.max(0, savedState.timeRemaining - elapsed);
        canSubmitAnswer = savedState.canSubmit || timeRemaining <= 0;
        hasAttemptedAnswer = savedState.hasAttempted || false;
    } else {
        console.log("No saved timer state, starting fresh");
        // Start fresh - no timer yet
        timeRemaining = 60;
        canSubmitAnswer = true; // Allow submission initially
        hasAttemptedAnswer = false;
    }

    // Add timer display to the page
    console.log("Calling addTimerDisplay");
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
            messageElement.style.color = "#000000";
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
            messageElement.style.color = "#000000";
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
        messageElement.style.color = "#000000";
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
    console.log("addTimerDisplay called");
    const submitButton = document.querySelector(".submit-btn");
    console.log("Found submit button:", submitButton);
    const existingTimer = document.querySelector(".timer-container");
    console.log("Existing timer container:", existingTimer);

    if (submitButton && !existingTimer) {
        console.log("Creating timer container");
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
        // Insert timer container directly after the submit button
        submitButton.parentNode.insertBefore(
            timerContainer,
            submitButton.nextSibling
        );
        console.log("Timer container added after submit button");
    } else {
        console.log(
            "Timer container not added - submitButton:",
            !!submitButton,
            "existingTimer:",
            !!existingTimer
        );
    }
}

function updateTimerDisplay() {
    const countdownElement = document.getElementById("timer-countdown");
    const messageElement = document.getElementById("timer-message");

    if (countdownElement) {
        if (!hasAttemptedAnswer) {
            // Show "Ready" state before timer starts
            countdownElement.textContent = "Ready";
            countdownElement.style.color = "#000000";
            countdownElement.style.fontWeight = "normal";
        } else {
            // Show countdown when timer is running
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            countdownElement.textContent = `${minutes}:${seconds
                .toString()
                .padStart(2, "0")}`;

            // Keep all timer text black
            countdownElement.style.color = "#000000";
            countdownElement.style.fontWeight = "normal";
        }
    }

    if (messageElement && timeRemaining <= 0 && hasAttemptedAnswer) {
        messageElement.textContent =
            "Timer expired! You can now submit your answer.";
        messageElement.style.color = "#000000";
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

    // If puzzle-box doesn't exist (individual puzzle pages), skip content update
    if (!puzzleBox) {
        console.log("No .puzzle-box element found, skipping content update");
        return;
    }
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
            title: "Master Challenge 3",
            content:
                "Find the connection between all the puzzle numbers and their corresponding sections.",
            hint: "Look at the mathematical relationships between puzzle numbers and section numbers.",
        },
        13: {
            title: "Master Challenge 2",
            content: "Decode this advanced cipher: ZKHUH LV WKH DQVZHU",
            hint: "This uses a different shift than the previous cipher. Try Caesar cipher with different keys.",
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
    const obfuscatedData = getObfuscatedAnswers();

    // Misleading variable names to confuse code inspectors
    const userInput = answer;
    const puzzleId = puzzleNumber;
    const validationResults = obfuscatedData;

    console.log("Puzzle number:", puzzleNumber, "Type:", typeof puzzleNumber);
    console.log("Obfuscated data object:", obfuscatedData);

    // Convert puzzle number to string to match the object keys
    const puzzleKey = puzzleNumber.toString();
    console.log("Puzzle key:", puzzleKey);
    const correctHashes = obfuscatedData[puzzleKey] || [];
    console.log(`Puzzle ${puzzleNumber} correct hashes:`, correctHashes);
    console.log(`User answer: "${answer}"`);

    // Save the attempted answer
    saveAttemptedAnswer(puzzleNumber, answer);

    // Hash the user's input and compare against stored hashes
    const userAnswerHash = md5(answer.toLowerCase().trim());
    console.log(`User answer hash: "${userAnswerHash}"`);

    const isCorrect = correctHashes.includes(userAnswerHash);
    console.log(`Hash comparison result: ${isCorrect}`);

    console.log(
        `Puzzle ${puzzleNumber}: Answer "${answer}" is correct: ${isCorrect}`
    );

    // Refresh the attempted answers display
    displayAttemptedAnswers(puzzleNumber);

    if (isCorrect) {
        // Clear timer state for this puzzle
        clearTimerState(puzzleNumber);

        // Mark puzzle as completed (even if already completed)
        markPuzzleCompleted(puzzleNumber);

        // Check if all 15 puzzles are now completed
        const completedPuzzles = getCompletedPuzzles();
        if (completedPuzzles.length >= 15) {
            // All puzzles completed - show the final celebration screen
            showAllCompletedScreen();
        } else {
            // Show success screen (even if already completed)
            showSuccessScreen(puzzleNumber, answer);
        }
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
        timerMessage.style.color = "white";
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
        window.location.href = `puzzle${nextPuzzle}.html`;
    } else if (nextPuzzle === 15) {
        // Puzzle 14 completed - go to meta puzzle
        window.location.href = `puzzle15.html`;
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
            <div class="all-completed-icon">🎂</div>
            <h2>All Puzzles Completed!</h2>
            <g class="all-completed-message">Thank you all for playing the Alvin Puzzle Hunt! Once again, Happy Birthday Alvin!</p>
            <div class="final-stats">
                <p>🎯 Perfect Score: 15/15</p>
                <p>🧩 Big Brain Unlocked!</p>
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
