import prisma from './db';
import { Message } from '@/declarations/types/Models';

export async function getConversationById(conversationId: number) {
    return prisma.conversation.findUnique({
        where: {
            id: conversationId
        }
    });
}

//to trigger workflow acion [3]
export async function addMessagesToConversation(conversationId: number, messages: Partial<Message>[]) {
    try {
        console.log('Adding messages to conversation#id:', conversationId);
        let newMessages = await prisma.message.createMany({
            data: messages.map(message => ({
                content: message.content!,
                conversation_id: conversationId,
                sent_by_user: message.sent_by_user,
                timestamp: message.timestamp
            }))
        });
        return newMessages;
    }
    catch (err: any) {
        console.error('Error adding messages to conversation:', err);
        throw new Error(`Unable to add messages to conversation of conversationId:[${conversationId}]. Reason: ${err.message}`)
    }
}


export async function createConversation(userId: string, messages: Message[]) {
    try {
        console.log('Creating conversation for userId:', userId);
        let conversation = await prisma.conversation.create({
            data: {
                user_id: userId,
                messages: {
                    create: messages
                }
            }
        });
        console.log('Conversation created:', conversation);
        return conversation.id;
    }
    catch (err: any) {
        throw new Error(`Unable to create new conversation of userId:[${userId}]. Reason: ${err.message}`)
    }
}

export async function retrieveConversationMessages(conversationId: number, limit: number = parseInt(process.env.HISTORY_SIZE!)): Promise<Message[]> {
    try {
        console.log('Retrieving conversation for conversationId:', conversationId);
        let messages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId
            },
            orderBy: {
                timestamp: 'asc'
            },
            take: limit
        });
        return messages || [];
    }
    catch (err: any) {
        throw new Error(`Unable to create new conversation of userId:[${conversationId}]. Reason: ${err.message}`)
    }
}

export async function retrieveConversation(conversationId: number) {
    try {
        console.log('Retrieving conversation for conversationId:', conversationId);
        let conversation = await prisma.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                messages: true
            }
        });
        return conversation;
    }
    catch (err: any) {
        throw new Error(`Unable to retrieve conversation of conversationId:[${conversationId}]. Reason: ${err.message}`)
    }
}

