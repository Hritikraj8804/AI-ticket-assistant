import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addCSRFHeaders } from "../utils/csrf.js";

export default function Tickets() {
  const [form, setForm] = useState({ title: "", description: "" });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("assigned");

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
        method: "GET",
      });
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        method: "POST",
        headers: addCSRFHeaders({
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }),
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setForm({ title: "", description: "" });
        fetchTickets(); // Refresh list
      } else {
        alert(data.message || "Ticket creation failed");
      }
    } catch (err) {
      alert("Error creating ticket");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets based on user role and tab
  const getFilteredTickets = () => {
    if (user.role === "user") {
      return tickets; // Users see all their tickets
    }
    
    if (user.role === "moderator") {
      if (activeTab === "assigned") {
        return tickets.filter(ticket => ticket.assignedTo?._id === user._id);
      } else {
        return tickets; // All tickets tab
      }
    }
    
    return tickets; // Admin sees all
  };

  const updateTicketStatus = async (ticketId, newStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTickets(); // Refresh tickets
      }
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      {/* User Interface - Create Tickets */}
      {user.role === "user" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Create Ticket</h2>
          <form onSubmit={handleSubmit} className="space-y-3 mb-8">
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="Ticket Title"
              className="input input-bordered w-full"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Ticket Description"
              className="textarea textarea-bordered w-full"
              required
            ></textarea>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit Ticket"}
            </button>
          </form>
          
          <h2 className="text-xl font-semibold mb-2">My Tickets</h2>
        </>
      )}

      {/* Moderator Interface - Ticket Management */}
      {user.role === "moderator" && (
        <>
          <h2 className="text-2xl font-bold mb-4">Moderator Dashboard</h2>
          
          {/* Tabs for Moderator */}
          <div className="tabs tabs-bordered mb-6">
            <button 
              className={`tab tab-bordered ${activeTab === "assigned" ? 'tab-active' : ''}`}
              onClick={() => setActiveTab("assigned")}
            >
              🎯 My Assigned Tickets
            </button>
            <button 
              className={`tab tab-bordered ${activeTab === "all" ? 'tab-active' : ''}`}
              onClick={() => setActiveTab("all")}
            >
              📋 All Tickets
            </button>
          </div>
        </>
      )}

      {/* Admin Interface */}
      {user.role === "admin" && (
        <h2 className="text-2xl font-bold mb-4">All Tickets Overview</h2>
      )}

      {/* Tickets Display */}
      <div className="space-y-3">
        {getFilteredTickets().map((ticket) => (
          <div key={ticket._id} className="card shadow-md p-4 bg-base-100">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <Link to={`/tickets/${ticket._id}`} className="hover:text-primary">
                  <h3 className="font-bold text-lg">{ticket.title}</h3>
                </Link>
                <p className="text-sm mb-2">{ticket.description}</p>
                
                <div className="flex gap-2 mb-2">
                  <span className={`badge ${
                    ticket.priority === 'high' ? 'badge-error' : 
                    ticket.priority === 'medium' ? 'badge-warning' : 'badge-success'
                  }`}>
                    {ticket.priority || 'medium'}
                  </span>
                  
                  <span className={`badge ${
                    ticket.status === 'DONE' ? 'badge-success' : 
                    ticket.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {ticket.status || 'TODO'}
                  </span>
                  
                  {ticket.assignedTo && (
                    <span className="badge badge-outline">
                      👤 {ticket.assignedTo.email}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-base-content/70">
                  Created: {new Date(ticket.createdAt).toLocaleString()}
                  {ticket.createdBy && ` by ${ticket.createdBy.email}`}
                </p>
              </div>
              
              {/* Status Update for Moderators */}
              {user.role === "moderator" && ticket.assignedTo?._id === user._id && (
                <div className="ml-4">
                  <select 
                    className="select select-bordered select-sm"
                    value={ticket.status || 'TODO'}
                    onChange={(e) => updateTicketStatus(ticket._id, e.target.value)}
                  >
                    <option value="TODO">TODO</option>
                    <option value="IN_PROGRESS">IN PROGRESS</option>
                    <option value="DONE">DONE</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {getFilteredTickets().length === 0 && (
          <div className="text-center py-8">
            <p className="text-base-content/70">
              {user.role === "moderator" && activeTab === "assigned" 
                ? "No tickets assigned to you yet." 
                : "No tickets found."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
