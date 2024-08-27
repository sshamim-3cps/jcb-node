import weaviate, { Filters } from 'weaviate-client';

const { WV_HOST, WV_API_KEY, OPENAI_API_KEY } = process.env;

if (!WV_HOST || !WV_API_KEY || !process.env.OPENAI_API_KEY) {
    throw new Error('Weaviate or OPENAI KEY credentials not found');
}

async function getWeaviateClient() {
    try {
        // const client = await weaviate.connectToWeaviateCloud(
        //     WV_HOST!,
        //     {
        //         authCredentials: new weaviate.ApiKey(WV_API_KEY!),
        //         headers: {
        //             'X-OpenAI-Api-Key': OPENAI_API_KEY!,  // Replace with your inference API key
        //         }
        //     }

        // ).catch(err => {
        //     throw new Error("Unable to connect to Weaviate: " + err.message);
        // });

        const client = await weaviate.connectToLocal({ headers: { "X-OpenAI-Api-Key": OPENAI_API_KEY! }, port: 8081, skipInitChecks: true }).catch(err => {
            throw new Error("Unable to connect to Weaviate: " + err.message);
        });
        return client;

    }
    catch (err) {
        console.error("Error getting Weaviate Client: ", err);
        throw new Error("Error getting Weaviate Client");
    }
}

export async function getMatchingTickets(startTime: Date, endTime: Date, text: string, projects: string[]) {
    try {
        console.log('Getting Matching Tickets, starttime:', startTime, 'endtime:', endTime, 'text:', text, 'projects:', projects);
        const client = await getWeaviateClient().catch(err => {
            throw err;
        });
        let ticket = client.collections.get("Ticket");
        let tickets = await ticket.query.nearText([text],
            {
                distance: parseFloat(process.env['MAX_VEC_SEARCH_DISTANCE']!),
                filters: Filters.and(
                    ...[
                        startTime ? ticket.filter.byProperty("lastUpdateTimestamp").greaterOrEqual(startTime) : null,
                        endTime ? ticket.filter.byProperty("lastUpdateTimestamp").lessOrEqual(endTime) : null,
                        projects && projects.length > 0 ? ticket.filter.byProperty("project").containsAny(projects) : null
                    ].filter(f => f !== null)
                ),
                returnMetadata: ["distance"],
                limit: 3
            });
        return tickets.objects.map(o => o.properties);
    }
    catch (err) {
        console.error("Error getting data from Weaviate: ", err);
        throw new Error("Error getting data from Weaviate");
    }
}

export async function getMatchingTicketsConversation(startTime: Date, endTime: Date, text: string, projects: string[]) {
    try {
        console.log('Getting Ticket as Conversation');
        let tickets = await getMatchingTickets(startTime, endTime, text, projects);
        if (!tickets || tickets.length === 0) {
            return [[], []];
        }
        console.log("Tickets: ", tickets.length);
        let conversations = tickets.map(t => t.conversation);
        let keys = tickets.map(t => t.key);
        console.log("Conversations: ", conversations, "Keys: ", keys);
        return [conversations, keys];
    }
    catch (err) {
        console.error("Error getting data from Weaviate: ", err);
        throw new Error("Error getting data from Weaviate");
    }
}
