import { useState, useEffect } from "react";

export default function ProfilePage() {
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const availableSkills = [
    "React", "Node.js", "JavaScript", "Python", "MongoDB", "PostgreSQL",
    "AWS", "Docker", "UI/UX", "Mobile", "DevOps", "Security", "Java",
    "PHP", "Vue.js", "Angular", "TypeScript", "Redis", "Kubernetes"
  ];

  useEffect(() => {
    setSkills(user.skills || []);
  }, []);

  const handleSkillToggle = (skill) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/update-profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setMessage("Profile updated successfully!");
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage(data.error || "Update failed");
      }
    } catch (err) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>
      
      <div className="card bg-base-100 shadow">
        <div className="card-body">
          <h2 className="card-title">Update Your Skills</h2>
          <p className="text-base-content/70 mb-4">
            Select skills that match your expertise. This helps us assign relevant tickets to you.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {availableSkills.map(skill => (
              <label key={skill} className="cursor-pointer">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary mr-2"
                  checked={skills.includes(skill)}
                  onChange={() => handleSkillToggle(skill)}
                />
                <span className="label-text">{skill}</span>
              </label>
            ))}
          </div>

          <div className="card-actions justify-end mt-6">
            <button 
              className="btn btn-primary" 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Skills"}
            </button>
          </div>

          {message && (
            <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-error'} mt-4`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}