import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addCSRFHeaders } from "../utils/csrf.js";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", skills: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        
        // Redirect based on user role
        if (data.user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        alert(data.message || "Signup failed");
      }
    } catch (err) {
      console.error('Signup error:', err);
      console.error('URL:', `${import.meta.env.VITE_SERVER_URL}/auth/signup`);
      alert(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-sm shadow-xl bg-base-100">
        <form onSubmit={handleSignup} className="card-body">
          <h2 className="card-title justify-center">Sign Up</h2>

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="input input-bordered"
            value={form.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            className="input input-bordered"
            value={form.password}
            onChange={handleChange}
            required
          />

          <div className="form-control">
            <label className="label">
              <span className="label-text">Your Skills (optional)</span>
            </label>
            <select
              multiple
              name="skills"
              className="select select-bordered h-24"
              value={form.skills || []}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setForm({ ...form, skills: selected });
              }}
            >
              <option value="React">React</option>
              <option value="Node.js">Node.js</option>
              <option value="JavaScript">JavaScript</option>
              <option value="Python">Python</option>
              <option value="MongoDB">MongoDB</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="AWS">AWS</option>
              <option value="Docker">Docker</option>
              <option value="UI/UX">UI/UX Design</option>
              <option value="Mobile">Mobile Development</option>
              <option value="DevOps">DevOps</option>
              <option value="Security">Security</option>
            </select>
            <label className="label">
              <span className="label-text-alt">Hold Ctrl/Cmd to select multiple</span>
            </label>
          </div>

          <div className="form-control mt-4">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm">
              Already have an account?{" "}
              <a href="/login" className="link link-primary">
                Login
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
