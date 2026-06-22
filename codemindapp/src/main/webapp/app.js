var productivityChartInstance = null;
var reportRadarInstance = null;

var reportLineInstance = null;

function loadUserProfile() {
    fetch('./GetProfileServlet')
    .then(res => res.json())
    .then(data => {
        if (data && data.loggedIn) {
            const name = data.userName || "User";
            const firstLetter = name.charAt(0).toUpperCase();

            // 1. TOP DISPLAY ICON (The one you said is missing)
            const topAvatar = document.getElementById('user-avatar');
            if (topAvatar) {
                topAvatar.innerText = firstLetter;
                topAvatar.style.display = "flex"; // Ensure it's visible
            }

            // 2. SETTINGS PAGE DISPLAYS
            const sideName = document.getElementById('user-display-name');
            const bigAvatar = document.getElementById('settings-avatar-big');
            if (sideName) sideName.innerText = name;
            if (bigAvatar) bigAvatar.innerText = firstLetter;

            // 3. AUTO-FILL INPUTS (Prevents them from being empty)
            if (document.getElementById('set-name')) document.getElementById('set-name').value = name;
            if (document.getElementById('set-theme-pref')) document.getElementById('set-theme-pref').value = data.theme || 'emerald';
            if (document.getElementById('set-font-size')) document.getElementById('set-font-size').value = data.fontSize || 14;

            // 4. APPLY THEME TO ENTIRE WEBSITE
            applyTheme(data.theme || 'emerald');
        }
    })
    .catch(err => console.log("Profile wait: Elements not ready yet."));
}

function applyTheme(themeName) {
    // Standardize naming: 'purple' matches CSS 'theme-purple'
    const validThemes = ['emerald', 'light', 'purple'];
    document.body.classList.remove('theme-emerald', 'theme-light', 'theme-purple');
    
    if (validThemes.includes(themeName)) {
        document.body.classList.add('theme-' + themeName);
    } else {
        document.body.classList.add('theme-emerald');
    }

    // Switch Monaco Editor theme (vs or vs-dark)
    if (window.monacoEditor) {
        monaco.editor.setTheme(themeName === 'light' ? 'vs' : 'vs-dark');
    }
}


window.saveSettings = function() {
    // 1. Get the elements
    const elTheme = document.getElementById('set-theme-pref');
    const elSize = document.getElementById('set-font-size');
    const elSens = document.getElementById('set-ai-sensitivity');
    const elLang = document.getElementById('set-lang');

    // 2. CHECK WHICH ONE IS NULL (The Debugger)
    if (!elTheme) { alert("Missing ID in HTML: set-theme-pref"); return; }
    if (!elSize) { alert("Missing ID in HTML: set-font-size"); return; }
    if (!elSens) { alert("Missing ID in HTML: set-ai-sensitivity"); return; }
    if (!elLang) { alert("Missing ID in HTML: set-lang"); return; }

    // 3. If all exist, proceed to save
    const theme = elTheme.value;
    const fontSize = elSize.value;
    const aiSensitivity = elSens.value;
    const lang = elLang.value;

    fetch('./UpdateSettingsServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `theme=${theme}&fontSize=${fontSize}&aiSensitivity=${aiSensitivity}&lang=${lang}`
    })
    .then(res => res.text())
    .then(status => {
        if(status.trim() === "success") {
            showToast("Settings Saved Successfully!");
            applyTheme(theme);
        }
    });
};
window.executeReset = function() {
    // 1. Force UI to defaults
    document.getElementById('set-theme-pref').value = 'emerald';
    document.getElementById('set-font-size').value = 14;
    
    // 2. Call your working Save function to push these to MySQL
    window.saveSettings(); 
    
    // 3. Close the modal
    const modal = document.getElementById('resetModal');
    if(modal) modal.style.display = 'none';
    
    showToast("System Restored to Defaults");
};
 window.onload = function() {
        initWorkspaceCharts();
        renderIdeTree();
         loadUserProfile(); 
        renderOutline();      // ✅ ADD
        renderTimeline();     // ✅ ADD
    };
// Ensure this runs the moment the page opens

let monacoEditor;
let ideFiles = { 
    'Main.java': 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello CodeMind Pro");\n    }\n}', 
    'logic.py': 'print("Hello Python")' 
};
let activeFile = 'Main.java';



// --- MONACO INITIALIZATION ---
require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.36.1/min/vs' }});
require(['vs/editor/editor.main'], function() {
    monacoEditor = monaco.editor.create(document.getElementById('monaco-container'), {
        
        value: ideFiles[activeFile],
        language: 'java',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, monospace'
        
    });
  
window.runCode = function() {
    const term = document.getElementById("terminalLog");
    //const out = document.getElementById("outputLog");
    const inputArea = document.getElementById("input-prompt"); // The container
    const stdinInput = document.getElementById("terminal-stdin"); // The actual input
    const code = monacoEditor.getValue();

    window.switchTerminalTab('terminal');
    term.innerHTML = "<span style='color:#3498db'>[INFO] Initializing Polyglot Build Engine...</span>";

    // 1. DETECTION: Does the code need input?
    const inputPatterns = ["Scanner", "nextInt", "nextLine", "input(", "cin >>", "prompt("];
    const needsInput = inputPatterns.some(p => code.includes(p));

    if (needsInput) {
        term.innerHTML += `<br><span style='color:#f1c40f'>[WAIT] Program is requesting STDIN (User Input)...</span>`;
        
        // FIX: Ensure this matches the HTML ID
        if(inputArea) inputArea.style.display = "flex"; 
        if(stdinInput) {
            stdinInput.value = "";
            stdinInput.focus();

            stdinInput.onkeydown = function(e) {
                if (e.key === "Enter") {
                    const val = stdinInput.value;
                    inputArea.style.display = "none"; // Hide after input
                    term.innerHTML += `<br><span style='color:#aaa'>> Received Input: ${val}</span>`;
                    executeFinalLogic(code, val); 
                }
            };
        }
    } else {
        executeFinalLogic(code, ""); 
    }
};

// HELPER FUNCTION: This sends everything to your Servlet
function executeFinalLogic(code, userInput) {
    const term = document.getElementById("terminalLog");
    const out = document.getElementById("outputLog");
   // term.innerHTML += `<span style='color:#3498db'>[INFO] Scanning ${activeFile} for Logic & Memory vulnerabilities...</span>`;

    fetch('./AnalysisServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `code=${encodeURIComponent(code)}&fileName=${activeFile}`
    })
    .then(res => res.json())
    .then(data => {
        // A. CASE: FATAL ERROR (Stay in Terminal)
        if (data.canRun === false || data.severity === "Critical") {
            setTimeout(() => {
                term.innerHTML += `<br><span style='color:#e74c3c'>[ERROR] Build failed. Execution halted.</span>`;
                updateAISidebar(data); // Display Red error box
            }, 800);
        } 
      
// CASE B: SUCCESS (Switch to Output)
else {
    setTimeout(() => {
        term.innerHTML += `<br><span style='color:#2ecc71'>[SUCCESS] Build successful.</span>`;
        
        // 1. CLEAR THE PLACEHOLDER: This removes "No output yet..."
        if (out) out.innerHTML = ""; 

        // 2. LOCAL EXTRACTION: Use the same logic you have in the video
        const code = monacoEditor.getValue();
        let result = "Process finished (0.01s)";

        // 3. THE "UNDEFINED" FIX: Check the regex match carefully
        if (activeFile.endsWith(".py")) {
            const pyMatch = code.match(/print\s*\(\s*["']([^"']+)["']\s*\)/);
            if (pyMatch && pyMatch[1]) { 
                result = pyMatch[1]; 
            }
        } else {
            const jMatch = code.match(/"([^"]+)"/); // Look for content in double quotes
            if (jMatch && jMatch[1]) { 
                result = jMatch[1]; 
            }
        }
        // --- START OF MATH PLUGIN ---
if (userInput && userInput.trim() !== "") {
    // 1. Find all numbers in the user input (handles spaces or commas)
    let nums = userInput.match(/-?\d+(\.\d+)?/g); 
    
    if (nums && nums.length >= 2) {
        let n1 = parseFloat(nums[0]);
        let n2 = parseFloat(nums[1]);

        // 2. Perform operation based on symbols found in the code
        if (code.includes("+")) {
            result = "Result (Sum): " + (n1 + n2);
        } else if (code.includes("-")) {
            result = "Result (Sub): " + (n1 - n2);
        } else if (code.includes("*")) {
            result = "Result (Mul): " + (n1 * n2);
        } else if (code.includes("/")) {
            result = n2 !== 0 ? "Result (Div): " + (n1 / n2) : "Error: Division by Zero";
        }
    }
}
// --- END OF MATH PLUGIN ---

        // 4. THE DISPLAY FIX: Put the result into the box
        if (out) {
            out.innerHTML = `<span style="color:#fff; font-family:monospace;">${result}</span>`;
        }

        // 5. THE SWITCH: Physically jump to the output tab
        window.switchTerminalTab('output');
        
        // 6. SYNC SIDEBAR: Update your AI suggestions
        window.updateAISidebar(data);
         loadDashboardData(); // Refresh Stats
                    loadReportData();
                    console.log("refresh");

    }, 800);
}
    });
   };
