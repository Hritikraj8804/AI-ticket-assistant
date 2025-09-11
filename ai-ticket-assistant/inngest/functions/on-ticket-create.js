import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import { sendMail } from "../../utils/mailer.js";
import analyzeTicket from "../../utils/ai.js";

export const onTicketCreated = inngest.createFunction(
  { id: "on-ticket-created", retries: 2 },
  { event: "ticket/created" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      //fetch ticket from DB
      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      await step.run("update-ticket-status", async () => {
        await Ticket.findByIdAndUpdate(ticket._id, { status: "TODO" });
      });

      const { aiResponse, relatedskills } = await step.run("ai-processing", async () => {
        const analysis = await analyzeTicket(ticket);
        console.log('🤖 AI Response:', analysis);
        
        let skills = [];
        if (analysis && Array.isArray(analysis.relatedSkills)) {
          // Normalize skills to match our predefined list
          const skillMap = {
            'react': 'React',
            'reactjs': 'React', 
            'node': 'Node.js',
            'nodejs': 'Node.js',
            'javascript': 'JavaScript',
            'js': 'JavaScript',
            'mongodb': 'MongoDB',
            'mongo': 'MongoDB',
            'database': 'MongoDB',
            'python': 'Python',
            'java': 'Java',
            'docker': 'Docker',
            'aws': 'AWS',
            'security': 'Security',
            'mobile': 'Mobile',
            'ui': 'UI/UX',
            'ux': 'UI/UX',
            'design': 'UI/UX'
          };
          
          skills = analysis.relatedSkills
            .filter(skill => typeof skill === 'string')
            .map(skill => {
              const normalized = skill.toLowerCase().trim();
              return skillMap[normalized] || skill;
            })
            .filter(skill => skill !== 'General');
          
          console.log('🎯 Original AI skills:', analysis.relatedSkills);
          console.log('🎯 Normalized skills:', skills);
          
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: ["low", "medium", "high"].includes(analysis.priority)
              ? analysis.priority
              : "medium",
            helpfulNotes: typeof analysis.helpfulNotes === 'string' ? analysis.helpfulNotes : '',
            status: "TODO",
            relatedSkills: skills,
          });
        } else {
          // Fallback if AI fails
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: "medium",
            status: "TODO",
            relatedSkills: [],
          });
        }
        
        return { aiResponse: analysis, relatedskills: skills };
      });

      const moderator = await step.run("assign-moderator", async () => {
        let user = null;
        if (relatedskills.length > 0) {
          // Only try moderators with matching skills
          user = await User.findOne({
            role: "moderator",
            skills: { $in: relatedskills },
          });
        }
        
        // Fallback: any available moderator (NEVER assign to admin)
        if (!user) {
          user = await User.findOne({ role: "moderator" });
        }
        // Debug: Check available users
        const allUsers = await User.find({ role: { $in: ["moderator", "admin"] } }).select('email role skills');
        console.log('👥 Available users:', allUsers);
        console.log('🎯 Looking for skills:', relatedskills);
        console.log('👥 Assigning to user:', user?.email || 'No user found');
        await Ticket.findByIdAndUpdate(ticket._id, {
          assignedTo: user?._id || null,
        });
        return user;
      });

      await step.run("send-email-notification", async () => {
        if (moderator) {
          const finalTicket = await Ticket.findById(ticket._id);
          await sendMail(
            moderator.email,
            "Ticket Assigned",
            `A new ticket is assigned to you: ${encodeURIComponent(finalTicket.title)}`
          );
        }
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error running the step", encodeURIComponent(err.message));
      return { success: false };
    }
  }
);
