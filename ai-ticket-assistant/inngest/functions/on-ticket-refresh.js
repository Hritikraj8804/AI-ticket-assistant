import { inngest } from "../client.js";
import Ticket from "../../models/ticket.js";
import User from "../../models/user.js";
import { NonRetriableError } from "inngest";
import analyzeTicket from "../../utils/ai.js";

export const onTicketRefresh = inngest.createFunction(
  { id: "on-ticket-refresh", retries: 1 },
  { event: "ticket/refresh" },
  async ({ event, step }) => {
    try {
      const { ticketId } = event.data;

      const ticket = await step.run("fetch-ticket", async () => {
        const ticketObject = await Ticket.findById(ticketId);
        if (!ticketObject) {
          throw new NonRetriableError("Ticket not found");
        }
        return ticketObject;
      });

      const { relatedskills } = await step.run("ai-analysis", async () => {
        const analysis = await analyzeTicket(ticket);
        console.log('🔄 Refreshing ticket:', ticket.title, 'Analysis:', analysis);
        
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
          
          console.log('🔄 Original AI skills:', analysis.relatedSkills);
          console.log('🔄 Normalized skills:', skills);
          
          await Ticket.findByIdAndUpdate(ticket._id, {
            priority: ["low", "medium", "high"].includes(analysis.priority)
              ? analysis.priority
              : "medium",
            helpfulNotes: typeof analysis.helpfulNotes === 'string' ? analysis.helpfulNotes : '',
            relatedSkills: skills,
          });
        }
        
        return { relatedskills: skills };
      });

      await step.run("assign-user", async () => {
        // Debug: Check available moderators only
        const allModerators = await User.find({ role: "moderator" }).select('email role skills');
        console.log('🔄 Available moderators for assignment:', allModerators);
        console.log('🔄 Looking for skills:', relatedskills);
        
        let user = null;
        if (relatedskills.length > 0) {
          // Only try moderators with matching skills
          user = await User.findOne({
            role: "moderator",
            skills: { $in: relatedskills },
          });
          console.log('🔄 Found moderator with matching skills:', user?.email);
        }
        
        // Fallback: any available moderator (NEVER assign to admin)
        if (!user) {
          user = await User.findOne({ role: "moderator" });
          console.log('🔄 Fallback moderator found:', user?.email);
        }
        
        if (user) {
          await Ticket.findByIdAndUpdate(ticket._id, {
            assignedTo: user._id,
          });
          console.log('🔄 Assigned refreshed ticket to:', user.email);
        } else {
          console.log('🔄 No admin/moderator users found!');
        }
        
        return user;
      });

      return { success: true };
    } catch (err) {
      console.error("❌ Error refreshing ticket", err.message);
      return { success: false };
    }
  }
);