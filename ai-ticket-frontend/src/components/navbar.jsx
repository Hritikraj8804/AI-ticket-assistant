import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="navbar bg-base-100 shadow-lg">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-xl">
          AI Ticket Assistant
        </Link>
      </div>
      
      <div className="navbar-center">
        <div className="flex space-x-4">
          <Link to="/" className="btn btn-ghost">
            Tickets
          </Link>
          <Link to="/profile" className="btn btn-ghost">
            Profile
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" className="btn btn-ghost">
              Admin
            </Link>
          )}
        </div>
      </div>
      
      <div className="navbar-end">
        <div className="dropdown dropdown-end">
          <div tabIndex={0} role="button" className="btn btn-ghost">
            {user.email || "User"}
          </div>
          <ul className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow">
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}