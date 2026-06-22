let autoSaveEnabled = true;
let livePreviewEnabled = false;
// ================= GLOBAL =================
let outputVisible = true;
// 1. GLOBAL STATE
var isCodeSafe = true; 
var currentFrontendLang = 'html'; // Default
// At the top of playground.js
// 2. THE ANALYZE FUNCTION (Fixed Fetch and Logic)
function analyze() {
    console.log("Analyzing code...");
    let code = editor.getValue();
    let type = currentFrontendLang; 

    // REMOVED the "/" before HelloServlet for correct relative path
    fetch("HelloServlet", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code, type: type })
    })
    .then(res => {
        if (!res.ok) throw new Error("Servlet 404 - Check URL");
        return res.json();
    })

 .then(data => {
    let list = document.getElementById("errorList");
    let errorCountDisplay = document.getElementById("errors"); // THIS IS THE FOOTER ELEMENT

    list.innerHTML = ""; 

    if (!data.errors || data.errors.length === 0) {
        list.innerHTML = "<li style='color:lightgreen'>✔️ No logic errors detected.</li>";
        if(errorCountDisplay) errorCountDisplay.innerText = "Errors: 0"; // RESET TO 0
        isCodeSafe = true; run();
    } else {
        isCodeSafe = false; 

        // ✅ ADD THIS LINE: Updates the footer with the real number of errors
        if(errorCountDisplay) errorCountDisplay.innerText = "Errors: " + data.errors.length;

        data.errors.forEach(err => {
            let li = document.createElement("li");
            li.innerHTML = `<b>⚠️ ${err.msg}</b><br><small>${err.explain}</small>`;
            list.appendChild(li);
        });
        showBlockedMessage();
    }
})
    .catch(err => {
        console.error("AI Analysis Error:", err);
        alert("Backend Error: Ensure HelloServlet is deployed and Tomcat is running.");
    });
}
/*function run() {
    const iframe = document.getElementById("out");

    if (!isCodeSafe) {
        // If errors exist, block the preview
        showBlockedMessage();
        return;
    }

    // If no errors, show the actual output
    let code = editor.getValue();
    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(code); 
    doc.close();
}*/
// 3. THE RUN FUNCTION (Checks the Safety Flag)
function run() {
    console.log("Run clicked. Safe state:", isCodeSafe);
      
    if (!isCodeSafe) {
        showBlockedMessage();
        return;
    }

    // Standard Preview Logic
   /* let code = editor.getValue();
    let iframe = document.getElementById("out");
    let doc = iframe.contentWindow.document;
    doc.open();
    doc.write(code);
    doc.close();
}*/
// ================= RUN =================
// --- Standard Preview Logic (Corrected) ---
    
    // 1. Save the current editor work into our memory first
    files[currentFile] = editor.getValue();

    // 2. Build a single "Bundle" that combines HTML, CSS, and JS
    // We wrap CSS in <style> and JS in <script>
    let finalBundle = `
        ${files["index.html"]}
        <style>
            ${files["style.css"]}
        </style>
        <script>
            try {
                ${files["script.js"]}
            } catch (err) {
                console.error("Runtime Script Error:", err);
            }
        <\/script>
    `;

    // 3. Inject the combined bundle into the Iframe
    let iframe = document.getElementById("out");
    let doc = iframe.contentWindow.document;
    
    doc.open();
    doc.write(finalBundle);
    doc.close();
    
    console.log("Run successful: Bundled HTML, CSS, and JS rendered.");
}

// 5. HELPER: Update language when tab switches
function switchFrontendTab(lang) {
    currentFrontendLang = lang;
    // Update your UI tabs active class here...
    console.log("Switched to:", lang);
}

// ================= SECTION =================
function show(sec){
document.getElementById("editor-section").style.display="none";
document.getElementById("ai-section").style.display="none";
document.getElementById(sec+"-section").style.display="block";
}

// ================= LANGUAGE =================
function changeLang(){
let lang=document.getElementById("lang").value;
if(editor){
monaco.editor.setModelLanguage(editor.getModel(),lang);
}
}




// Helper function to show the "Blocked" UI
function showBlockedMessage() {
    const iframe = document.getElementById("out");
    iframe.srcdoc = `
        <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; background:#fff; color:#333; font-family:sans-serif; text-align:center; padding:20px;">
            <div style="font-size:40px;">⚠️</div>
            <h1 style="color:#d9534f;">Preview Blocked</h1>
            <p>Logic errors detected. Please check the <b>Issues</b> tab and fix your code to see the live result.</p>
        </div>
    `;
}    

  function updateFooter() {
    // 1. Update Line Count
    let lines = editor.getValue().split("\n").length;
    document.getElementById("lines").innerText = "Lines: " + lines;

    // 2. Calculate AI Logic Errors currently in the sidebar
    let aiList = document.getElementById("errorList");
    let aiCount = 0;
    
    // Only count if the list doesn't contain the "No errors" success message
    if (aiList && aiList.children.length > 0 && !aiList.innerHTML.includes("No logic errors")) {
        aiCount = aiList.children.length;
    }

    // 3. Calculate Monaco Syntax Markers
    let markers = monaco.editor.getModelMarkers({ resource: editor.getModel().uri });
    let syntaxCount = markers.length;

    // 4. Update the Footer with the TOTAL of both systems
    // This ensures that even if you type, the AI errors stay visible in the footer
    document.getElementById("errors").innerText = "Errors: " + (aiCount + syntaxCount);
}

