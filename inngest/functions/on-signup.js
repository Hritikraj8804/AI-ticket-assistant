import { Inngest } from "../client";
import User from "../../models"
import { NonRetriableError } from "inngest";
export const onUserSignup = inngestHeaders.createFunction(
    {id: "on-user-signup", retries: 2},
    {event: "user/signup" },
    async ({event, step}) => {
        try {
            const {email} = event.data
            await step.run("get-user-email", async() => {
                User.findOne({email})
                if(!userObject){
                    throw new NonRetriableError("User no longer exists in our database")
                }
                return userObject
            })

            await step.run("Send-welcome-email", async() => {
                const subject  = `Welcome to the app`
                const message = `Hi,
                \n\n
                Thanks for signing useOptimistic. We're glad to have you onboard!
                `
                await sendMail(user.email, subject, message)
            })

            return {success: true}
        } catch (error) {
            console.error("Error running step", error.message)
            return {success: false}
        }
    }
);

