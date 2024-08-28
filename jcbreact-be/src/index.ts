
import dotenv from "dotenv";
import { Message } from "@/types/Models";
import { Request } from "express";
dotenv.config();
import express from "express";
import { verifyToken } from "./middlewares/express-auth-middleware";
import session from "express-session";
import { createConversation, retrieveConversationMessages, addMessagesToConversation } from "./lib/dao";
import { generateAIResponse } from "./OpenAIEngine"; "@/OpenAIEngine";
import cors from "cors";


const app = express();
app.use(cors<Request>());

app.use(session({
    secret: process.env.SESSION_SECRET ?? 'SomeSuperRandomSecretKnumber123eyCanGoALongwayFromHomeLIkeSpiderManOrTheHulk',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: (process.env.NODE_ENV === 'production') }
})
);
app.use(express.json());
console.log("Production? ", process.env.NODE_ENV === 'production');



app.use(verifyToken);

app.listen(3001, function () {
    console.log('App listening on port 3001');
});

app.get('/test', (req, res) => {
    res.send('Protected Resource Test OK');
});

app.post('/test', (req, res) => {
    res.send('Protected Resource Test OK');
});

app.post('/send-message', async (req, res) => {
    console.log('Send Message', req.body);
    let userMessage = req.body.message;
    if (!userMessage || userMessage.length === 0) {
        res.status(200).send('Blanks are harder to understand.');
        return;
    }
    let messageTime = new Date();
    let prevMessages: Message[] = [];
    let conversationId = req.body.conversationId;
    let projects = req.body.projects || ["WHW"];
    if (!conversationId) {
        console.log('No conversationId found');
        conversationId = await createConversation(req.session!.user!.id, []);
    }
    else {
        console.log('ConversationId found:', conversationId);
        let converstaionMessages = await retrieveConversationMessages(conversationId, parseInt(process.env.HISTORY_SIZE!)).catch(err => {
            console.log('Error retrieving conversation:', err);
            res.status(500).send('Error retrieving conversation');
        });
        if (converstaionMessages) {
            prevMessages = converstaionMessages;
        }
    }

    let chatResponse = await generateAIResponse(userMessage, prevMessages, projects);
    console.log('Chat Response:', chatResponse?.length);
    await addMessagesToConversation(conversationId, [{
        content: userMessage,
        timestamp: messageTime,
        sent_by_user: true
    },
    {
        content: chatResponse ?? 'No Response',
        timestamp: new Date(),
        sent_by_user: false
    }]);

    res.send({
        response: chatResponse,
        conversationId: conversationId
    });
});



