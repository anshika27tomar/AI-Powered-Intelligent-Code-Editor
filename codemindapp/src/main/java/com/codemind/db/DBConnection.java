package com.codemind.db;

import java.sql.Connection;
import java.sql.DriverManager;

public class DBConnection {
    public static Connection getConnection() {
        Connection con = null;
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            // Change '12345' to your real MySQL password
            con = DriverManager.getConnection("jdbc:mysql://localhost:3306/codemind_db", "root", "hello");
        } catch (Exception e) {
            e.printStackTrace();
        }
        return con;
    }
}
