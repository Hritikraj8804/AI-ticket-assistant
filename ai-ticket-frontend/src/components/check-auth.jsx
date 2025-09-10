import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./navbar.jsx";

function CheckAuth({ children, protected: protectedRoute }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (protectedRoute) {
      if (!token) {
        navigate("/login");
      } else {
        setLoading(false);
      }
    } else {
      if (token) {
        // Redirect based on user role
        if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setLoading(false);
      }
    }
  }, [navigate, protectedRoute]);

  if (loading) {
    return <div>loading...</div>;
  }
  return (
    <>
      {protectedRoute && <Navbar />}
      {children}
    </>
  );
}

export default CheckAuth;
