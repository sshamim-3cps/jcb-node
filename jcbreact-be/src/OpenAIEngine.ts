import { Conversation, Message } from "@/types/Models";
import { getMatchingTicketsConversation } from "./lib/vectordb";
import { retrieveConversation } from '@/lib/dao'
import OpenAI from "openai";
import e from "express";
import { ChatCompletionMessageParam } from "openai/resources";

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!
});

const { OPEN_AI_CHAT_MODEL, AI_TEMPERATURE } = process.env;


const SYSTEM_PROMPT = `You are an assistant representing 3CLogic, an award-winning innovator in artificial intelligence (AI) and contact center solutions.\
        Our mission is to redefine customer engagement by integrating cutting-edge technology with existing Customer Relationship Management (CRM) and Customer Service Systems.\
        By doing so, we aim to transform them into comprehensive omnichannel Customer Experience Management (CXM) platforms.\
        This transformation is designed to enhance global enterprises' flexibility, reliability, scalability, and security, ensuring they deliver unparalleled customer experiences.\
        In your role, you are equipped with data extracted from Jira tickets, enabling you to assist in debugging processes and comprehending various issues within the 3CLogic framework.\
        Your guidance is crucial for resolving technical challenges and optimizing our solutions.
        Please adhere to the following guidelines while responding to inquiries:
        Utilize the specific context provided from Jira tickets to inform your responses. This information is key to understanding and addressing the issues at hand accurately.
        If the solution or answer to a question is beyond your knowledge or access, be transparent and simply state, "I don't know the answer to this question."
        Maintain a strict focus on your designated role. If presented with a question that falls outside the purview of 3CLogic's applications or services, kindly respond with, "Sorry, but this is out of my scope."
        Your primary objective is to offer insightful, accurate, and efficient support, ensuring that every interaction contributes\
        positively to debugging efforts and the broader goal of enhancing customer experience solutions at 3CLogic`;

const msgPrompt = `Please leverage the context provided to accurately address the question at hand.\
                    If the answer is not within your knowledge base, it's important to acknowledge this by stating, 'I don't know the answer to this question.'\
                    It's crucial to avoid speculating or providing information that may not be accurate.\
                    Strive to keep your responses succinct and to the point, ensuring clarity and efficiency in communication.\
                    Context:`;


async function getFormattedHistoricalContext(messages: Message[]) {
    try {
        console.log("OpenAIEngine#getFormattedHistoricalContext");
        let history: ChatCompletionMessageParam[] = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            }
        ];
        for (let i = messages.length - 1; i >= 0; i--) {
            let message = messages[i];
            if (message.sent_by_user) {
                history.push({
                    role: 'user',
                    content: message.content
                });
            }
            else {
                history.push({
                    role: 'assistant',
                    content: message.content
                });
            }
        }
        return history;
    }
    catch (err) {
        console.error('Error getting formatted historical context:', err);
        throw new Error('Error getting formatted historical context');
    }
}


export async function generateAIResponse(newMessage: string, prevMessages: Message[], projects: string[], bulleted: boolean = false) {
    try {
        console.log("OpenAIEngine#generateAIResponse");
        let history = await getFormattedHistoricalContext(prevMessages);
        let startTime = prevMessages[0]?.timestamp;
        console.log("Start Time:::: " + startTime);
        let [conversations, keys] = await getMatchingTicketsConversation(startTime, new Date(), newMessage, projects);
        console.log("Keys: ", keys);
        let links = keys.map(k => `https://${process.env.JIRA_DOMAIN}.atlassian.net/browse/${k}`);
        let historicalContext = conversations.join('\n');

        history.push({
            role: 'user',
            content: `${msgPrompt}\n${historicalContext}${bulleted ? '\nGive bulleted answer\n' : '\nDont give bulleted answer\n'}${newMessage}`
        });
        console.log("History: ", history);
        let completion = await client.chat.completions.create({
            model: OPEN_AI_CHAT_MODEL!,
            temperature: parseFloat(AI_TEMPERATURE!),
            messages: history
        })
        console.log('Response [Completion]:', completion.choices[0].message.content);
        let response = completion.choices[0].message.content;
        response += `\n\nIf these steps do not resolve the issue you can visit the related Jira Tickets using the following links: ${links.join('\n')}`;
        return response;
    }
    catch (err) {
        console.error('Error generating AI response:', err);
        throw new Error('Error generating AI response');
    }
}