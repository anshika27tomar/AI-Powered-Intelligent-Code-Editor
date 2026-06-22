
package com.codemind.servlets;
//import com.codemind.db.DBConnection;
import com.google.gson.JsonObject;
import java.io.*;
import java.sql.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;

@WebServlet("/GetReportServlet")
public class GetReportServlet extends HttpServlet {
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 1. Get the current logged-in user
        HttpSession session = request.getSession(false);
        String email = (session != null) ? (String) session.getAttribute("userEmail") : null;

        JsonObject json = new JsonObject();
        if (email == null) {
            json.addProperty("error", "Not logged in");
        } else {
            try {
                Class.forName("com.mysql.cj.jdbc.Driver");
                Connection conn = DriverManager.getConnection("jdbc:mysql://localhost:3306/codemind_db", "root", "hello");
                
                // SQL: Get the LATEST record for this specific user
              String sql = "SELECT * FROM analysis_reports WHERE user_email = ? ORDER BY analysis_date DESC LIMIT 1";
                //String sql = "SELECT *, " + "SUM(bugs_found) as total_bugs, " + FROM analysis_reports WHERE user_email = ? ORDER BY analysis_date DESC LIMIT 1";  
              PreparedStatement pst = conn.prepareStatement(sql);
                pst.setString(1, email);
                ResultSet rs = pst.executeQuery();

                if (rs.next()) {
                    json.addProperty("score", rs.getInt("security_score"));
                    json.addProperty("bugs", rs.getInt("bugs_found"));
                    json.addProperty("latency", rs.getInt("latency_ms"));
                    json.addProperty("fileName", rs.getString("file_name"));
                } else {
                    // Fallback if user hasn't run any code yet
                    json.addProperty("score", 0);
                    json.addProperty("bugs", 0);
                    json.addProperty("latency", 0);
                }
                conn.close();
            } catch (Exception e) { e.printStackTrace(); }
        }

        response.setContentType("application/json");
        response.getWriter().write(json.toString());
    }
}