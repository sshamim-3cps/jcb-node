import { Message,User,Conversation,Project } from "@prisma/client";

declare module "express-session" {
    interface SessionData {
      user: User;
    }
  }


export {
    Message,
    User,
    Conversation,
    Project
}