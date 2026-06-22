

package com.codemind.servlets;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.PrintWriter;
//import javax.servlet.*;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
//import java.io.*;
//import javax.servlet.http.*;

@WebServlet("/HelloServlet")
public class HelloServlet extends HttpServlet {
@Override
    protected void doPost(HttpServletRequest req, HttpServletResponse res) throws IOException {

        BufferedReader reader = req.getReader();
        StringBuilder data = new StringBuilder();
        String line;

        while ((line = reader.readLine()) != null) {
            data.append(line);
        }

        String body = data.toString();

        // ✅ SAFE PARSING
        String code = "";
        String type = "";
try {
    // Standard JSON format is {"code":"...","type":"..."}
    int codeIndex = body.indexOf("\"code\":\"") + 8;
    int codeEnd = body.indexOf("\",\"type\"");
    code = body.substring(codeIndex, codeEnd);

    int typeIndex = body.indexOf("\"type\":\"") + 8;
    int typeEnd = body.lastIndexOf("\"}");
    type = body.substring(typeIndex, typeEnd);
    
    // Debugging: This will show in your Tomcat Console
    System.out.println("Received Type: " + type);
} catch (Exception e) {
    // This is the error you were seeing!
    PrintWriter out = res.getWriter();
    out.print("{\"errors\":[{\"msg\":\"Parsing Error\",\"explain\":\"The server could not read the code data format.\"}]}");
    return;
}
       

        // 🔍 DEBUG (optional - check karna ho toh uncomment)
        // System.out.println("TYPE: " + type);
        // System.out.println("CODE: " + code);

        res.setContentType("application/json");
        PrintWriter out = res.getWriter();

        StringBuilder response = new StringBuilder();
        response.append("{\"errors\":[");

        boolean hasError = false;

        // ================= HTML =================
if(type.equals("html")){

    // DOCTYPE
    if (!code.toLowerCase().contains("<!doctype html>")) {
        response.append("{\"msg\":\"Missing DOCTYPE\",\"explain\":\"DOCTYPE define nahi hai.\"},");
        hasError = true;
    }

    // html
    if(code.contains("<html") && !code.contains("</html>")){
        response.append("{\"msg\":\"Missing </html>\",\"explain\":\"HTML close tag missing hai.\"},");
        hasError = true;
    }

    // head
    if(code.contains("<head") && !code.contains("</head>")){
        response.append("{\"msg\":\"Missing </head>\",\"explain\":\"Head tag close nahi hua.\"},");
        hasError = true;
    }

    // body
    if(code.contains("<body") && !code.contains("</body>")){
        response.append("{\"msg\":\"Missing </body>\",\"explain\":\"Body tag close nahi hua.\"},");
        hasError = true;
    }

    // h1
    if(code.contains("<h1") && !code.contains("</h1>")){
        response.append("{\"msg\":\"Missing </h1>\",\"explain\":\"H1 tag close nahi hua.\"},");
        hasError = true;
    }

    // p
    if(code.contains("<p") && !code.contains("</p>")){
        response.append("{\"msg\":\"Missing </p>\",\"explain\":\"Paragraph tag close nahi hua.\"},");
        hasError = true;
    }

    // div
    if(code.contains("<div") && !code.contains("</div>")){
        response.append("{\"msg\":\"Missing </div>\",\"explain\":\"Div tag close nahi hua.\"},");
        hasError = true;
    }

    // button
    if(code.contains("<button") && !code.contains("</button>")){
        response.append("{\"msg\":\"Missing </button>\",\"explain\":\"Button tag close nahi hua.\"},");
        hasError = true;
    }
}        // ================= CSS =================
        else if(type.equals("css")){

            int open = 0;
            int close = 0;

            for(char c : code.toCharArray()){
                if(c == '{') open++;
                if(c == '}') close++;
            }

            if(open != close){
                response.append("{\"msg\":\"Bracket mismatch\",\"explain\":\"{ aur } equal nahi hai.\"},");
                hasError = true;
            }

            if(!code.contains(":")){
                response.append("{\"msg\":\"Invalid CSS\",\"explain\":\"Property value missing lag rahi hai.\"},");
                hasError = true;
            }
        }
  // ================= JS =================
        else if(type.equals("js")){

            if (!code.contains(";")) {
                response.append("{\"msg\":\"Missing semicolon\",\"explain\":\"Statement end nahi hua.\"},");
                hasError = true;
            }
        }

        if (hasError) {
            response.setLength(response.length() - 1);
        }

        response.append("]}");

        out.print(response.toString());
        out.flush();
    }
}   