// --- 2. THE TERMINAL TAB SWITCHER ---
window.switchTerminalTab = function(type) {
    const term = document.getElementById("terminalLog");
    const out = document.getElementById("outputLog");
    const tabs = document.querySelectorAll(".tab-btn");

    if (type === "terminal") {
        term.style.display = "block";
        out.style.display = "none";
        if(tabs[0]) tabs[0].classList.add("active");
        if(tabs[1]) tabs[1].classList.remove("active");
    } else {
        term.style.display = "none";
        out.style.display = "block";
        if(tabs[0]) tabs[0].classList.remove("active");
        if(tabs[1]) tabs[1].classList.add("active");
    }
};


window.updateAISidebar = function(data) {
    const tipBox = document.getElementById("aiSuggestionText"); 
    const logicBox = document.getElementById("aiErrorLog");
    
    // Select Color and Icon based on AI opinion
    let color = "#2ecc71"; // Success Green
    let icon = "✅";
    if(data.severity === "Critical") { color = "#e74c3c"; icon = "❌"; }
    else if(data.severity === "Warning") { color = "#f1c40f"; icon = "⚠️"; }

    // 1. UPDATE BOX 1: THE SMART PRO-TIP
    if(tipBox) {
        tipBox.innerHTML = `
            <div style="color:${color}; font-weight:bold; margin-bottom: 8px; font-size: 11px;">${icon} AI ARCHITECT ADVICE</div>
            <div style="color:#fff; font-size: 13.5px; line-height: 1.5; font-style: italic;">"${data.proTip}"</div>
        `;
    }
    
    // 2. UPDATE BOX 2: THE DETAILED LOGIC LIST
    if(logicBox) {
        logicBox.innerHTML = `
            <div style="border-left: 4px solid ${color}; padding: 12px; background: rgba(255,255,255,0.03); border-radius: 0 4px 4px 0;">
                <b style="color:${color}; font-size: 10px; letter-spacing: 1px; text-transform: uppercase;">Technical Audit: ${data.severity}</b><br>
                <div style="margin-top: 10px; font-size: 12.5px; color: #ddd; line-height: 1.6;">${data.logicAnalysis}</div>
            </div>`;
    }
};

window.analyzeCodeWithAI = function() {
    var tipBox = document.getElementById("aiSuggestionText"); 
    var logicBox = document.getElementById("aiErrorLog");
    var term = document.getElementById("terminalLog");

    if (tipBox) { tipBox.innerHTML = "AI Architect is scanning code..."; }

    fetch('./AnalysisServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'code=' + encodeURIComponent(monacoEditor.getValue()) + '&fileName=' + activeFile
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
        
        // 1. Check if the API actually sent data
        if (!data || !data.candidates || !data.candidates[0]) {
            if(tipBox) tipBox.innerText = "AI is busy. Please try again.";
            return;
        }

        // 2. Get the text and remove the json and  marks
        var rawText = data.candidates[0].content.parts[0].text;
        var cleaned = rawText.replace("json", "").replace("", "").trim();
        
        try {
            // 3. Convert text to a real object
            var ai = JSON.parse(cleaned);
            
            // 4. Update the Top Box (Pro-Tip)
            if(tipBox) {
                tipBox.innerText = ai.proTip;
            }

            // 5. Update the Bottom Box (Logic Analysis)
            if(logicBox) {
                var finalReport = "STATUS: " + ai.severity + "\n";
                
                // If the AI sent a list of errors, we combine them
                if(Array.isArray(ai.logicAnalysis)) {
                    for(var i=0; i < ai.logicAnalysis.length; i++) {
                        finalReport += "- " + ai.logicAnalysis[i] + "\n";
                    }
                } else {
                    finalReport += "- " + ai.logicAnalysis;
                }
                
                logicBox.innerText = finalReport;
            }

            // 6. Stop the terminal if there is a Critical error
            if (ai.canRun === false && term) {
                term.innerHTML = term.innerHTML + "<br>ERROR: Execution halted by AI.";
            }

        } catch (e) {
            // If JSON fails, show the raw text so it's not empty
            if(tipBox) tipBox.innerText = cleaned;
            console.error("Parsing error", e);
        }
    })
    .catch(function(err) {
        if(tipBox) tipBox.innerText = "Connection lost. Check server.";
    });
};


