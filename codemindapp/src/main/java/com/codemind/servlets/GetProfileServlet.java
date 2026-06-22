package com.codemind.servlets;

import java.io.IOException;
import java.io.PrintWriter;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.google.gson.JsonObject;

@WebServlet("/GetProfileServlet")
public class GetProfileServlet extends HttpServlet {

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        // 1. Set response type to JSON
        response.setContentType("application/json;charset=UTF-8");
        PrintWriter out = response.getWriter();
        
        // 2. Access the current session (false means don't create a new one if it doesn't exist)
        HttpSession session = request.getSession(false);
        
        JsonObject json = new JsonObject();

        // 3. Check if the user is actually logged in
        if (session != null && session.getAttribute("userEmail") != null) {
            String name = (String) session.getAttribute("userName");
            String email = (String) session.getAttribute("userEmail");

            json.addProperty("loggedIn", true);
            json.addProperty("userName", name);
            json.addProperty("userEmail", email);
        } else {
            json.addProperty("loggedIn", false);
        }

        // 4. Send the JSON data to JavaScript
        out.print(json.toString());
    }
}