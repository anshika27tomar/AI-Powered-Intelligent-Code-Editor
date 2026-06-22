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

@WebServlet("/ResetPasswordServlet")
public class ResetPasswordServlet extends HttpServlet {

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        response.setContentType("text/plain");
        PrintWriter out = response.getWriter();

        String email = request.getParameter("email");
        String newPassword = request.getParameter("password");

        try (Connection con = DBConnection.getConnection()) {
            // THE SQL UPDATE COMMAND
            String sql = "UPDATE users SET password = ? WHERE email = ?";
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setString(1, newPassword);
            ps.setString(2, email);

            int result = ps.executeUpdate();

            if (result > 0) {
                out.print("success");
            } else {
                out.print("fail");
            }
        } catch (Exception e) {
            e.printStackTrace();
            out.print("error");
        }
    }
}