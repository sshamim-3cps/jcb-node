import prisma from './db';
import { Message, Project } from '@/declarations/types/Models';

export async function getConversationById(conversationId: number) {
    return prisma.conversation.findUnique({
        where: {
            id: conversationId
        }
    });
}

export async function getProjects() {
    return prisma.project.findMany();
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


export async function createConversation(userId: string, projectIds: number[], startTime: Date, endTime: Date, messages: Message[]) {
    try {
        console.log('Creating conversation for userId:', userId);

        let conversation = await prisma.conversation.create({
            data: {
                user_id: userId,
                start_limit: startTime,
                end_limit: endTime,
                messages: {
                    create: messages
                },
                projects: {
                    connect: projectIds.map(projectId => ({ id: projectId }))
                }
            },
            include: {
                projects: true
            }
        });
        console.log('Conversation created:', conversation);
        return conversation;
    }
    catch (err: any) {
        throw new Error(`Unable to create new conversation of userId:[${userId}]. Reason: ${err.message}`)
    }
}

export async function retrieveConversationMessages(conversationId: number, pageNumber: number = 0, pageSize: number = parseInt(process.env.HISTORY_SIZE!)): Promise<Message[]> {
    try {
        console.log('Retrieving conversation for conversationId:', conversationId);
        let messages = await prisma.message.findMany({
            where: {
                conversation_id: conversationId
            },
            orderBy: {
                timestamp: 'asc'
            },
            take: pageSize,
            skip: pageNumber
        });
        return messages || [];
    }
    catch (err: any) {
        throw new Error(`Unable to create new conversation of userId:[${conversationId}]. Reason: ${err.message}`)
    }
}

export async function retrieveConversation(conversationId: number) {
    try {
        console.log('#retrieveConversation for conversationId:', conversationId);
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

export async function getConversationHistory(userId: string, pageNumber: number = 0, pageSize: number = 10) {
    try {
        console.log('Retrieving conversation history for user:', userId);
        let conversations = await prisma.conversation.findMany({
            where: {
                AND: [
                    {
                        user_id: userId
                    },
                    {
                        messages: {
                            some: {}
                        }
                    }
                ]
            },
            select: {
                id: true,
                start_limit: true,
                end_limit: true,
                projects: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                start_limit: 'desc'
            },
            take: pageSize,
            skip: pageNumber * pageSize
        });
        return conversations;
    }
    catch (err: any) {
        throw new Error(`Unable to retrieve conversation history of userId:[${userId}]. Reason: ${err.message}`)
    }
}

export async function getConversationList(userId: string, pageNumber: number = 0, pageSize: number = 8) {
    try {
        console.log('Retrieving conversation list for user:', userId, 'Page:', pageNumber, 'Size:', pageSize);
        let conversations = await prisma.conversation.findMany({
            where: {
                AND: [
                    {
                        user_id: userId
                    },
                    {
                        messages: {
                            some: {}
                        }
                    }
                ]
            },
            select: {
                id: true,
                start_time: true,
                start_limit: true,
                end_limit: true,
                projects: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                messages: {
                    where: {
                        sent_by_user: true
                    },
                    select: {
                        content: true,
                        timestamp: true
                    },
                    orderBy: {
                        timestamp: 'desc',
                    },
                    take: 1
                }
            },
            orderBy: {
                start_limit: 'desc'
            },
            take: pageSize,
            skip: pageNumber * pageSize
        });
        console.log("Fetched conversations:", conversations.length, ". Formatting...");
        let formattedConversations = conversations.map(conversation => {
            return {
                id: conversation.id,
                startTime: conversation.start_time,
                contextStartTime: conversation.start_limit,
                contextEndTime: conversation.end_limit,
                projects: conversation.projects,
                lastMessage: conversation.messages[0]?.content,
                lastMessageTime: conversation.messages[0]?.timestamp
            }
        });
        console.log("Formatted conversations:", formattedConversations);
        return formattedConversations;
    }
    catch (err: any) {
        throw new Error(`Unable to retrieve conversation list of userId:[${userId}]. Reason: ${err.message}`)
    }
}

