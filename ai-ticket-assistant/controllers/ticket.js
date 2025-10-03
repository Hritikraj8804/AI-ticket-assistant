import { inngest } from "../inngest/client.js";
import Ticket from "../models/ticket.js";
import User from "../models/user.js";

export const createTicket = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }
    const newTicket = await Ticket.create({
      title,
      description,
      createdBy: req.user._id.toString(),
    });

    // Send ticket creation email to user
    try {
      const { emailTemplates, sendMail } = await import('../utils/mailer.js');
      const user = await User.findById(req.user._id).select('email');
      const emailContent = emailTemplates.ticketCreated(user.email, newTicket);
      await sendMail(user.email, emailContent.subject, emailContent.text);
      console.log('✅ Ticket creation email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Ticket creation email failed:', emailError.message);
    }

    await inngest.send({
      name: "ticket/created",
      data: {
        ticketId: newTicket._id.toString(),
        title,
        description,
        createdBy: req.user._id.toString(),
      },
    });
    return res.status(201).json({
      message: "Ticket created and processing started",
      ticket: newTicket,
    });
  } catch (error) {
    console.error("Error creating ticket", encodeURIComponent(error.message));
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTickets = async (req, res) => {
  try {
    const user = req.user;
    let tickets = [];
    if (user.role !== "user") {
      tickets = await Ticket.find({})
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"])
        .sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ createdBy: user._id })
        .populate("assignedTo", ["email", "_id"])
        .select("title description status priority assignedTo createdAt")
        .sort({ createdAt: -1 });
    }
    return res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching tickets", encodeURIComponent(error.message));
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getTicket = async (req, res) => {
  try {
    const user = req.user;
    const ticketId = req.params.id;
    console.log(`Fetching ticket ${ticketId} for user ID ${user._id} (${user.role})`);
    
    let ticket;

    if (user.role !== "user") {
      ticket = await Ticket.findById(ticketId)
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"]);
    } else {
      ticket = await Ticket.findOne({
        createdBy: user._id,
        _id: ticketId,
      })
        .populate("assignedTo", ["email", "_id"])
        .populate("createdBy", ["email", "_id"]);
    }

    if (!ticket) {
      console.log(`Ticket ${ticketId} not found for user ID ${user._id}`);
      return res.status(404).json({ message: "Ticket not found" });
    }
    
    console.log(`✅ Ticket found and sending response`);
    console.log('Ticket data:', {
      id: ticket._id,
      title: ticket.title,
      status: ticket.status,
      priority: ticket.priority
    });
    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    if (req.user.role === 'user') {
      return res.status(403).json({ message: 'Only admins/moderators can update status' });
    }
    
    // Check if ticket is already cancelled
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    
    if (ticket.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot update status of cancelled ticket' });
    }
    
    const updatedTicket = await Ticket.findByIdAndUpdate(id, { status }, { new: true })
      .populate('createdBy', 'email')
      .populate('assignedTo', 'email');
    
    // Send email notifications based on status change
    try {
      const { emailTemplates, sendMail } = await import('../utils/mailer.js');
      
      if (status === 'DONE') {
        // Notify ticket creator that ticket is completed
        const emailContent = emailTemplates.ticketCompleted(
          updatedTicket.createdBy.email, 
          updatedTicket, 
          updatedTicket.assignedTo?.email
        );
        await sendMail(updatedTicket.createdBy.email, emailContent.subject, emailContent.text);
        console.log('✅ Completion email sent to:', updatedTicket.createdBy.email);
      } else if (status === 'CANCELLED') {
        // Notify ticket creator that ticket is cancelled
        const emailContent = emailTemplates.ticketCancelled(
          updatedTicket.createdBy.email, 
          updatedTicket
        );
        await sendMail(updatedTicket.createdBy.email, emailContent.subject, emailContent.text);
        console.log('✅ Cancellation email sent to:', updatedTicket.createdBy.email);
      }
    } catch (emailError) {
      console.error('❌ Status change email failed:', emailError.message);
    }
    
    return res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    console.error('Error updating status', error.message);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};
