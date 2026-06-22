package com.codemind.servlets;

import com.codemind.db.DBConnection;
import java.io.IOException;
import java.io.PrintWriter;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

@WebServlet("/OTPServlet")
public class OTPServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/plain;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        // 1. Capture the email from forgot password form
        String email = request.getParameter("f_email");

        System.out.println("--- OTP REQUEST ---");
        System.out.println("Received Email for OTP: [" + email + "]");

        if (email == null || email.trim().isEmpty()) {
            out.print("empty_email");
            return;
        }

        // 2. DATABASE CHECK: Check if the email exists in our users table
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT * FROM users WHERE email=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, email.trim());
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
            int randomOTP=(int)(Math.random()*900000)+100000;
        System.out.println("SECURITY ENGINE:Generated OTP is:"+randomOTP);
                // In a real project, you would trigger an email sending service here.
                // For your BCA Demo, we return "success" to start the 30s JS timer.
                System.out.println("STATUS: User found. Sending OTP success signal.");
                out.print("otp_sent");
            } else {
                System.out.println("STATUS: No user found with this email.");
                out.print("user_not_found");
            }
        } catch (Exception e) {
            e.printStackTrace();
            out.print("error");
        }
    }
}