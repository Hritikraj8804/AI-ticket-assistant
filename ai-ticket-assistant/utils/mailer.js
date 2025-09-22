import nodemailer from "nodemailer";

// Create transporter singleton
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    // Validate required environment variables
    if (!process.env.MAILTRAP_SMTP_HOST || !process.env.MAILTRAP_SMTP_PORT || 
        !process.env.MAILTRAP_SMTP_USER || !process.env.MAILTRAP_SMTP_PASS) {
      throw new Error('Missing required SMTP configuration');
    }
    
    transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_SMTP_HOST,
      port: process.env.MAILTRAP_SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_SMTP_USER,
        pass: process.env.MAILTRAP_SMTP_PASS,
      },
    });
  }
  return transporter;
};

export const sendMail = async (to, subject, text) => {
  try {
    const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: '"AI Ticket Assistant" <noreply@ticketsystem.com>',
      to,
      subject,
      text,
    });

    console.log("Message sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Mail error", error.message);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  ticketAssigned: (moderatorEmail, ticket) => ({
    subject: `🎫 New Ticket Assigned: ${ticket.title}`,
    text: `Hi ${moderatorEmail},

A new ticket has been assigned to you:

📋 Title: ${ticket.title}
📝 Description: ${ticket.description}
⚡ Priority: ${ticket.priority || 'medium'}
👤 Created by: ${ticket.createdBy?.email || 'Unknown'}
🏷️ Skills: ${ticket.relatedSkills?.join(', ') || 'None'}

${ticket.helpfulNotes ? `💡 AI Notes:\n${ticket.helpfulNotes}\n\n` : ''}🔗 View Ticket: ${process.env.FRONTEND_URL}/tickets/${ticket._id}

Please review and update the status as you work on it.

Best regards,
AI Ticket Assistant`
  }),

  ticketCreated: (userEmail, ticket) => ({
    subject: `✅ Ticket Created: ${ticket.title}`,
    text: `Hi ${userEmail},

Your ticket has been created successfully:

📋 Title: ${ticket.title}
📝 Description: ${ticket.description}
⚡ Priority: ${ticket.priority || 'medium'}
🎯 Status: TODO

Our AI system is analyzing your ticket and will assign it to the most suitable moderator based on the required skills.

🔗 Track Progress: ${process.env.FRONTEND_URL}/tickets/${ticket._id}

You'll receive updates as your ticket progresses.

Best regards,
AI Ticket Assistant`
  }),

  ticketCompleted: (userEmail, ticket, moderatorEmail) => ({
    subject: `🎉 Ticket Completed: ${ticket.title}`,
    text: `Hi ${userEmail},

Great news! Your ticket has been completed:

📋 Title: ${ticket.title}
✅ Status: DONE
👨‍💻 Resolved by: ${moderatorEmail}

${ticket.helpfulNotes ? `💡 Resolution Notes:\n${ticket.helpfulNotes}\n\n` : ''}🔗 View Details: ${process.env.FRONTEND_URL}/tickets/${ticket._id}

If you have any questions about the resolution, please don't hesitate to create a new ticket.

Best regards,
AI Ticket Assistant`
  }),

  ticketCancelled: (userEmail, ticket, reason) => ({
    subject: `❌ Ticket Cancelled: ${ticket.title}`,
    text: `Hi ${userEmail},

Your ticket has been cancelled:

📋 Title: ${ticket.title}
❌ Status: CANCELLED
${reason ? `📝 Reason: ${reason}\n` : ''}\n🔗 View Details: ${process.env.FRONTEND_URL}/tickets/${ticket._id}

If you believe this was done in error or need further assistance, please create a new ticket.

Best regards,
AI Ticket Assistant`
  })
};