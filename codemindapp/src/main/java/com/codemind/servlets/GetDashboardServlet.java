
package com.codemind.servlets;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.codemind.db.DBConnection; // Using the Guardian connection class
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.*;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;

@WebServlet("/GetDashboardServlet")
public class GetDashboardServlet extends HttpServlet {

    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        // 1. Identify current logged-in user
        HttpSession session = request.getSession(false);
        String email = (session != null && session.getAttribute("userEmail") != null) 
                       ? (String) session.getAttribute("userEmail") : "gaurav_pro@gmail.com";

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();
        JsonObject jsonResponse = new JsonObject();

        try (Connection conn = DBConnection.getConnection()) {
            if (conn == null) {
                out.print("{\"error\":\"DB Connection Failed\"}");
                return;
            }

            // 2. MASTER QUERY: Stats + Language Distribution (Including JavaScript)
            String statsSql = "SELECT " +
                "COUNT(*) as total, " +
                "AVG(security_score) as avg_score, " +
                "SUM(CASE WHEN security_score >= 90 THEN 1 ELSE 0 END) as opts_count, " +
                "SUM(CASE WHEN file_name LIKE '%.java' THEN 1 ELSE 0 END) as java_cnt, " +
                "SUM(CASE WHEN file_name LIKE '%.py' THEN 1 ELSE 0 END) as py_cnt, " +
                "SUM(CASE WHEN file_name LIKE '%.cpp' THEN 1 ELSE 0 END) as cpp_cnt, " +
                "SUM(CASE WHEN file_name LIKE '%.js' THEN 1 ELSE 0 END) as js_cnt " +
                "FROM analysis_reports WHERE user_email = ?";

            PreparedStatement pst1 = conn.prepareStatement(statsSql);
            pst1.setString(1, email);
            ResultSet rs1 = pst1.executeQuery();

            if (rs1.next()) {
                int total = rs1.getInt("total");
                // Update Main Stat Boxes
                jsonResponse.addProperty("totalPrograms", total);
                jsonResponse.addProperty("aiOptimizations", rs1.getInt("opts_count"));
                jsonResponse.addProperty("overallAccuracy", total > 0 ? (int) Math.round(rs1.getDouble("avg_score")) : 100);

                // Add Data for Language Distribution (Doughnut Chart)
                JsonArray langArr = new JsonArray();
                langArr.add(rs1.getInt("java_cnt"));  // Index 0: Green
                langArr.add(rs1.getInt("py_cnt"));    // Index 1: Purple
                langArr.add(rs1.getInt("cpp_cnt"));   // Index 2: Blue
                langArr.add(rs1.getInt("js_cnt"));    // Index 3: Yellow
                jsonResponse.add("langDistribution", langArr);
            }

            // 3. HISTORY QUERY: Fetch last 30 runs for the Productivity Trend (Zig-Zag)
            JsonArray historyArr = new JsonArray();
            String historySql = "SELECT security_score FROM analysis_reports WHERE user_email = ? ORDER BY analysis_date ASC LIMIT 50";
            PreparedStatement pst2 = conn.prepareStatement(historySql);
            pst2.setString(1, email);
            ResultSet rs2 = pst2.executeQuery();

            while (rs2.next()) {
                historyArr.add(rs2.getInt("security_score"));
            }
            jsonResponse.add("historyScores", historyArr);

        } catch (Exception e) {
            e.printStackTrace();
            // Safety fallback if DB is empty
            jsonResponse.addProperty("totalPrograms", 0);
            jsonResponse.addProperty("aiOptimizations", 0);
            jsonResponse.addProperty("overallAccuracy", 100);
        }

        out.print(jsonResponse.toString());
        out.flush();
    }
}