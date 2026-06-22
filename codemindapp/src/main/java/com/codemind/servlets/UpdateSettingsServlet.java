package com.codemind.servlets;
//import com.codemind.db.DBConnection; // Using the Guardian Connection we made
import java.io.IOException;
import java.sql.Connection;
import java.sql.PreparedStatement;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

@WebServlet("/UpdateSettingsServlet")
public class UpdateSettingsServlet extends HttpServlet {

   
protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
    // CRITICAL: If the button works, you WILL see this in your VS Code terminal
    System.out.println("=========================================");
    System.out.println("SERVER ALERT: Settings Update Request Received!");
    System.out.println("=========================================");

    HttpSession session = request.getSession(true);
    String email = (String) session.getAttribute("userEmail");
    
    // FORCE EMAIL FOR DEMO (If session is lost, this ensures it still saves)
    if (email == null) {
        email = "gaurav@gmail.com"; 
        session.setAttribute("userEmail", email);
    }

    String theme = request.getParameter("theme");
    String fontSize = request.getParameter("fontSize");
    String aiSensitivity = request.getParameter("aiSensitivity");
    String lang = request.getParameter("lang");

    try (Connection conn = com.codemind.db.DBConnection.getConnection()) {
        String sql = "UPDATE users SET theme_pref = ?, font_size = ?, ai_sensitivity = ?, primary_lang = ? WHERE email = ?";
        PreparedStatement pst = conn.prepareStatement(sql);
        pst.setString(1, theme);
        pst.setInt(2, Integer.parseInt(fontSize));
        pst.setInt(3, Integer.parseInt(aiSensitivity));
        pst.setString(4, lang);
        pst.setString(5, email);

        int rows = pst.executeUpdate();
        if (rows > 0) {
            System.out.println(">>> [DATABASE SUCCESS] Settings saved to MySQL for: " + email);
            response.getWriter().write("success");
        }
    } catch (Exception e) {
        System.out.println(">>> [DATABASE ERROR]: " + e.getMessage());
        e.printStackTrace();
    }
}
}