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
const app = (0, express_1.default)();
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
app.post('/send-message', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('Send Message', req.body);
    let userMessage = req.body.message;
    if (!userMessage || userMessage.length === 0) {
        res.status(200).send('Blanks are harder to understand.');
        return;
    }
    let messageTime = new Date();
    let prevMessages = [];
    let conversationId = req.body.conversationId;
    let projects = req.body.projects || ["WHW"];
    if (!conversationId) {
        console.log('No conversationId found');
        conversationId = yield (0, dao_1.createConversation)(req.session.user.id, []);
    }
    else {
        console.log('ConversationId found:', conversationId);
        let converstaionMessages = yield (0, dao_1.retrieveConversationMessages)(conversationId, parseInt(process.env.HISTORY_SIZE)).catch(err => {
            console.log('Error retrieving conversation:', err);
            res.status(500).send('Error retrieving conversation');
        });
        if (converstaionMessages) {
            prevMessages = converstaionMessages;
        }
    }
    let chatResponse = yield (0, OpenAIEngine_1.generateAIResponse)(userMessage, prevMessages, projects);
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
        response: chatResponse,
        conversationId: conversationId
    });
}));
