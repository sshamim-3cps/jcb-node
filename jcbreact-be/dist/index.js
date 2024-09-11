"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const express_auth_middleware_1 = require("./middlewares/express-auth-middleware");
const express_session_1 = __importDefault(require("express-session"));
const dao_1 = require("./lib/dao");
const OpenAIEngine_1 = require("./OpenAIEngine");
"@/OpenAIEngine";
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use((0, express_session_1.default)({
    secret: (_a = process.env.SESSION_SECRET) !== null && _a !== void 0 ? _a : 'SomeSuperRandomSecretKnumber123eyCanGoALongwayFromHomeLIkeSpiderManOrTheHulk',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: (process.env.NODE_ENV === 'production') }
}));
app.use(express_1.default.json());
console.log("Production? ", process.env.NODE_ENV === 'production');
app.use(express_auth_middleware_1.verifyToken);
app.listen(3001, function () {
    console.log('App listening on port 3001');
});
app.get('/test', (req, res) => {
    res.send('Protected Resource Test OK');
});
app.post('/test', (req, res) => {
    res.send('Protected Resource Test OK');
});
app.get('/project-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Request Get Project List for user: ", req.session.user.id);
    try {
        let projects = yield (0, dao_1.getProjects)();
        res.send(projects);
    }
    catch (err) {
        console.log('Error getting project list:', err);
        res.status(500).send('Error getting project list');
    }
}));
app.post('/new-conversation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Create New conversation for user: ", req.session.user.id);
    console.log('Request Body:', req.body);
    let projects = req.body.projectIds;
    let startTime = req.body.startTime;
    let endTime = req.body.endTime;
    if (!projects || projects.length === 0) {
        console.log('Project list cannot be empty, returning bad request 400', projects);
        res.status(400).send('Project list cannot be empty');
        return;
    }
    let conversation = yield (0, dao_1.createConversation)(req.session.user.id, projects, startTime, endTime, []).catch(err => {
        console.log('Error creating conversation:', err);
        res.status(500).send('Error creating conversation');
        return;
    });
    res.send(conversation);
}));
app.post('/send-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        let prevMessages = [];
        if (!conversationId) {
            console.error('ConversationId not found, returning bad request 400');
            res.status(400).send('Conversation does not exist');
            return;
        }
        else {
            console.log('ConversationId found:', conversationId);
            //TODO: Update conversation parameters in case a message contains different ones than the conversation in the database
            let converstaionMessages = yield (0, dao_1.retrieveConversationMessages)(conversationId).catch(err => {
                console.log('Error retrieving conversation:', err);
                res.status(500).send('Error retrieving conversation');
                return;
            });
            if (converstaionMessages) {
                prevMessages = converstaionMessages;
            }
        }
        console.log("GenAI Response params: ", userMessage, prevMessages, projects, contextTimeFrame);
        let chatResponse = yield (0, OpenAIEngine_1.generateAIResponse)(userMessage, prevMessages, projects, contextTimeFrame);
        console.log('Chat Response:', chatResponse === null || chatResponse === void 0 ? void 0 : chatResponse.length);
        yield (0, dao_1.addMessagesToConversation)(conversationId, [{
                content: userMessage,
                timestamp: messageTime,
                sent_by_user: true
            },
            {
                content: chatResponse !== null && chatResponse !== void 0 ? chatResponse : 'No Response',
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
        });
    }
}));
app.get('/historical-messages', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        console.log(':::::: Get Historical messages ');
        const pageNumber = parseInt((_a = req.query.page) !== null && _a !== void 0 ? _a : '0');
        const conversationId = parseInt(req.query.conversationId);
        const pageSize = parseInt((_b = req.query.pageSize) !== null && _b !== void 0 ? _b : '10');
        if (isNaN(conversationId)) {
            res.status(400).send("Invalid conversation Id: " + conversationId);
            return;
        }
        if (isNaN(conversationId)) {
            res.status(400).send("Invalid page size Id: " + pageSize);
            return;
        }
        const convMessages = yield (0, dao_1.retrieveConversationMessages)(conversationId, pageNumber, pageSize);
        console.log("#histoical-messages. Length#", convMessages.length, ", conversation id: ", conversationId);
        res.send(convMessages);
    }
    catch (err) {
        console.log('Error getting conversation list:', err);
        res.status(500).send('Error getting conversation list');
    }
}));
app.get('/conversation-history-list', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        console.log(':::::: Get Conversation List');
        const userId = req.session.user.id;
        const pageNumber = parseInt((_a = req.query.page) !== null && _a !== void 0 ? _a : '0');
        const convHistory = yield (0, dao_1.getConversationList)(userId, pageNumber);
        res.send(convHistory);
    }
    catch (err) {
        console.log('Error getting conversation list:', err);
        res.status(500).send('Error getting conversation list');
    }
}));
app.patch('/archive-conversation', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(':::::: Archive Conversation');
        const conversationId = parseInt(req.body.conversationId);
        if (isNaN(conversationId)) {
            res.status(400).send("Invalid conversation Id: " + conversationId);
            return;
        }
        const conv = yield (0, dao_1.archiveConversation)(conversationId);
        res.send(conv);
    }
    catch (err) {
        console.log('Error archiving conversation:', err);
        res.status(500).send('Error archiving conversation');
    }
}));
