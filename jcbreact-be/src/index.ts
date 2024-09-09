
import dotenv from "dotenv";
import { Message, Project } from "@/types/Models";
import { Request } from "express";
dotenv.config();
import express from "express";
import { verifyToken } from "./middlewares/express-auth-middleware";
import session from "express-session";
import {
    createConversation,
    retrieveConversationMessages,
    addMessagesToConversation,
    getConversationList,
    getProjects
} from "./lib/dao";
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

app.get('/project-list', async (req, res) => {
    console.log("Request Get Project List for user: ", req.session!.user!.id);
    try {
        let projects = await getProjects();
        res.send(projects);
    }
    catch (err) {
        console.log('Error getting project list:', err);
        res.status(500).send('Error getting project list');
    }
})

app.post('/new-conversation', async (req, res) => {
    console.log("Create New conversation for user: ", req.session!.user!.id);
    console.log('Request Body:', req.body);
    let projects = req.body.projectIds as number[];
    let startTime = req.body.startTime as Date;
    let endTime = req.body.endTime as Date;

    if (!projects || projects.length === 0) {
        console.log('Project list cannot be empty, returning bad request 400', projects);
        res.status(400).send('Project list cannot be empty');
        return;
    }
    let conversation = await createConversation(req.session!.user!.id, projects, startTime, endTime, []).catch(err => {
        console.log('Error creating conversation:', err);
        res.status(500).send('Error creating conversation');
        return;
    });
    res.send(conversation);
})

app.post('/send-message', async (req, res) => {
    try {
        console.log('Send Message', req.body);
        let userMessage = req.body.message;
        let conversationId = req.body.conversationId;
        let contextTimeFrame = req.body.contextTimeFrame;
        let projects = req.body.projects;
        if (!userMessage || userMessage.length === 0) {
            res.status(200).send('Blanks are harder to understand.');
            return;
        }
        let messageTime = new Date();
        let prevMessages: Message[] = [];
        if (!conversationId) {
            console.error('ConversationId not found, returning bad request 400');
            res.status(400).send('Conversation does not exist');
            return;
        }
        else {
            console.log('ConversationId found:', conversationId);
            //TODO: Update conversation parameters in case a message contains different ones than the conversation in the database
            let converstaionMessages = await retrieveConversationMessages(conversationId).catch(err => {
                console.log('Error retrieving conversation:', err);
                res.status(500).send('Error retrieving conversation');
                return;
            });
            if (converstaionMessages) {
                prevMessages = converstaionMessages;
            }
        }
        console.log("GenAI Response params: ", userMessage, prevMessages, projects, contextTimeFrame);
        let chatResponse = await generateAIResponse(userMessage, prevMessages, projects, contextTimeFrame);
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
            reply: chatResponse
        });
    }
    catch (err) {
        console.error('Error sending message:', err);
        res.send({
            reply: 'I am having a bad day, please try again later.'
        })
    }
});


app.get('/historical-messages', async (req, res) => {
    try {
        console.log(':::::: Get Historical messages ');
        const pageNumber = parseInt(req.query.page as string ?? '0');
        const conversationId = parseInt(req.query.conversationId as string);
        const pageSize = parseInt(req.query.pageSize as string ?? '10');
        if (isNaN(conversationId)) {
            res.status(400).send("Invalid conversation Id: " + conversationId);
            return;
        }
        if (isNaN(conversationId)) {
            res.status(400).send("Invalid page size Id: " + pageSize);
            return;
        }
        const convMessages = await retrieveConversationMessages(conversationId, pageNumber, pageSize);
        console.log("#histoical-messages. Length#", convMessages.length, ", conversation id: ",conversationId);
        res.send(convMessages);
    }
    catch (err) {
        console.log('Error getting conversation list:', err);
        res.status(500).send('Error getting conversation list');
    }
})

app.get('/conversation-history-list', async (req, res) => {
    try {
        console.log(':::::: Get Conversation List');
        const userId = req.session!.user!.id
        const pageNumber = parseInt(req.query.page as string ?? '0');
        const convHistory = await getConversationList(userId, pageNumber);
        res.send(convHistory);
    }
    catch (err) {
        console.log('Error getting conversation list:', err);
        res.status(500).send('Error getting conversation list');
    }
});



