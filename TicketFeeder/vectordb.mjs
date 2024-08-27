import weaviate from 'weaviate-client';

const { WV_HOST, WV_API_KEY } = process.env;



export async function insertDataIntoWeaviate(ticketsToInsert = []) {
    try {
        const client = await weaviate.connectToWeaviateCloud(
            WV_HOST,
            {
                authCredentials: new weaviate.ApiKey(WV_API_KEY),
                headers: {
                    'X-OpenAI-Api-Key': process.env.OPENAI_API_KEY || '',  // Replace with your inference API key
                }
            }

        ).catch(err => {
            throw new Error("Unable to connect to Weaviate: " + err.message);
        });

        let ticket = client.collections.get("Ticket");

        for (let ticketData of ticketsToInsert) {
            let existingTicket = (await ticket.query.fetchObjects({ where: { key: { equals: ticketData.key } } })).objects[0];
            if (existingTicket) {
                console.log("Updating existing ticket: ", ticketData.key, existingTicket.uuid);
                await ticket.data.replace({ id: existingTicket.uuid, properties: ticketData }).catch(err => {
                    throw new Error("Error updating ticket in Weaviate: " + err);
                }).finally(() => {
                    client.close();
                });
            }
            else {
                console.log("Inserting new ticket: ", ticketData.key);
                await ticket.data.insert({ properties: ticketData }).catch(err => {
                    throw new Error("Error inserting ticket in Weaviate: " + err.message);
                }).finally(() => {
                    client.close();
                });
            }
        }

    }
    catch (err) {
        throw new Error("Error inserting data into Weaviate: " + err.message);
    }
}