function showErrors(errors) {
    let list = document.getElementById("errorList");
    let errorDisplay = document.getElementById("errors");

    if (!list) return;
    list.innerHTML = ""; // Clear old issues

    // If no errors found by AI
    if (!errors || errors.length === 0) {
        list.innerHTML = "<li style='color:lightgreen'>✔️ No logic errors detected.</li>";
        isCodeSafe = true;
        // Let updateFooter handle the 0 state based on Monaco markers
        updateFooter(); 
        return;
    }

    // AI found errors
    isCodeSafe = false;
    errors.forEach(err => {
        let li = document.createElement("li");
        li.innerHTML = `<b>⚠️ ${err.msg}</b><br><small>${err.explain}</small>`;
        list.appendChild(li);
    });

    // Update footer immediately with the new AI count
    updateFooter(); 
}

function analyzeMonaco(){

    let markers = monaco.editor.getModelMarkers({});

    let list = document.getElementById("errorList");

    list.innerHTML = "";

    if(markers.length === 0){

        list.innerHTML =
        "<li style='color:lightgreen;'>✅ No errors</li>";

        return;
    }

    markers.forEach(err => {

        let li = document.createElement("li");

        li.innerHTML =
       `<b>Line ${err.startLineNumber}</b><br>${err.message}`;

        list.appendChild(li);

    });
}


// ================= AI =================
function generate(){
let lang=document.getElementById("lang").value;

if(lang==="html"){
editor.setValue(`<html>
<body>
<h1>AI Generated 🚀</h1>
</body>
</html>`);
}
else if(lang==="javascript"){
editor.setValue(console.log("Hello AI 🚀"));
}
else{
editor.setValue(print("Hello AI 🚀"));
}

show('editor');
}

// ================= TOGGLE OUTPUT =================
function toggleOutput(){

let output = document.querySelector(".output");
let editorBox = document.querySelector(".editor");
let errorPanel = document.querySelector(".error-panel");
let btn = document.getElementById("toggleBtn");


if(outputVisible){

output.style.display = "none";
editorBox.style.width = "75%";
errorPanel.style.width = "25%";
if(btn) btn.innerText = "Show Output";

}else{

output.style.display = "block";
editorBox.style.width = "60%";
errorPanel.style.width = "15%";
if(btn) btn.innerText = "Hide Output";

}

outputVisible = !outputVisible;
}

// ================= FILE SYSTEM =================
let files = {
"index.html": "<h1>Hello 🚀</h1>",
"style.css": "body{background:white;}",
"script.js": "console.log('hi');"
};

let currentFile = "index.html";

// RENDER FILE LIST
function renderFiles(){

    let list = document.getElementById("fileList");
    if(!list) return;

    list.innerHTML = "";

    Object.keys(files).forEach(name => {

        let li = document.createElement("li");

        // 🔥 ICONS
        if(name.endsWith(".html")){
            li.innerHTML = "🌐 " + name;
        }

        else if(name.endsWith(".css")){
            li.innerHTML = "🎨 " + name;
        }

        else if(name.endsWith(".js")){
            li.innerHTML = "⚡ " + name;
        }

        else{
            li.innerHTML = "📄 " + name;
        }

        li.onclick = () => switchFile(name);

        // ACTIVE FILE
        if(name === currentFile){
            li.classList.add("active");
        }

        list.appendChild(li);
    });
}

// SWITCH FILE
function switchFile(name){

    if(!editor) return;

    saveFile();
    currentFile = name;

    editor.setValue(files[name] || "");

    // 🔥 AUTO LANGUAGE SET
    let lang = "plaintext";

    if(name.endsWith(".html")) lang = "html";
    else if(name.endsWith(".css")) lang = "css";
    else if(name.endsWith(".js")) lang = "javascript";

    monaco.editor.setModelLanguage(editor.getModel(), lang);

    // 🔥 dropdown bhi sync karo
    document.getElementById("lang").value = lang;

    renderFiles();
}

// SAVE FILE
function saveFile(){
if(!editor) return;

files[currentFile] = editor.getValue();
localStorage.setItem("files", JSON.stringify(files));
}
// LOAD FILES
function loadFiles(){

let saved = localStorage.getItem("files");
if(saved){
files = JSON.parse(saved);
}

renderFiles();
switchFile(currentFile);

}

