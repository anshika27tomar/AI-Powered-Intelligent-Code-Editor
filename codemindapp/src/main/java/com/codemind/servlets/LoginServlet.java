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
import javax.servlet.http.HttpSession;

@WebServlet("/LoginServlet")
public class LoginServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/plain;charset=UTF-8");
        PrintWriter out = response.getWriter();

     
String email = request.getParameter("l_email");
    String pass = request.getParameter("l_pass");
    System.out.println("--- LOGIN ATTEMPT ---");
    System.out.println("Received l_email: [" + email + "]");
    System.out.println("Received l_pass: [" + pass + "]");

    if (email == null || pass == null) {
        System.out.println("STATUS: Java received NULL values from browser.");
        out.print("fail");
        return;
    }
        try (Connection con = DBConnection.getConnection()) {
            String sql = "SELECT * FROM users WHERE email=? AND password=?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, email);
            ps.setString(2, pass);
            ResultSet rs = ps.executeQuery();

            if (rs.next()) {
                HttpSession session = request.getSession();
                session.setAttribute("userEmail", email);
                session.setAttribute("userName", rs.getString("fullname"));
                out.print("success");
            } else {
                out.print("invalid");
            }
        } catch (Exception e) {
            out.print("error");
        }
    }
}