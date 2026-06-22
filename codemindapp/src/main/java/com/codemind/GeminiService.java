
package com.codemind;
//import com.google.gson.JsonObject;
import java.io.*;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class GeminiService {
    //UNCOMMENT THIS
    //private static final String API_KEY = "your API THEN NO ERROR"; 
    //private static final String API_URL = "YOUR API PATH THEN NO ERROR " + API_KEY;

    public static String analyzeCode(String userCode, String fileName,String userInput)
     {
        String lang = fileName.endsWith(".py") ? "python" : fileName.endsWith(".cpp") ? "cpp" : fileName.endsWith(".js") ? "javascript" : "java";
      /* 
       UNCOMMENT THIS
      try {
            // Attempt Cloud API - Fixed Escaping
            URL url = URI.create(API_URL).toURL();
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(3000);

            String escaped = userCode.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");
          //  String prompt = "Act as an Expert Compiler Auditor. Analyze this " + lang + " code. " +
           String prompt = "Act as a " + lang + " Compiler and Runtime. " +
        "1. Analyze this code for errors. " +
        "2. If it is valid, simulate the execution using these user inputs: [" + userInput + "]. " +
                            "Return ONLY a JSON with keys: 'proTip', 'logicAnalysis', 'severity', 'canRun', 'score', 'bugs'. Code: " + escaped;

            String jsonInput = "{\"contents\": [{\"parts\":[{\"text\": \"" + prompt + "\"}]}]}";
            try (OutputStream os = conn.getOutputStream()) { os.write(jsonInput.getBytes(StandardCharsets.UTF_8)); }

            if (conn.getResponseCode() == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) response.append(line.trim());
                return response.toString().replace("json", "").replace("", "").trim();
            }
        } catch (Exception e) { }
        return getDeepLocalScan(userCode, lang); // High-level fallback
    
    */
   }
    
    private static String getDeepLocalScan(String code, String lang) {
        List<String> errors = new ArrayList<>();
        int score = 100; boolean canRun = true; String severity = "Optimized"; String proTip = "";

     
         if (lang.equals("java")) {
        // --- 1. CORE EXECUTION & SYNTAX (1-10) ---
        if (!code.contains("public static void main")) { errors.add("Fatal: Missing 'public static void main' entry point."); score -= 40; canRun = false; }
        if (!code.contains("String[] args") && code.contains("main")) { errors.add("Syntax: Main method must accept 'String[] args' parameter."); score -= 10; canRun = false; }
        if (!code.contains(";")) { errors.add("Syntax: Missing semicolon (;) line terminator."); score -= 20; canRun = false; }
        if (!code.contains("{") || !code.contains("}")) { errors.add("Structure: Missing class or method braces { }."); score -= 30; canRun = false; }
        int openBraces = code.length() - code.replace("{", "").length();
        int closeBraces = code.length() - code.replace("}", "").length();
        if (openBraces != closeBraces) { errors.add("Structure: Mismatched curly braces. Found " + openBraces + " open vs " + closeBraces + " closed."); score -= 20; canRun = false; }
        if (code.contains("System.out.print") && !code.contains("(")) { errors.add("Syntax: Print statement requires parentheses."); score -= 15; canRun = false; }
        if (code.contains("if") && code.contains("=") && !code.contains("==") && !code.contains(">=") && !code.contains("<=")) { errors.add("Logic: Assignment used in IF condition instead of comparison (==)."); score -= 25; }
        if (code.contains("for") && code.contains(";;")) { errors.add("Performance: Infinite for-loop detected."); score -= 20; }
        if (code.contains("while(true)") && !code.contains("break")) { errors.add("Critical: Infinite while-loop without break condition."); score -= 30; }
        if (code.contains("/ 0") || code.contains("/0")) { errors.add("Math: Division by zero detected (ArithmeticException risk)."); score -= 40; }

        // --- 2. VARIABLE & LOGIC INTEGRITY (11-20) ---
        if (code.contains("sum") && !code.contains("sum = 0") && !code.contains("sum=0")) { errors.add("Logic: 'sum' variable might not be initialized to 0. Risk of garbage values."); score -= 15; }
        if (code.contains("count") && !code.contains("count++") && !code.contains("count +") && code.contains("while")) { errors.add("Logic: Counter variable is not incremented inside loop."); score -= 20; }
        if (code.contains("== \"")) { errors.add("Convention: String comparison using '=='. Use '.equals()' for content."); score -= 20; }
        if (code.contains("new ") && !code.contains("(") ) { errors.add("Syntax: Constructor call missing parentheses ()."); score -= 10; canRun = false; }
        if (code.contains("int") && code.contains("2147483648")) { errors.add("Data: Integer overflow. Value exceeds 32-bit signed limit."); score -= 15; }
        if (code.contains("float") && !code.contains("f") && code.contains(".")) { errors.add("Syntax: Float literal missing 'f' suffix."); score -= 10; }
        if (code.contains("long") && !code.contains("L") && code.length() > 200) { errors.add("Syntax: Long literal missing 'L' suffix."); score -= 10; }
        if (code.contains("null") && code.contains(".length()")) { errors.add("Risk: NullPointer object access on .length() call."); score -= 30; }
        if (code.contains("[i]") && !code.contains("length")) { errors.add("Risk: Array access without bounds checking."); score -= 15; }
        if (code.contains("if") && code.contains(";") && (code.indexOf("if") < code.indexOf(";")) && (code.indexOf(";") - code.indexOf("if") < 10)) { errors.add("Logic: Semicolon immediately after 'if' statement makes it empty."); score -= 25; }

        // --- 3. MEMORY & RESOURCE MANAGEMENT (21-30) ---
        if (code.contains("Scanner") && !code.contains(".close()")) { errors.add("Memory: Resource leak. Scanner object is not closed."); score -= 10; }
        if (code.contains("FileInputStream") && !code.contains(".close()")) { errors.add("Memory: File stream leak detected."); score -= 15; }
        if (code.contains("new Thread") && !code.contains(".start()")) { errors.add("Threading: Thread object created but never started."); score -= 15; }
        if (code.contains("System.gc()")) { errors.add("Best Practice: Manual Garbage Collection call is discouraged."); score -= 5; }
        if (code.contains("catch(Exception e) {}")) { errors.add("Security: Swallowing exceptions with empty catch block."); score -= 20; }
        if (code.contains("new Date()")) { errors.add("Optimization: Use 'java.time' API instead of legacy 'Date' class."); score -= 5; }
        if (code.contains("Vector")) { errors.add("Optimization: 'Vector' is synchronized and slow. Use 'ArrayList' instead."); score -= 5; }
        if (code.contains("Hashtable")) { errors.add("Optimization: Use 'HashMap' instead of legacy 'Hashtable'."); score -= 5; }
        if (code.contains("while(true)") && code.contains("Thread.sleep")) { errors.add("Performance: Sleep in while(true) can cause thread hanging."); score -= 10; }
        if (code.contains("StringBuffer")) { errors.add("Optimization: Use 'StringBuilder' for non-thread-safe string building."); score -= 5; }

        // --- 4. NAMING & OO STANDARDS (31-40) ---
        if (code.matches(".class [a-z].")) { errors.add("Naming: Class names should start with an Uppercase letter."); score -= 5; }
        if (code.matches(".int [A-Z].") || code.matches(".String [A-Z].")) { errors.add("Naming: Variables should use camelCase (start with lowercase)."); score -= 5; }
        if (code.contains("void") && code.contains("return ") && !code.contains("return;")) { errors.add("Syntax: Attempting to return a value from a 'void' method."); score -= 25; canRun = false; }
        if (code.contains("static") && code.contains("this.")) { errors.add("Logic: 'this' cannot be used in a static context."); score -= 30; canRun = false; }
        if (code.contains("final") && code.contains("++")) { errors.add("Logic: Cannot increment a variable marked as 'final'."); score -= 30; canRun = false; }
        if (code.contains("abstract class") && code.contains("new ")) { errors.add("Logic: Cannot instantiate an abstract class."); score -= 25; canRun = false; }
        if (code.contains("interface") && code.contains("private")) { errors.add("Syntax: Interface methods cannot be private."); score -= 15; canRun = false; }
        if (code.contains("System.out.println") && code.length() > 1000) { errors.add("Style: Excessive use of console logging in large files."); score -= 5; }
         if (code.contains("try") && !code.contains("catch") && !code.contains("finally")) { errors.add("Syntax: 'try' block without 'catch' or 'finally'."); score -= 20; canRun = false; }
        if (code.contains("package") && !code.startsWith("package")) { errors.add("Syntax: Package declaration must be the first line."); score -= 10; canRun = false; }

        // --- 5. ADVANCED LOGIC & SAFETY (41-50) ---
        if (code.contains("goto")) { errors.add("Forbidden: 'goto' is a reserved word and not used in Java."); score -= 20; canRun = false; }
        if (code.contains("instanceof") && code.contains("null")) { errors.add("Logic: 'instanceof null' always returns false."); score -= 10; }
        if (code.contains("public class") && code.length() - code.replace("public class", "").length() > 12) { errors.add("Structure: Multiple public classes in one file are not allowed."); score -= 20; canRun = false; }
        if (code.contains("enum") && code.contains("extends")) { errors.add("Syntax: Enums cannot extend other classes."); score -= 15; canRun = false; }
        if (code.contains(".stop()")) { errors.add("Deprecated: Use of .stop() on Thread is dangerous and deprecated."); score -= 20; }
        if (code.contains("double") && code.contains("==")) { errors.add("Math: Comparing floating point numbers with '=='. Use a threshold."); score -= 10; }
        if (code.contains("throws") && !code.contains("throw new")) { errors.add("Best Practice: Method declares exception but never throws one."); score -= 5; }
        if (code.contains("assert") && !code.contains(" ")) { errors.add("Syntax: Incorrect assertion format."); score -= 10; }
        if (code.contains("default:") && !code.contains("switch")) { errors.add("Syntax: 'default' keyword found outside of a switch block."); score -= 20; canRun = false; }
        if (code.contains("super.") && !code.contains("extends")) { errors.add("Logic: 'super' used in a class that does not extend another."); score -= 25; canRun = false; }

        // --- PRO-TIP SELECTION BASED ON SEVERITY ---
        if (!canRun) {
            proTip = "<b>Architect's Advice:</b> Your code contains Fatal Errors. Java is a compiled language; focus on resolving semicolons and main method structures before execution.";
        } else if (errors.size() > 0) {
            proTip = "<b>Optimization Tip:</b> Logic verified, but detected " + errors.size() + " warnings. Improving resource management (Scanners/Streams) will prevent future crashes.";
        }
    else {
            proTip = "<b>Optimized:</b> Perfect Java structure! Your code is ready for high-scale production deployment.";
        }
    }

   
        
        
        

            else if (lang.equals("python")) {
        // --- 1. FATAL SYNTAX ERRORS (1-10) ---
        
        // Python 3 print check (Missing Parentheses)
        if (code.contains("print ") && !code.contains("print(")) {
            errors.add("<b>Syntax Error:</b> Python 3 requires parentheses for <code>print()</code>. Change to <code>print(\"...\")</code>.");
            score -= 20; severity = "Warning"; // Warning because some interpreters allow it, but standard fails.
        }

        // The 'Braces' Trap (Java/C++ habits in Python)
        if (code.contains("{") && !code.contains("dict") && !code.contains("set") && !code.contains("=")) {
            errors.add("<b>Indentation Error:</b> Python uses indentation and colons (:), not curly braces <code>{ }</code> for logic blocks.");
            score -= 40; canRun = false;
        }

        // Missing Colons after control flow
        if ((code.contains("if ") || code.contains("for ") || code.contains("def ") || code.contains("while ")) && !code.contains(":")) {
            errors.add("<b>Syntax Error:</b> Missing colon (:) at the end of a control statement (if, for, while, def).");
            score -= 25; canRun = false;
        }

        // Unclosed Quotes
        long doubleQuotes = code.chars().filter(ch -> ch == '"').count();
        long singleQuotes = code.chars().filter(ch -> ch == '\'').count();
        if (doubleQuotes % 2 != 0 || singleQuotes % 2 != 0) {
            errors.add("<b>Fatal:</b> Unclosed string literal detected. Ensure all quotes are paired.");
            score -= 30; canRun = false;
        }

        // --- 2. KEYWORD & LOGIC ERRORS (11-20) ---
        
        // Null vs None
        if (code.contains("null")) {
            errors.add("<b>Name Error:</b> 'null' is not defined in Python. Use <code>None</code> (case-sensitive).");
            score -= 15;
        }

        // Boolean Casing
        if (code.contains("true") || code.contains("false")) {
            errors.add("<b>Name Error:</b> Python booleans are case-sensitive. Use <code>True</code> or <code>False</code>.");
            score -= 15;
        }

        // Logical Operators (&& vs and)
        if (code.contains("&&") || code.contains("||") || (code.contains("!") && !code.contains("!="))) {
            errors.add("<b>Syntax:</b> Python uses <code>and</code>, <code>or</code>, and <code>not</code> instead of symbols.");
            score -= 15;
        }

        // Increments (++ is not in Python)
        if (code.contains("++") || code.contains("--")) {
            errors.add("<b>Syntax Error:</b> Python does not support <code>++</code>. Use <code>x += 1</code> instead.");
            score -= 10;
        }

        // 'else if' vs 'elif'
        if (code.contains("else if")) {
            errors.add("<b>Syntax:</b> Python uses <code>elif</code> for conditional chains, not 'else if'.");
            score -= 20; canRun = false;
        }

        // --- 3. NAMING & BEST PRACTICES ---
        if (code.contains("var ")) {
            errors.add("<b>Syntax:</b> The <code>var</code> keyword is invalid. Simply use <code>x = 10</code>.");
            score -= 10;
        }

        // PRO-TIP SELECTION FOR PYTHON
        if (!canRun) {
            proTip = "<b>Python Architect Advice:</b> Your script has fatal syntax violations. Python is a whitespace-dependent language; focus on colons and indentation.";
            severity = "Critical";
        } else if (!errors.isEmpty()) {
            proTip = "<b>PEP 8 Tip:</b> Your code is runnable, but follow PEP 8 standards (True/False casing, using elif) for professional-grade scripting.";
            severity = "Warning";
        } else {
            proTip = "<b>Optimized:</b> Excellent Pythonic structure. You are following the Zen of Python perfectly.";
            severity = "Optimized";
        }
    }

        
       else if (lang.equals("cpp")) {
        // --- 1. CORE SYNTAX & HEADERS (1-10) ---
        if (!code.contains("#include")) { errors.add("<b>Fatal:</b> No pre-processor directives found. C++ needs headers like <code>&lt;iostream&gt;</code>."); score -= 40; canRun = false; }
        if (!code.contains("int main")) { errors.add("<b>Fatal:</b> Entry point 'int main()' not found."); score -= 40; canRun = false; }
        if (code.contains("void main")) { errors.add("<b>Standard:</b> 'void main' is non-standard. Use <code>int main()</code> with <code>return 0;</code>."); score -= 10; }
        if (!code.contains(";")) { errors.add("<b>Syntax:</b> Semicolon (;) missing. Every C++ statement must be terminated."); score -= 20; canRun = false; }
        if (code.contains("cout") && !code.contains("std::") && !code.contains("using namespace std")) {
            errors.add("<b>Scope:</b> 'cout' is not defined in this scope. Add <code>using namespace std;</code> or use <code>std::cout</code>.");
            score -= 15; canRun = false;
        }
        int openBraces = code.length() - code.replace("{", "").length();
        int closeBraces = code.length() - code.replace("}", "").length();
        if (openBraces != closeBraces) { errors.add("<b>Structure:</b> Mismatched braces { }. Code block integrity is broken."); score -= 20; canRun = false; }
        if (code.contains("<<") && !code.contains("cout")) { errors.add("<b>Syntax:</b> Insertion operator <code><<</code> used without a stream object."); score -= 10; canRun = false; }
        if (code.contains(">>") && !code.contains("cin")) { errors.add("<b>Syntax:</b> Extraction operator <code>>></code> used without an input stream."); score -= 10; canRun = false; }
        if (code.contains("#include <iostream.h>")) { errors.add("<b>Legacy:</b> <code>iostream.h</code> is deprecated. Use <code>#include &lt;iostream&gt;</code> without .h."); score -= 10; }

        // --- 2. MEMORY MANAGEMENT & POINTERS (11-25) ---
        if (code.contains("new ") && !code.contains("delete")) { errors.add("<b>Critical:</b> Memory allocated with <code>new</code> is never freed. This causes a Heap Leak."); score -= 30; }
        if (code.contains("new[]") && !code.contains("delete[]")) { errors.add("<b>Memory:</b> Array allocation leak. Use <code>delete[]</code> for arrays."); score -= 25; }
        if (code.contains("malloc") && !code.contains("free")) { errors.add("<b>Legacy Memory:</b> <code>malloc</code> used without <code>free</code>. This causes memory exhaustion."); score -= 20; }
        if (code.contains("*") && code.contains("NULL")) { errors.add("<b>Modernization:</b> Use <code>nullptr</code> instead of <code>NULL</code> for pointer initialization."); score -= 5; }
        if (code.contains("free(") && code.contains("delete")) { errors.add("<b>Logic:</b> Mixing C-style free() and C++ delete. Use one consistently."); score -= 15; }
        if (code.contains("&") && code.contains("return")) { errors.add("<b>Risk:</b> Returning a reference to a local variable. This leads to Undefined Behavior."); score -= 35; }
        if (code.contains("->") && !code.contains("!= nullptr")) { errors.add("<b>Security:</b> Pointer access without null-check. Risk of Segmentation Fault."); score -= 20; }

        // --- 3. LOGIC & DATA TYPES (26-40) ---
        if (code.contains("if") && code.contains("=") && !code.contains("==")) { errors.add("<b>Critical Logic:</b> Assignment <code>=</code> inside <code>if</code> condition. Did you mean <code>==</code>?"); score -= 30; }
        if (code.contains("switch") && !code.contains("break;")) { errors.add("<b>Logic:</b> Switch case missing <code>break</code>. This will cause 'Fall-through' bugs."); score -= 15; }
       if (code.contains("while(1)") || code.contains("while (1)")) { errors.add("<b>Style:</b> Use <code>while(true)</code> instead of C-style 1 for better readability."); score -= 5; }
        if (code.contains("/ 0")) { errors.add("<b>Math:</b> Division by zero detected. Execution will crash."); score -= 40; }
        if (code.contains("char*") || code.contains("char ")) { errors.add("<b>Optimization:</b> Use <code>std::string</code> instead of C-style <code>char</code> for safer text handling."); score -= 10; }
        if (code.contains("scanf") || code.contains("printf")) { errors.add("<b>Style:</b> Mixing C (stdio) and C++ (iostream). Use <code>cin/cout</code> consistently."); score -= 5; }
        if (code.contains("goto")) { errors.add("<b>Architecture:</b> <code>goto</code> used. This creates 'Spaghetti Code'. Use loops or functions."); score -= 20; }
        if (code.contains("long long") && !code.contains("int")) { errors.add("<b>Portability:</b> Ensure <code>long long</code> is supported by your specific compiler (C++11 or higher)."); score -= 5; }

        // --- 4. SECURITY & STANDARDS (41-50) ---
        if (code.contains("gets(")) { errors.add("<b>Vulnerability:</b> <code>gets()</code> is highly dangerous (buffer overflow). Use <code>fgets()</code> or <code>cin.getline()</code>."); score -= 45; }
        if (code.contains("system(\"pause\")")) { errors.add("<b>Portability:</b> <code>system(\"pause\")</code> is Windows-only. Avoid for cross-platform code."); score -= 10; }
        if (code.contains("const") && code.contains("==") && code.contains("NULL")) { errors.add("<b>Security:</b> Hardcoded pointer checks found. Move to defensive programming."); score -= 5; }
        if (code.contains("struct") && !code.contains("class")) { errors.add("<b>Advice:</b> In C++, prefer <code>class</code> for encapsulated data and <code>struct</code> for simple POD."); score -= 5; }
        if (code.contains("#define")) { errors.add("<b>Modernization:</b> Prefer <code>const</code> or <code>constexpr</code> over <code>#define</code> macros for type safety."); score -= 5; }

        // --- PRO-TIP SELECTION ---
        if (!canRun) {
            proTip = "<b>C++ Architect Advice:</b> Fatal errors detected. C++ is not memory-safe; ensure headers and entry points are perfectly defined before building.";
        } else if (errors.size() > 0) {
            proTip = "<b>Performance Tip:</b> Code is runnable, but " + errors.size() + " vulnerabilities found. Focus on <code>RAII</code> patterns and memory deallocation.";
        } else {
            proTip = "<b>Optimized:</b> Excellent C++ structure. You are effectively utilizing the Standard Template Library (STL).";
        }
    }
      
      
      
      
else if (lang.equals("javascript")) {
        // --- 1. CORE SYNTAX & CONSOLE ERRORS (1-15) ---
        // The "Console" Check you requested: Finding console without a method
        if (code.contains("console") && !code.contains("console.") ) {
            errors.add("<b>Syntax Error:</b> <code>console</code> is an object. Did you mean <code>console.log()</code>, <code>console.error()</code>, or <code>console.warn()</code>?");
            score -= 25; canRun = false;
        }
        // Java Syntax in JS (Common mistake)
        if (code.contains("System.out.println")) {
            errors.add("<b>Fatal Error:</b> <code>System.out.println</code> is Java syntax. In JavaScript, use <code>console.log()</code>.");
            score -= 40; canRun = false;
        }
        // Unclosed Strings
        if ((code.length() - code.replace("\"", "").length()) % 2 != 0 || (code.length() - code.replace("'", "").length()) % 2 != 0) {
            errors.add("<b>Fatal Syntax:</b> Unclosed string literal detected. Ensure all quotes (' or \") are paired.");
            score -= 30; canRun = false;
        }
        // Braces Balance
        int openBraces = code.length() - code.replace("{", "").length();
        int closeBraces = code.length() - code.replace("}", "").length();
        if (openBraces != closeBraces) {
            errors.add("<b>Structure:</b> Mismatched curly braces { }. Function or Object blocks are not closed correctly.");
            score -= 25; canRun = false;
        }

        // --- 2. MODERN STANDARDS & SCOPING (16-30) ---
        if (code.contains("var ")) {
            errors.add("<b>Legacy Warning:</b> Avoid <code>var</code>. Use <code>let</code> for variables that change and <code>const</code> for fixed values to prevent scope-leakage.");
            score -= 10;
        }
        if (code.contains("==") && !code.contains("===")) {
            errors.add("<b>Type Safety:</b> Use <code>===</code> (Strict Equality) instead of <code>==</code>. Loose equality leads to unexpected type coercion bugs.");
            score -= 15;
        }
        if (code.contains("function") && !code.contains("=>") && code.length() > 100) {
            errors.add("<b>Modernization:</b> Consider using <code>Arrow Functions (() => {})</code> for cleaner lexical scoping and modern ES6 compliance.");
            score -= 5;
        }
        if (code.contains("new Array()")) {
            errors.add("<b>Optimization:</b> Use literal notation <code>[]</code> instead of <code>new Array()</code> for better performance and readability.");
            score -= 5;
        }

        // --- 3. SECURITY & PERFORMANCE (31-45) ---
        if (code.contains("eval(")) {
            errors.add("<b>Security Critical:</b> <code>eval()</code> is dangerous! It allows execution of arbitrary strings and opens your app to XSS attacks.");
            score -= 45;
        }
        if (code.contains("document.write")) {
            errors.add("<b>Performance Risk:</b> <code>document.write</code> is a legacy method that can block page rendering. Use <code>element.innerHTML</code> instead.");
            score -= 15;
        }
        if (code.contains("innerHTML") && code.contains("getParameter")) {
            errors.add("<b>XSS Risk:</b> Direct injection of user input into <code>innerHTML</code> is vulnerable to Cross-Site Scripting.");
            score -= 20;
        }
        if (code.contains("while(true)") && !code.contains("break")) {
            errors.add("<b>Runtime Risk:</b> Infinite loop detected. This will freeze the user's browser tab.");
            score -= 40;
        }
         // --- 4. LOGIC & BEST PRACTICES (46-50) ---
        if (code.contains("alert(")) {
            errors.add("<b>UX Warning:</b> <code>alert()</code> blocks the browser UI thread. Professional apps use custom Modals or Toasts.");
            score -= 10;
        }
        if (code.contains("parseInt(") && !code.contains(", 10")) {
            errors.add("<b>Best Practice:</b> Always specify the radix (base 10) in <code>parseInt(val, 10)</code> to avoid legacy browser bugs.");
            score -= 5;
        }
        if (code.contains("for(var i") || code.contains("for (var i")) {
            errors.add("<b>Scoping:</b> Variable 'i' in for-loop is function-scoped due to <code>var</code>. Change to <code>let</code>.");
            score -= 10;
        }

        // --- PRO-TIP SELECTION ---
        if (!canRun) {
            proTip = "<b>JS Architect Advice:</b> Your script contains Fatal Syntax errors. JavaScript is the engine of the web; ensure your objects and methods (like <code>console.log</code>) are properly called.";
        } else if (errors.size() > 0) {
            proTip = "<b>Web Performance Tip:</b> Your logic is valid, but " + errors.size() + " modern best-practice violations were found. Moving to ES6+ standards (let/const/===) improves security.";
        } else {
            proTip = "<b>Optimized:</b> Perfect JavaScript structure! Your code is ready for high-scale production deployment.";
        }
    }




        severity = !canRun ? "Critical" : (errors.isEmpty() ? "Optimized" : "Warning");
        String finalAnalysis = errors.isEmpty() ? "Deep scan complete. No critical logical vulnerabilities found." : "• " + String.join("<br>• ", errors);
        
        return String.format("{\"canRun\":%b, \"proTip\":\"%s\", \"logicAnalysis\":\"%s\", \"severity\":\"%s\", \"score\":%d, \"bugs\":%d}", 
                             canRun, proTip, finalAnalysis, severity, Math.max(0, score), errors.size());
    }
}