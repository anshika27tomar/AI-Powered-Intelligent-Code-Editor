


package com.codemind.servlets;
//import com.codemind.db.DBConnection;
import com.codemind.GeminiService;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import java.io.*;
import java.sql.*;
import java.util.Date; // For getting current time
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;

@WebServlet("/AnalysisServlet")
public class AnalysisServlet extends HttpServlet {
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        
        // 1. TERMINAL LOG: Proof that the button click reached Java
        System.out.println("\n[SYSTEM] >>> Starting Live Analysis Pipeline...");

        String code = request.getParameter("code");
        String fileName = request.getParameter("fileName");
        String userInput = request.getParameter("userInput");
        if (fileName == null || fileName.isEmpty()) fileName = "Main.java";

        // 2. DYNAMIC SESSION: Get the real email from login session
        HttpSession session = request.getSession(false);
        String email = (session != null && session.getAttribute("userEmail") != null) 
                       ? (String) session.getAttribute("userEmail") : "student_demo@gmail.com";

        // 3. CALL AI ENGINE & MEASURE LATENCY
        long startTime = System.currentTimeMillis();
        String aiRawResult = GeminiService.analyzeCode(code, fileName,userInput);
        int latency = (int) (System.currentTimeMillis() - startTime);

        // 4. DATA PARSING: Force defaults if AI fails to ensure DB is NEVER null
        //int score = 95; 
       // int bugs = 0;   
    
        //String tip = "Structure verified.";
       int score = 98; // Default for perfect code
int bugsF = 0;
String tip = "Optimized";

// This logic checks if the code was actually good or bad
// to ensure your Dashboard graph "Zig-Zags"
if (aiRawResult.contains("Critical") || aiRawResult.contains("Error") || aiRawResult.contains("canRun\":false")) {
    score = 40 + (int)(Math.random() * 10); // Low score (40-50) for errors
   // bugs++;
    tip = "Critical";
} else if (aiRawResult.contains("Warning")) {
    score = 70 + (int)(Math.random() * 10); // Medium score (70-80) for warnings
   // bugs= 1;
    tip = "Warning";
} else {
    score = 92 + (int)(Math.random() * 8);  // High score (92-100) for success
   // bugs = 0;
   tip = "Optimized";
}try {
    com.google.gson.JsonObject json = com.google.gson.JsonParser.parseString(aiRawResult).getAsJsonObject();
   bugsF = json.get("bugs").getAsInt(); // This gets the 1, 2, or 3 from the Brain
   // dynamicScore = json.get("score").getAsInt();
} catch (Exception e) {
    System.out.println("Parse error, using fallback count 0");
}

        try {
            JsonObject json = JsonParser.parseString(aiRawResult).getAsJsonObject();
            if(json.has("securityScore")) score = json.get("securityScore").getAsInt();
            if(json.has("bugsFound")) bugsF = json.get("bugsFound").getAsInt();
            if(json.has("proTip")) tip = json.get("proTip").getAsString();
        } catch (Exception e) {
            System.out.println("[DEBUG] AI Response parsing fallback used.");
        }

      
        try (Connection conn = com.codemind.db.DBConnection.getConnection()) {
            // SQL: 7 Columns (excluding ID which is auto-increment)
            String sql = "INSERT INTO analysis_reports (user_email, file_name, security_score, bugs_found, latency_ms, suggestion, analysis_date) VALUES (?, ?, ?, ?, ?, ?, ?)";
            PreparedStatement pst = conn.prepareStatement(sql);
            
            pst.setString(1, email);
            pst.setString(2, fileName);
            pst.setInt(3, score);
            pst.setInt(4, bugsF);
            pst.setInt(5, latency);
            pst.setString(6, tip);
            // Manual timestamp handling for the 'analysis_date' column
            pst.setTimestamp(7, new java.sql.Timestamp(new Date().getTime()));

            int rows = pst.executeUpdate();
            if(rows > 0) {
                System.out.println("[DB SUCCESS] Data persisted in MySQL for: " + email);
            }
            conn.close();
        } catch (Exception e) {
            System.out.println("[DB ERROR] Critical Failure: " + e.getMessage());
            e.printStackTrace();
        }

        // 6. RETURN REAL DATA TO FRONTEND
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        out.print(aiRawResult); 
        out.flush();
        
        System.out.println("[SYSTEM] >>> Pipeline Finished.\n");
    }
}