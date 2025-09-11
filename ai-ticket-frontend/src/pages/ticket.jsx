import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
// import ReactMarkdown from "react-markdown";

export default function TicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = useMemo(() => localStorage.getItem("token"), []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/tickets/${id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const data = await res.json();
        if (res.ok) {
          setTicket(data.ticket);
        } else {
          console.error('Failed to fetch ticket:', data.message);
        }
      } catch (err) {
        console.error('Error fetching ticket:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTicket();
  }, [id, token]);

  if (loading)
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  
  if (!ticket) 
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Ticket not found</h2>
          <p>The ticket you're looking for doesn't exist or you don't have permission to view it.</p>
          <p className="text-sm mt-2">Ticket ID: {id}</p>
          <a href="/" className="btn btn-primary mt-4">Back to Tickets</a>
        </div>
      </div>
    );


  
  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="navbar-start">
          <a href="/" className="btn btn-ghost normal-case text-xl">← Back to Tickets</a>
        </div>
        <div className="navbar-center">
          <span className="text-lg font-semibold">Ticket Details</span>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">

            <h2 className="card-title text-2xl mb-4">{ticket.title}</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-base-content/80">{ticket.description}</p>
                </div>
                
                {ticket.helpfulNotes && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">AI Generated Notes</h3>
                    <div className="bg-base-200 p-4 rounded-lg">
                      <div className="prose max-w-none">{ticket.helpfulNotes}</div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Sidebar */}
              <div className="space-y-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <h3 className="font-semibold mb-3">Ticket Info</h3>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`badge ${
                          ticket.status === 'DONE' ? 'badge-success' : 
                          ticket.status === 'IN_PROGRESS' ? 'badge-warning' : 
                          ticket.status === 'CANCELLED' ? 'badge-error' : 'badge-info'
                        }`}>
                          {ticket.status || 'TODO'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Priority:</span>
                        <span className={`badge ${
                          ticket.priority === 'high' ? 'badge-error' : 
                          ticket.priority === 'medium' ? 'badge-warning' : 'badge-success'
                        }`}>
                          {ticket.priority || 'medium'}
                        </span>
                      </div>
                      
                      {ticket.assignedTo && (
                        <div className="flex justify-between">
                          <span>Assigned:</span>
                          <span className="text-sm">{ticket.assignedTo.email}</span>
                        </div>
                      )}
                      
                      {ticket.createdBy && (
                        <div className="flex justify-between">
                          <span>Creator:</span>
                          <span className="text-sm">{ticket.createdBy.email}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span className="text-sm">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {ticket.relatedSkills?.length > 0 && (
                  <div className="card bg-base-200">
                    <div className="card-body p-4">
                      <h3 className="font-semibold mb-3">Required Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {ticket.relatedSkills.map((skill, index) => (
                          <span key={index} className="badge badge-outline">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