// NEW FILE
function newFile(){

    // 🔥 selected language
    let lang = document.getElementById("lang").value;

    // 🔥 filename only
    let name = prompt("Enter file name");

    if(!name) return;

    // 🔥 extension auto add
    if(lang === "html"){
        name += ".html";
    }

    else if(lang === "css"){
        name += ".css";
    }

    else if(lang === "javascript"){
        name += ".js";
    }

    // ❌ duplicate check
    if(files[name]){
        alert("File already exists");
        return;
    }

    // 🔥 create file
    files[name] = "";

    saveFile();

    renderFiles();

    switchFile(name);
}

//delet 
function deleteFile(){

    // ❗ check file selected
    if(!currentFile){
        alert("No file selected");
        return;
    }

    // ❗ confirm
    let ok = confirm("Delete " + currentFile + " ?");
    if(!ok) return;

    // 🔥 delete current file
    delete files[currentFile];

    // 🔥 remaining files list
    let allFiles = Object.keys(files);

    if(allFiles.length > 0){
        currentFile = allFiles[0];
        editor.setValue(files[currentFile]);
    }else{
        currentFile = "";
        editor.setValue("");
    }

    // 🔥 SAVE (MOST IMPORTANT)
    localStorage.setItem("files", JSON.stringify(files));

    // 🔥 refresh UI
    renderFiles();
}

// AUTO SAVE
setInterval(()=>{

    if(editor && autoSaveEnabled){
        saveFile();
    }

},2000);

// AUTO LANGUAGE
function changeLang(){

    let lang = document.getElementById("lang").value;

    // 🔥 AUTO CREATE FILES
    if(lang === "html"){
        switchFile("index.html");
    }

    else if(lang === "css"){

        // create if missing
        if(!files["style.css"]){
            files["style.css"] = "";
        }

        renderFiles();
        switchFile("style.css");
    }

    else if(lang === "javascript"){

        if(!files["script.js"]){
            files["script.js"] = "";
        }

        renderFiles();
        switchFile("script.js");
    }
}
// ================= LOGOUT =================
function logout(){
window.location="index.html";
}
// ================= THEME =================

function toggleTheme(){

let body = document.body;

// TOGGLE CLASS
body.classList.toggle("light");

// SAVE
let theme = body.classList.contains("light") ? "light" : "dark";
localStorage.setItem("theme", theme);

// MONACO THEME
if(editor){
monaco.editor.setTheme(theme === "light" ? "vs" : "vs-dark");
}
}

// LOAD THEME ON START
function loadTheme(){

let theme = localStorage.getItem("theme");

if(theme === "light"){
    
document.body.classList.add("light");

if(editor){
monaco.editor.setTheme("vs");
}
}

}

let commands = [
{name:"Run Code", action:run},
{name:"Analyze Code", action:analyze},
{name:"New File", action:newFile},
{name:"Toggle Theme", action:toggleTheme}
];
// OPEN PALETTE
document.addEventListener("keydown", (e)=>{
if(e.ctrlKey && e.key==="p"){
e.preventDefault();
document.getElementById("palette").classList.remove("hidden");
renderCommands(commands);
}
});

// CLOSE
document.addEventListener("keydown", (e)=>{
if(e.key==="Escape"){
document.getElementById("palette").classList.add("hidden");
}
});

// RENDER
function renderCommands(list){
let ul=document.getElementById("commandList");
ul.innerHTML="";

list.forEach(cmd=>{
let li=document.Element("li");
li.innerText=cmd.name;

li.onclick=()=>{
cmd.action();
document.getElementById("palette").classList.add("hidden");
};

ul.appendChild(li);
});
}

// SHORTCUTS
document.addEventListener("keydown", (e)=>{

if(e.ctrlKey && e.key==="Enter"){
run();
}

if(e.ctrlKey && e.key==="s"){
e.preventDefault();
saveFile();
toast("💾 File Saved");
}

if(e.ctrlKey && e.key==="b"){
analyze();
toast("🔍 Code Analyzed");
}

});
function toast(msg){

    let t = document.getElementById("toast");

    if(!t) return;

    t.innerText = msg;
    t.style.display = "block";

    setTimeout(() => {
        t.style.display = "none";
    }, 2000);
}
// ================= AUTO SAVE =================

function toggleAutoSave(){

    autoSaveEnabled = !autoSaveEnabled;

    let btn = document.getElementById("autoSaveBtn");

    if(autoSaveEnabled){

        btn.innerText = "💾 Auto Save: ON";

        toast("💾 Auto Save Enabled");

    }else{

        btn.innerText = "💾 Auto Save: OFF";

        toast("❌ Auto Save Disabled");
    }
}

// ================= LIVE PREVIEW =================

function toggleLive(){

    livePreviewEnabled = !livePreviewEnabled;

    let btn = document.getElementById("liveBtn");

    if(livePreviewEnabled){

        btn.innerText = "⚡ Live Preview: ON";

        run();   // 🔥 ye line add karo

        toast("⚡ Live Preview Enabled");

    }else{

        btn.innerText = "⚡ Live Preview: OFF";

        toast("❌ Live Preview Disabled");
    }
}