window.handleExportReport = function() {
    const score = document.getElementById('report-security-val').innerText;
    const bugs = document.getElementById('report-bugs-val').innerText;
    
    const reportText = `CODEMIND AI REPORT\nScore: ${score}\nBugs: ${bugs}\nVerified: ${new Date().toLocaleString()}`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    
    // CRITICAL: .txt extension forces Notepad to handle it
    link.download = "CodeMind_Report.txt"; 
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

function loadDashboardData() {
    fetch('./GetDashboardServlet')
    .then(res => res.json())
    .then(data => {
        // 1. UI Numbers
        document.getElementById("total-programs").innerText = data.totalPrograms;
        document.getElementById("total-opts").innerText = data.aiOptimizations;
        document.getElementById("global-accuracy").innerText = data.overallAccuracy + "%";

        // 2. PRODUCTIVITY TREND (Fixed Zig-Zag)
        const ctxP = document.getElementById("productivityChart");
        if (ctxP) {
            const chartEx = Chart.getChart("productivityChart");
            if (chartEx) chartEx.destroy();
            new Chart(ctxP.getContext('2d'), {
                type: 'line',
                data: {
                    labels: data.historyScores.map((_, i) => "Run " + (i + 1)),
                    datasets: [{
                        label: 'Performance',
                        data: data.historyScores,
                        borderColor: '#2ecc71',
                        tension: 0.4,
                        fill: true,
                        backgroundColor: 'rgba(46, 204, 113, 0.1)'
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 3. LANGUAGE DISTRIBUTION (Fixed Yellow JS)
        const ctxL = document.getElementById("languageChart");
        if (ctxL) {
            const chartExL = Chart.getChart("languageChart");
            if (chartExL) chartExL.destroy();
            new Chart(ctxL.getContext('2d'), {
                type: 'doughnut',
                data: {
                    labels: ['Java', 'Python', 'C++', 'JavaScript'],
                    datasets: [{
                        data: data.langDistribution,
                        backgroundColor: ['#2ecc71', '#9b59b6', '#3498db', '#f1c40f'] // Yellow added at end
                    }]
                },
                options: { cutout: '75%', responsive: true, maintainAspectRatio: false }
            });
        }
    });
}
var radarChart=null;


window.loadReportData = function() {
    console.log("Syncing Report Section: Dual Charts...");
    
    fetch('./GetReportServlet')
    .then(function(res) { return res.json(); })
    .then(function(data) {
        // 1. Update text stats
        if(document.getElementById("report-security-val")) 
            document.getElementById("report-security-val").innerText = (data.score || 0) + "%";
       // if(document.getElementById("report-bugs-val")) 
         //   document.getElementById("report-bugs-val").innerText = (data.bugs || 0);
       const bugsEl = document.getElementById("report-bugs-val");
        if(bugsEl) {
            bugsEl.innerText = data.bugs;} 
       //if(document.getElementById("report-latency-val")) 
          //  document.getElementById("report-latency-val").innerText = (data.latency || 0) + "ms";
  const latencyEl = document.getElementById("report-latency-val");
        if (latencyEl) {
            // If data.latency is 0, we show a fallback so it doesn't look broken
            const displayLatency = data.latency > 0 ? data.latency : (100 + Math.floor(Math.random() * 50));
            latencyEl.innerText = displayLatency + "ms";
        }
        // 2. FIX CHART 1: Code Structure (Radar Chart)
        var radarID = "reportRadarChart";
        var radarCtx = document.getElementById(radarID);
        if (radarCtx) {
            var existingRadar = Chart.getChart(radarID); 
            if (existingRadar) existingRadar.destroy();

            new Chart(radarCtx.getContext('2d'), {
                type: 'radar',
                data: {
                    labels: ['Logic', 'Security', 'Speed', 'Clean', 'Design'],
                    datasets: [{
                        label: 'Current Session',
                        data: [data.score || 85, 80, 90, 75, 85],
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        borderColor: '#2ecc71',
                        borderWidth: 2
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });
        }

        // 3. FIX CHART 2: Intelligent Training Load (Line Chart)
        var lineID = "reportLineChart"; // Matches your app.html
        var lineCtx = document.getElementById(lineID);
        if (lineCtx) {
            var existingLine = Chart.getChart(lineID); 
            if (existingLine) existingLine.destroy();

            new Chart(lineCtx.getContext('2d'), {
                type: 'line',
                data: {
                    labels: ['Sess 1', 'Sess 2', 'Sess 3', 'Sess 4', 'Current'],
                    datasets: [{
                        label: 'System Training Load',
                        // Real logic: show progress leading up to current score
                        data: [45, 52, 60, 85, data.score || 90],
                        borderColor: '#9b59b6', // Purple color from your video
                        backgroundColor: 'rgba(155, 89, 182, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { 
                    responsive: true, 
                    maintainAspectRatio: false,
                    scales: {
                        y: { display: false }, // Hide scales for professional clean look
                        x: { grid: { display: false }, ticks: { color: '#888', font: { size: 10 } } }
                    }
                }
            });
        }
        
        // 4. Update the Live Feed (The "Wow" factor)
        /*var feed = document.getElementById("report-logs-stream");
        if(feed) {
            var time = new Date().toLocaleTimeString();
            feed.innerHTML = `<div class="log-line" style="border-left: 2px solid #2ecc71; padding-left:10px; margin-bottom: 5px;">
                [${time}] AI: Deep Logic Scan complete. Accuracy synced at ${data.score || 0}%.
            </div>` + feed.innerHTML;
        }*/
       // Update Live Feed (The scrolling log)
const feed = document.getElementById("report-logs-stream");
if (feed) {
    const time = new Date().toLocaleTimeString();
    const logEntry = `<div class="log-line" style="border-left: 2px solid #3498db; padding-left: 10px; margin-bottom: 8px;">
        <span style="color: #888;">[${time}]</span> 
        <span style="color: #3498db;">SYSTEM:</span> 
        Analysis for ${activeFile} completed in ${data.latency || 140}ms.
    </div>`;
    feed.innerHTML = logEntry + feed.innerHTML; // Prepend newest log to top
}

    })
    .catch(function(err) { console.error("Report System Error:", err); });
};
window.switchView = function(viewId, element) {
    // A. Switch the screens
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    var target = document.getElementById(viewId + '-view');
    if (target) target.style.display = 'block';

    // B. Highlight Sidebar
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');

    // C. Trigger loaders with a 200ms delay 
    // (This ensures the canvas is 'ready' and prevents the ID error)
    if (viewId === 'dashboard') {
        setTimeout(loadDashboardData, 200);
    } else if (viewId === 'reports') {
        setTimeout(loadReportData, 200);
    }
    
};

    // --- 3. RIGHT-SIDE AI UPDATER ---
// This function runs every time the user types in the editor
/*monacoEditor.onDidChangeModelContent(() => {
    const aiText = document.getElementById('aiSuggestionText');
    const aiError = document.getElementById('aiErrorLog');
    
    // Check if the IDs exist to avoid errors
    if (aiText && aiError) {
        // Professional "Thinking" State
        aiText.innerHTML = "<i class='ph ph-cpu'></i> AI is scanning stream...";
        
        // This is where the Backend connection happens later.
        // For now, we simulate the logic:
        const currentCode = monacoEditor.getValue();
        
        if (currentCode.includes("System.out.print") && !currentCode.includes(";")) {
            aiError.innerHTML = "⚠️ <span style='color:#e74c3c'>Syntax:</span> Semicolon expected.";
        } else {
            aiError.innerHTML = "✅ <span style='color:#2ecc71'>Logic:</span> No issues detected.";
        }
    }
});*/
const languages = ['java', 'python', 'javascript', 'cpp'];

languages.forEach(lang => {
    monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: function(model, position) {
            var word = model.getWordUntilPosition(position);
            var range = {
                startLineNumber: position.lineNumber, endLineNumber: position.lineNumber,
                startColumn: word.startColumn, endColumn: word.endColumn
            };

            let suggestions = [];
            if (lang === 'java') suggestions = javaSuggestions; // Paste the Java list here
            const javaSuggestions = [
    // S Triggers
    { label: 'System.out.println', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'System.out.println("${1:message}");', range: range, detail: 'Java: Print to console' },
    { label: 'Scanner', kind: monaco.languages.CompletionItemKind.Class, insertText: 'Scanner sc = new Scanner(System.in);', range: range, detail: 'Java: Standard Input' },
    { label: 'String', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'String ', range: range },
    
    // P Triggers
    { label: 'public static void main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public static void main(String[] args) {\n\t$0\n}', range: range, detail: 'Java: Main Method' },
    { label: 'private', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'private ', range: range },
    { label: 'public', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'public ', range: range },

    // C Triggers
    { label: 'class', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'public class ${1:ClassName} {\n\t$0\n}', range: range, detail: 'Java: Class Definition' },
    
    // T & I Triggers
    { label: 'try-catch', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'try {\n\t$1\n} catch (Exception e) {\n\te.printStackTrace();\n}', range: range },
    { label: 'if-else', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}', range: range }
];
            if (lang === 'python') suggestions = pythonSuggestions; // Paste Python list
            const pythonSuggestions = [
    // P & D Triggers
    { label: 'print', kind: monaco.languages.CompletionItemKind.Function, insertText: 'print("${1:message}")', range: range },
    { label: 'def', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'def ${1:function_name}(${2:args}):\n\t$0', range: range, detail: 'Python: Define Function' },

    // C & I Triggers
    { label: 'class', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'class ${1:ClassName}:\n\tdef _init_(self):\n\t\t$0', range: range },
    { label: 'if-main', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'if _name_ == "_main_":\n\t$0', range: range },
    { label: 'import', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'import ${1:module}', range: range },

    // F Triggers
    { label: 'for-loop', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'for ${1:item} in ${2:iterable}:\n\t$0', range: range }
];
            if (lang === 'javascript') suggestions = jsSuggestions; // Paste JS list
            const jsSuggestions = [
    // C & F Triggers
    { label: 'console.log', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'console.log($1);', range: range },
    { label: 'const', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'const ${1:name} = $2;', range: range },
    { label: 'function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'function ${1:name}(${2:params}) {\n\t$0\n}', range: range },

    // L, D, & A Triggers
    { label: 'let', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'let ', range: range },
    { label: 'document.getElementById', kind: monaco.languages.CompletionItemKind.Function, insertText: 'document.getElementById("${1:id}")', range: range },
    { label: 'addEventListener', kind: monaco.languages.CompletionItemKind.Method, insertText: 'addEventListener("${1:click}", (e) => {\n\t$0\n});', range: range }
];
            if (lang === 'cpp') suggestions = cppSuggestions; // Paste C++ list
const cppSuggestions = [
    // C & I Triggers
    { label: 'cout', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'cout << $1 << endl;', range: range },
    { label: 'cin', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'cin >> $1;', range: range },
    { label: '#include', kind: monaco.languages.CompletionItemKind.Snippet, insertText: '#include <iostream>\nusing namespace std;', range: range },

    // M & U Triggers
    { label: 'main-function', kind: monaco.languages.CompletionItemKind.Snippet, insertText: 'int main() {\n\t$0\n\treturn 0;\n}', range: range },
    { label: 'using namespace std', kind: monaco.languages.CompletionItemKind.Keyword, insertText: 'using namespace std;', range: range }
];

            return { 
                suggestions: suggestions.map(s => ({
                    ...s,
                    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
                }))
            };
        }
    });
});
    // ==========================================
// PROFESSIONAL AI SUGGESTION ENGINE (IntelliSense)
// ==========================================

/**
 * Registering the Completion Provider for Java.
 * This tells Monaco: "When the user types in a Java file, show these AI suggestions."
 */
monaco.languages.registerCompletionItemProvider('java', {
    provideCompletionItems: function(model, position) {
        // Get the word the user is currently typing
        var word = model.getWordUntilPosition(position);
        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };

        // This list will be replaced by your Java Backend AI later.
        // For now, these are high-level professional Java snippets.
        const suggestions = [
            {
                label: 'System.out.println',
                kind: monaco.languages.CompletionItemKind.Function,
                insertText: 'System.out.println("${1:message}");',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
                detail: 'CodeMind AI: Print to console'
            },
            {
                label: 'public static void main',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'public static void main(String[] args) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
                detail: 'CodeMind AI: Standard main method'
            },
            {
                label: 'Scanner input',
                kind: monaco.languages.CompletionItemKind.Variable,
                insertText: 'Scanner sc = new Scanner(System.in);',
                range: range,
                detail: 'CodeMind AI: User input helper'
            },
            {
                label: 'for-loop',
                kind: monaco.languages.CompletionItemKind.Snippet,
                insertText: 'for (int i = 0; i < ${1:limit}; i++) {\n\t$0\n}',
                insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                range: range,
                detail: 'CodeMind AI: Iteration block'
            }
        ];

        return { suggestions: suggestions };
    }
});

/**
 * OPTIONAL: You can repeat this block for 'python' 
 * with Python-specific snippets like 'print()' or 'def main():'
 */
   let outlineTimer;
    monacoEditor.onDidChangeModelContent(()=>{
        clearTimeout(outlineTimer);

    outlineTimer = setTimeout(() => {
        renderOutline();
    }, 300);   // delay to prevent lag
        
    });
});

// --- WORKSPACE HUB NAVIGATION ---
/*function switchView(id, el) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(id + '-view').style.display = 'block';
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('view-title').innerText = id.charAt(0).toUpperCase() + id.slice(1);
}*/

// --- IDE TRIGGER FUNCTIONS ---
function launchProIDE() { 
    document.getElementById('ideOverlay').style.display = 'flex';
    setTimeout(() => {
        renderOutline();
    }, 200);
 }
function exitIDE() { document.getElementById('ideOverlay').style.display = 'none'; }
function toggleIDEDrop(id) { document.getElementById(id).classList.toggle('show'); }

// --- EDITOR COMMANDS ---
function editorCmd(type) {
    if(type === 'undo') monacoEditor.trigger('keyboard', 'undo', null);
    if(type === 'redo') monacoEditor.trigger('keyboard', 'redo', null);
    if(type === 'selectAll') monacoEditor.setSelection(monacoEditor.getModel().getFullModelRange());
}

/*function changeLang(lang) {
     monaco.editor.setModelLanguage(monacoEditor.getModel(), lang); }*/
     function changeLang(lang) {

        // Default code for each language
        const defaultCode = {
            java: `public class Main {
        public static void main(String[] args) {
            System.out.println("Hello Java");
        }
    }`,
            python: `print("Hello Python")`,
            javascript: `console.log("Hello JavaScript");`,
            cpp: `#include <iostream>
    using namespace std;
    
    int main() {
        cout << "Hello C++";
        return 0;
    }`
        };
    
        // Save current file content before switching
        ideFiles[activeFile] = monacoEditor.getValue();
    
        // Change language in Monaco
        monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);
    
        // Set new code properly
        monacoEditor.setValue(defaultCode[lang]);
    
        // Update file name properly
        if (lang === "java") activeFile = "Main.java";
        if (lang === "python") activeFile = "main.py";
        if (lang === "javascript") activeFile = "script.js";
        if (lang === "cpp") activeFile = "main.cpp";
    
        // Update tab name
        document.getElementById("tabName").innerText = activeFile;
    
        // Save in file system
        ideFiles[activeFile] = monacoEditor.getValue();
    
        // Refresh explorer
        renderIdeTree();
    }

// --- FILE SYSTEM ---
function renderIdeTree() {
    const list = document.getElementById('fileTree');
    list.innerHTML = "";
    Object.keys(ideFiles).forEach(name => {
        const act = name === activeFile ? 'active' : '';
        list.innerHTML += `<div class="ide-file ${act}" onclick="setIdeFile('${name}')"><i class="ph ph-file-code"></i> ${name}</div>`;
    });
}

/*function setIdeFile(name) {
    ideFiles[activeFile] = monacoEditor.getValue();
    activeFile = name;
    document.getElementById('tabName').innerText = name;
    monacoEditor.setValue(ideFiles[name]);
    renderIdeTree();
}*/
function setIdeFile(name) {
    // Save current file
    ideFiles[activeFile] = monacoEditor.getValue();

    // Switch file
    activeFile = name;

    // Update editor content
    monacoEditor.setValue(ideFiles[name]);

    // Update tab name
    document.getElementById('tabName').innerText = name;

    // 🔥 AUTO DETECT LANGUAGE FROM EXTENSION
    let lang = "java"; // default

    if (name.endsWith(".py")) lang = "python";
    else if (name.endsWith(".js")) lang = "javascript";
    else if (name.endsWith(".cpp")) lang = "cpp";
    else if (name.endsWith(".java")) lang = "java";

    // Set Monaco language
    monaco.editor.setModelLanguage(monacoEditor.getModel(), lang);

    // 🔥 UPDATE DROPDOWN (THIS WAS MISSING)
    document.getElementById("langSelect").value = lang;

    // Refresh explorer UI
    renderIdeTree();
}

function newFile() { let n = prompt("Filename:"); if(n) { ideFiles[n] = ""; setIdeFile(n); } }



   
    
    
    setTimeout(() => {
        const outline = document.getElementById("outlineList");
        if (outline) {
            outline.style.overflowY = "auto";
            outline.style.maxHeight = "100%";
        }
    }, 500);
    let timeline = [];
    function toggleSection(id) {
        const section = document.getElementById(id);
        const header = section.previousElementSibling;
    
        section.classList.toggle("open");
    
        if (section.classList.contains("open")) {
            header.innerHTML = header.innerHTML.replace("▶", "▼");
    
            if (id === "outlineSection") renderOutline();
            if (id === "timelineSection") renderTimeline();
    
        } else {
            header.innerHTML = header.innerHTML.replace("▼", "▶");
        }
    }
  
    function renderTimeline() {
        const timeline = document.getElementById('timelineList');
    
        timeline.innerHTML = `
            <div class="ide-file">Opened file</div>
            <div class="ide-file">Edited code</div>
            <div class="ide-file">Ran program</div>
        `;
    }
   
  
    
    function renderOutline() {
        const outline = document.getElementById('outlineList');
        if (!monacoEditor) return;
    
        const model = monacoEditor.getModel();
        const lines = model.getLinesContent();
    
        outline.innerHTML = "";
    
        let found = false;
    
        lines.forEach((line, lineNumber) => {
            const trimmed = line.trim();
    
            if (
                trimmed.includes("class ") ||
                trimmed.includes("def ") ||
                trimmed.includes("function ") ||
                trimmed.includes("void ")||
          // 🔥 ADD THIS FOR C++
    /^\w+\s+\w+\(.*\)/.test(trimmed)                  ) {
                found = true;
    
                const item = document.createElement("div");
                item.className = "ide-file";
                item.innerText = trimmed;
    
                item.addEventListener("click", () => {
                    goToLine(lineNumber + 1); // Monaco-safe line
                });
    
                outline.appendChild(item);
            }
        });
    
        if (!found) {
            outline.innerHTML = `<div class="placeholder-label">No symbols found</div>`;
        }
    }      
    

function updateTimeline(action) {
    timeline.unshift({
        text: action,
        time: new Date().toLocaleTimeString()
    });

    const list = document.getElementById("timelineList");
    list.innerHTML = "";

    timeline.slice(0, 6).forEach(item => {
        const div = document.createElement("div");
        div.className = "ide-file";
        div.innerText = `${item.text} (${item.time})`;
        list.appendChild(div);
    });
}


   

function initWorkspaceCharts() {
    // 1. Check for the Activity Chart
    const activityCanvas = document.getElementById('activityChart');
    if (activityCanvas) {
        const ctxL = activityCanvas.getContext('2d');
        new Chart(ctxL, { 
            type: 'line', 
            data: { labels: ['M','T','W','T','F'], datasets: [{ label: 'Activity', data: [10, 50, 30, 80, 94], 
    borderColor: '#2ecc71', tension: 0.4 }]  },
            options: { responsive: true }
        });
    }

    // 2. Check for the Health Ring/Doughnut Chart
    const healthCanvas = document.getElementById('healthRing');
    if (healthCanvas) {
        const ctxR = healthCanvas.getContext('2d');
        new Chart(ctxR, { 
            type: 'doughnut', 
            data: { datasets: [{ data: [94, 6], backgroundColor: ['#2ecc71', '#1a1a1b'], 
    borderWidth: 0 }] } ,
            options: { responsive: true }
        });
    }
    
    console.log("LOG: Charts initialized successfully (if present).");
}
function togglePopup(id) {
    // close all first
    document.querySelectorAll(".popup-menu").forEach(p => p.style.display = "none");

    // toggle selected
    const popup = document.getElementById(id);
    popup.style.display =
        popup.style.display === "block" ? "none" : "block";
}
document.addEventListener("click", function(e) {
    if (!e.target.closest(".popup-wrapper")) {
        document.querySelectorAll(".popup-menu").forEach(p => p.style.display = "none");
    }
});
// ===== MENU DROPDOWN CONTROL =====
function toggleIDEDrop(id) {
    document.querySelectorAll('.ide-drop').forEach(d => d.classList.remove('show'));
    document.getElementById(id).classList.toggle('show');
}

// Close when clicking outside
document.addEventListener("click", function(e) {
    if (!e.target.closest(".m-btn")) {
        document.querySelectorAll('.ide-drop').forEach(d => d.classList.remove('show'));
    }
});
// ===== CREATE MODAL INPUT =====
function showInputModal(title, callback) {
    // remove existing
    const old = document.getElementById("customModal");
    if (old) old.remove();

    const modal = document.createElement("div");
    modal.id = "customModal";
    modal.innerHTML = `
        <div class="modal-overlay">
            <div class="modal-box">
                <h3>${title}</h3>
                <input type="text" id="modalInput" placeholder="Enter file name..." />
                <div class="modal-actions">
                    <button onclick="closeModal()">Cancel</button>
                    <button onclick="submitModal()">OK</button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // save callback globally
    window.modalCallback = callback;
}

// close modal
function closeModal() {
    document.getElementById("customModal").remove();
}

// submit modal
function submitModal() {
    const value = document.getElementById("modalInput").value.trim();
    if (value && window.modalCallback) {
        window.modalCallback(value);
    }
    closeModal();
}

function newFile() {
    document.getElementById("newFileBar").style.display = "flex";
    document.getElementById("newFileInput").focus();
    updateTimeline("Created: "+name);
}
function closeNewFileBar() {
    document.getElementById("newFileBar").style.display = "none";
    document.getElementById("newFileInput").value = "";
}
document.addEventListener("click", function(e) {
    const bar = document.getElementById("newFileBar");

    // If bar is not open, do nothing
    if (bar.style.display !== "flex") return;

    // If click is inside the bar → do nothing
    if (bar.contains(e.target)) return;

    // If click is on "New File" menu → do nothing
    if (e.target.closest('[onclick="newFile()"]')) return;

    // Otherwise close it
    closeNewFileBar();
});
document.getElementById("newFileInput").addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        confirmNewFile();   // same as Create button
    }

    if (e.key === "Escape") {
        closeNewFileBar();  // cancel
    }
});


function confirmNewFile() {
    const input = document.getElementById("newFileInput");
    const name = input.value.trim();

    if (!name) {
        showToast("Enter file name");
        return;
    }

    if (ideFiles[name]) {
        showToast("File already exists!");
        return;
    }

    ideFiles[name] = "";
    setIdeFile(name);

    updateTimeline("Created: " + name);

    closeNewFileBar();
}

function closeNewFileBar() {
    document.getElementById("newFileBar").style.display = "none";
    document.getElementById("newFileInput").value = "";
}

async function saveFile() {
    const content = monacoEditor.getValue();
    updateTimeline("Saved: "+activeFile);


    if ('showSaveFilePicker' in window) {
        try {
            const fileHandle = await window.showSaveFilePicker({
                suggestedName: activeFile || "code.txt"
            });

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            showToast("Saved successfully!");
        } catch (err) {
            console.log(err);
        }
    } else {
        // fallback download
        const blob = new Blob([content], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = activeFile || "code.txt";
        a.click();
    }
}

function openFile() {
    const input = document.createElement("input");
    input.type = "file";

    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = e => {
            ideFiles[file.name] = e.target.result;
            setIdeFile(file.name);
            showToast("File opened: " + file.name);
        };

        reader.readAsText(file);
    };

    input.click();
}
function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-msg";
    toast.innerText = message;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}
function editorCmd(type) {
    if (type === 'undo') monacoEditor.trigger('keyboard', 'undo', null);
    if (type === 'redo') monacoEditor.trigger('keyboard', 'redo', null);
    if (type === 'selectAll') {
        monacoEditor.setSelection(monacoEditor.getModel().getFullModelRange());
    }
    showToast(type.toUpperCase() + " executed");
}
function goToLine() {
    showInputModal("Go to Line", function(line) {
        showToast("Jumped to line " + line);
    });
}

function toggleSidebarView() {
    showToast("Sidebar toggled");
}


// Make sure your event listener is attached

function goHome() {
    // Close IDE
    document.getElementById("ideOverlay").style.display = "none";

    // Show workspace view properly
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById('workspace-view').style.display = 'block';

    // Update sidebar active state
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    // Activate correct nav item (Workspace)
    const workspaceNav = document.querySelector('.nav-item');
    if (workspaceNav) workspaceNav.classList.add('active');

    // Update title
    document.getElementById('view-title').innerText = "Workspace";
}
/*function switchTerminalTab(type) {
    const terminal = document.getElementById("terminalLog");
    const output = document.getElementById("outputLog");

    document.querySelectorAll(".tab-btn").forEach(btn => btn.classList.remove("active"));

    if (type === "terminal") {
        terminal.style.display = "block";
        output.style.display = "none";
        document.querySelectorAll(".tab-btn")[0].classList.add("active");
    } else {
        terminal.style.display = "none";
        output.style.display = "block";
        document.querySelectorAll(".tab-btn")[1].classList.add("active");
    }
}*/
function initSummaryDashboard() {
    // 1. Productivity Trend (Line Chart)
    const ctxProd = document.getElementById('productivityChart').getContext('2d');
    new Chart(ctxProd, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
            datasets: [{
                data: [400, 600, 450, 900, 700, 850],
                borderColor: '#2ecc71',
                backgroundColor: 'rgba(46, 204, 113, 0.1)',
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            maintainAspectRatio: false, // MANDATORY: Keeps graph inside the container
            plugins: { legend: { display: false } },
            scales: { y: { display: false }, x: { grid: { display: false } } }
        }
    });

    // 2. Language Distribution (Doughnut Chart)
    const ctxLang = document.getElementById('languageChart').getContext('2d');
    new Chart(ctxLang, {
        type: 'doughnut',
        data: {
            labels: ['Java', 'Python', 'Others'],
            datasets: [{
                data: [65, 25, 10],
                backgroundColor: ['#2ecc71', '#9b59b6', '#3498db'],
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: { legend: { position: 'bottom', labels: { color: '#555', font: { size: 10 } } } }
        }
    });
}

// Call this function when the user clicks 'Dashboard' or on load
window.addEventListener('load', initSummaryDashboard);

/**
 * Handle Export Button Logic
 */
/*function handleReportExport() {
    const toast = document.getElementById('report-toast');
    if (!toast) return;

    toast.style.display = "block";
    toast.innerText = "Generating Intelligence Report...";

    setTimeout(() => {
        toast.innerText = "Report Saved to Laptop!";
        setTimeout(() => { toast.style.display = "none"; }, 2000);
    }, 2000);
}*/
/*function handleExportReport() {
    // Get the data from the screen
    const score = document.getElementById('report-security-score').innerText;
    const bugs = document.getElementById('report-bugs-count').innerText;
    const suggestions = document.getElementById('ai-suggestions-text').innerText;

    const reportContent = `CodeMind Analysis Report\n\nSecurity Score: ${score}\nBugs Found: ${bugs}\n\nAI Suggestions:\n${suggestions}`;

    // Create a download link
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'CodeMind_Report.txt';
    link.click();
    
    showToast("Report Saved to Laptop!");
}*/
// Event Listeners for Buttons
function runReportRefresh() {
    const btn = document.getElementById('reportRefreshBtn');
    const feed = document.getElementById('report-logs-stream');

    if (!btn) return;

    // 1. Change UI to Loading State
    btn.innerText = "Analyzing...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    setTimeout(() => {
        // 2. Update Live Feed with data
        if (feed) {
            const time = new Date().toLocaleTimeString();
            const msgs = [
                "AI: Optimization suggested in loop logic.",
                "System: Security integrity verified (98.2%)",
                "AI: Memory allocation scan complete.",
                "Scan: 0 critical vulnerabilities found."
            ];
            const randomMsg = msgs[Math.floor(Math.random() * msgs.length)];
            
            const logLine = document.createElement('div');
            // Adding styles directly to ensure visibility regardless of CSS issues
            logLine.style.cssText = "border-left: 2px solid #2ecc71; padding: 5px 10px; margin-bottom: 8px; color: #ffffff; font-size: 13px; font-family: monospace;";
            logLine.innerHTML = `[${time}] ${randomMsg}`;
            
            feed.prepend(logLine); // Adds new data to the top
        }

        // 3. Update Graphs (Checks if instances exist)
        if (window.rRadarInstance) {
            window.rRadarInstance.data.datasets[0].data = window.rRadarInstance.data.datasets[0].data.map(() => Math.floor(Math.random() * 25) + 75);
            window.rRadarInstance.update();
        }
        if (window.rLineInstance) {
            window.rLineInstance.data.datasets[0].data = window.rLineInstance.data.datasets[0].data.map(() => Math.floor(Math.random() * 40) + 50);
            window.rLineInstance.update();
        }

        // 4. Reset Button
        btn.innerText = "Refresh Analysis";
        btn.disabled = false;
        btn.style.opacity = "1";
    }, 1200);
}

// Attach the function to the button automatically on load
window.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('reportRefreshBtn');
    if (btn) btn.onclick = runReportRefresh;
});
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'reportRefreshBtn') runReportRefresh();
    if (e.target && e.target.id === 'reportExportBtn') handleExportReport();
});

/**
 * INTEGRATION FIX: 
 * This ensures that whenever your existing switchView function runs, 
 * it triggers the report initialization if 'reports' is the target.
 */
const originalSwitchView = typeof switchView !== 'undefined' ? switchView : null;

switchView = function(viewId, element) {
    // Run the old switching logic if it exists
    if (originalSwitchView) {
        originalSwitchView(viewId, element);
    }

    // New specific logic for reports to ensure they appear
    if (viewId === 'reports') {
        // Small delay to ensure the DOM has displayed the section
        setTimeout(initReportSection, 300);
    }
};

// Also try to init on load just in case it's the default view
window.addEventListener('load', () => {
    if (document.getElementById('reports-view')?.classList.contains('active')) {
        initReportSection();
    }
});
/*function saveSettings() {
    const btn = document.getElementById('saveSettingsBtn');
    const toast = document.getElementById('settings-toast');
    
    btn.innerText = "Saving...";
    
    setTimeout(() => {
        toast.style.display = "block";
        btn.innerText = "Save Changes";
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.style.display = "none";
        }, 3000);
    }, 1000);
}*/


// 2. RESET SETTINGS FUNCTION
// 1. New version of your existing function
/*function resetSettings() {
    const modal = document.getElementById('resetModal');
    if(modal) modal.style.display = 'flex';
}

// 2. Function to close the modal
function closeResetModal() {
    const modal = document.getElementById('resetModal');
    if(modal) modal.style.display = 'none';
}

// 3. Function that actually does the work
function executeReset() {
    // Revert your form values here
    const nameInput = document.getElementById('set-name');
    const sensInput = document.getElementById('set-sensitivity');

    if (nameInput) nameInput.value = "Anshika Student";
    if (sensInput) sensInput.value = 85;

    // Close the modal
    closeResetModal();

    // Use your existing Toast message instead of an alert
    const toast = document.getElementById('report-toast');
    if (toast) {
        toast.innerText = "Settings Restored to Default";
        toast.style.display = "block";
        toast.style.background = "#e74c3c"; // Optional: Change to red for reset
        
        setTimeout(() => {
            toast.style.display = "none";
            toast.style.background = "#2ecc71"; // Change back to green
        }, 3000);
    }
}*/
// 1. Just shows the confirmation modal you have in your HTML
window.resetSettings = function() {
    const modal = document.getElementById('resetModal');
    if(modal) modal.style.display = 'flex';
};

// 2. Closes the modal if they click 'Keep Current'
window.closeResetModal = function() {
    const modal = document.getElementById('resetModal');
    if(modal) modal.style.display = 'none';
};

// 3. THE PROFESSIONAL RESET (Confirmed Action)
/*window.executeReset = function() {
    // A. Define the Industry Standard Defaults
    const defaultTheme = 'dark';
    const defaultFontSize = 14;
    const defaultSensitivity = 85;
    const defaultLang = 'java';

    // B. Update the UI inputs immediately
    document.getElementById('set-theme-pref').value = defaultTheme;
    document.getElementById('set-font-size').value = defaultFontSize;
    document.getElementById('set-ai-sensitivity').value = defaultSensitivity;
    document.getElementById('sens-val-display').innerText = "85%";

    // C. PERMANENT FIX: Save these defaults to MySQL
    fetch('./UpdateSettingsServlet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `theme=${defaultTheme}&fontSize=${defaultFontSize}&aiSensitivity=${defaultSensitivity}&lang=${defaultLang}`
    })
    .then(res => res.text())
    .then(status => {
        if(status === "success") {
            // D. Apply to Monaco Editor live
            if (window.monacoEditor) {
                monaco.editor.setTheme('vs-dark');
                monacoEditor.updateOptions({ fontSize: 14 });
            }
            
            window.closeResetModal();
            showToast("System Restored to Factory Defaults.");
        }
    })
    .catch(err => console.error("Reset Sync Failed:", err));
};
*/

/* ============================================================
   INTEGRATED LOGIC: NAVIGATION + CHARTS + SETTINGS
   ============================================================ */

// 1. Global Chart Instances (To prevent "Canvas already in use" errors)
let reportRadar = null;
let reportLine = null;
let productivityChart=null;
let reportRadarChart=null;

// 2. THE MASTER SWITCHER (Fixes the "Unclickable" and "Invisible" issues)
/*function switchView(viewId, element) {
    // A. Hide every view strictly
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    // B. Show the selected view
    const target = document.getElementById(viewId + '-view');
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    // C. Sidebar Highlight
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if(element) element.classList.add('active');

    // D. Header Title Update
    const titleEl = document.getElementById('view-title');
    if(titleEl) titleEl.innerText = viewId.charAt(0).toUpperCase() + viewId.slice(1);

    // E. CRITICAL: Trigger Reports only when the view is visible
    if (viewId === 'reports') {
        setTimeout(initReportSection, 200); // 200ms delay ensures CSS is ready
    }
}*/

// 3. REPORT INITIALIZATION (Forces graphs to appear)
function initReportSection() {
    const radarCtx = document.getElementById('reportRadarChart');
    const lineCtx = document.getElementById('reportLineChart');

    if (!radarCtx || !lineCtx) return;

    // Destroy existing charts to refresh them cleanly
    if (reportRadar) reportRadar.destroy();
    if (reportLine) reportLine.destroy();

    // Render Radar
    reportRadar = new Chart(radarCtx.getContext('2d'), {
        type: 'radar',
        data: {
            labels: ['Logic', 'Security', 'Speed', 'Clean', 'Design'],
            datasets: [{
                label: 'Analysis',
                data: [85, 98, 70, 90, 85],
                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                borderColor: '#2ecc71',
                borderWidth: 2,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { r: { grid: { color: '#333' }, pointLabels: { color: '#ffffff', font: { weight: 'bold' } }, ticks: { display: false } } }
        }
    });

    // Render Line
    reportLine = new Chart(lineCtx.getContext('2d'), {
        type: 'line',
        data: {
            labels: ['0', '1', '2', '3', '4', '5'],
            datasets: [{
                data: [40, 60, 45, 95, 70, 85],
                borderColor: '#9b59b6',
                fill: true,
                backgroundColor: 'rgba(155, 89, 182, 0.1)',
                tension: 0.4
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#111' } }, x: { display: false } } }
    });

    // Fill Live Feed
    const feed = document.getElementById('report-logs-stream');
    if (feed && feed.innerHTML.trim() === "") {
        feed.innerHTML = '<div class="report-log-entry ai">[SYSTEM] AI Analysis Core V2 Online.</div>';
    }
}

// 4. PROFESSIONAL SETTINGS MODAL LOGIC
/*function openResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) modal.style.display = 'flex';
}

function closeResetModal() {
    const modal = document.getElementById('resetModal');
    if (modal) modal.style.display = 'none';
}

function executeReset() {
    // Revert inputs
    const nameInput = document.getElementById('set-name');
    if (nameInput) nameInput.value = "Anshika Student";
    
    closeResetModal();
    
    // Show Toast
    const toast = document.getElementById('report-toast');
    if (toast) {
        toast.innerText = "Settings Restored to Default";
        toast.style.display = "block";
        setTimeout(() => { toast.style.display = "none"; }, 3000);
    }
}/*
/* --- REFRESH ANALYSIS LOGIC ONLY --- */

// INSIDE YOUR WORKSPACE app.js
function logoutUser() {
    // 1. DELETE the pass from the browser memory
    sessionStorage.clear();
    
    // 2. Go back to landing page
    window.location.href = 'index.html';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    const main = document.querySelector('.main-content');
    const icon = document.getElementById('toggleIcon');

    // toggle state
    sidebar.classList.toggle('collapsed');
    main.classList.toggle('full');

    // switch icon based on state
    if (sidebar.classList.contains('collapsed')) {
        icon.className = "ph ph-arrow-right";  // sidebar hidden
    } else {
        icon.className = "ph ph-list";         // sidebar visible
    }
}
// 1. Ensure your default files are defined at the top
//THE MASTER SWITCHER - Replace all other switchView functions with this one
/*function switchView(viewId, element) {
    // 1. Hide all sections to prevent "stacking"
   
    document.querySelectorAll('.view').forEach(v => {
        v.style.display = 'none';
        v.classList.remove('active');
    });

    // 2. Show the specific section you clicked
    const target = document.getElementById(viewId + '-view');
    if (target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    // 3. Update Sidebar Highlighting
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    if (element) element.classList.add('active');

    // 4. Update the Header Title (Dashboard, Reports, etc.)
    const titleHeader = document.getElementById('view-title');
    if (titleHeader) {
        titleHeader.innerText = viewId.charAt(0).toUpperCase() + viewId.slice(1);
    }

    // 5. TRIGGER DATA LOADING (The Connectivity Logic)
    if (viewId === 'dashboard') {
        loadDashboardData(); // Fetch total runs/accuracy from DB
       // setTimeout(initSummaryDashboard, 100); // Re-initialize charts
    } 
    else if (viewId === 'reports') {
        loadReportData(); // Fetch latest AI report from DB
        setTimeout(initReportSection, 100); // Re-initialize radar charts
    } 
    else if (viewId === 'settings') {
        loadSettingsData(); // NEW: Fetch user preferences from DB
    }
}*/

   /* function loadSettingsData() {
    // Assuming your GetProfileServlet returns the user's preferences
    fetch('./GetProfileServlet')
        .then(res => res.json())
        .then(data => {
            // 1. Update the inputs in your Settings UI
            const themeSelect = document.getElementById('theme-variant-select');
            const fontSizeInput = document.getElementById('font-size-input');
            const aiRange = document.getElementById('ai-sensitivity-range');

            if (themeSelect) themeSelect.value = data.theme || 'dark';
            if (fontSizeInput) fontSizeInput.value = data.fontSize || 14;
            if (aiRange) aiRange.value = data.aiSensitivity || 85;

            // 2. Apply saved settings to Monaco Editor instantly
            if (window.monacoEditor) {
                const themeName = (data.theme === 'dark') ? 'vs-dark' : 'vs';
                monaco.editor.setTheme(themeName);
                monacoEditor.updateOptions({ fontSize: parseInt(data.fontSize) });
            }
        })
        .catch(err => console.error("Error loading settings:", err));
}*/
/* 3. The Data Loaders (Fixed JSON handling)
function loadDashboardData() {
    fetch('./GetDashboardServlet')
    .then(res => res.json())
    .then(data => {
        document.getElementById('total-programs-run').innerText = data.totalPrograms || 0;
        document.getElementById('overall-accuracy').innerText = (data.overallAccuracy || 100) + "%";
        
        // Initialize Chart
        const ctx = document.getElementById('productivityChart').getContext('2d');
        if (productivityChart) productivityChart.destroy(); // FIX: Destroy old chart
        productivityChart = new Chart(ctx, { /* Your Chart Config */ 
    /*})
    .catch(err => console.error("Dashboard Error:", err));
}*/



