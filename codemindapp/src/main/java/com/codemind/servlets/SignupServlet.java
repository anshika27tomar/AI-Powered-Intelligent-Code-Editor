package com.codemind.servlets;

import com.codemind.db.DBConnection;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/SignupServlet")
public class SignupServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/plain;charset=UTF-8");
        PrintWriter out = response.getWriter();

        // 1. Capture the data from main.js
        String name = request.getParameter("f_name");
        String email = request.getParameter("f_email");
        String pass = request.getParameter("f_pass");

        // --- DEBUG LOGGING: CHECK YOUR TERMINAL FOR THESE ---
        System.out.println("--- NEW SIGNUP ATTEMPT ---");
        System.out.println("Received Name: [" + name + "]");
        System.out.println("Received Email: [" + email + "]");

        // 2. THE ULTIMATE BLOCK: Stop empty entries here
        if (name == null || name.trim().isEmpty() || email == null || email.trim().isEmpty()||pass==null||pass.trim().isEmpty()) {
            System.out.println("STATUS: Validation FAILED. Request Rejected.");
            out.print("missing_data");
            return; // EXIT IMMEDIATELY
        }

        // 3. Database logic (Only runs if data is NOT empty)
        try (Connection con = DBConnection.getConnection()) {
            String sql = "INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, name.trim());
            ps.setString(2, email.trim());
            ps.setString(3, pass);
            
            int status = ps.executeUpdate();
            if(status > 0) {
                System.out.println("STATUS: User successfully saved to MySQL.");
                out.print("success");
            }
        } catch (Exception e) {
            System.out.println("STATUS: SQL Error -> " + e.getMessage());
            //e.printStackTrace();
            out.print("db_error");
          // out.print(e.toString());
        }
    }
}
