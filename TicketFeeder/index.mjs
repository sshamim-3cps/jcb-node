import {getTickets } from "./jira.mjs";
import { insertDataIntoWeaviate } from "./vectordb.mjs";
export async function handler(event, context) {
  try {
    console.log(event);


    let tickets = await getTickets(false,event.startLimit).catch(err => {
      console.log("Error getting issues", err);
      throw new Error("Error getting issues");
    });

    console.log("Fetched Tickets from JIRA: ",tickets);
    let formattedTicketData = formatTicketData(tickets['issues']);
    console.log("Formatted Tickets for VectorDB Insertions: ",formattedTicketData);
    await insertDataIntoWeaviate(formattedTicketData).catch(err => {
      console.log("Error inserting data into Weaviate", err);
      throw new Error("Error inserting data into Weaviate");
    });
    return {
      statusCode: 200,
      body:{issues: formattedTicketData},
    };
  }
  catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
}

function formatTicketData(tickets = []){
  let formattedTickets = [];
  for(let ticket of tickets){
    console.log("Ticket Data: ",ticket);
    let comments = (ticket.fields.comment?.comments) || [];
    let conversation = comments.map(comment => `${comment.author.displayName}: ${comment.body}`).join("\n");
    let lastUpdate = comments.reduce((max, comment) => max = max > comment.updated ? max : comment.updated, ticket.fields.updated);
    let lastUpdateDatetime = new Date(lastUpdate);
    let lastUpdateStr = lastUpdateDatetime.toISOString();
    let ticketData = {
      key: ticket.key,
      summary: ticket.fields.summary,
      description: ticket.fields.description || "",
      creationDate: new Date(ticket.fields.created).toISOString(),
      project: ticket.fields.project.key,
      conversation: conversation,
      lastUpdateTimestamp: lastUpdateStr
    };
    formattedTickets.push(ticketData);
  }
  return formattedTickets;
}

/*
def format_jira_data(tickets):
    formatted_data = []
    #client = OpenAI(api_key=OPENAI_APIKEY)

    for ticket in tickets:
        comments = ticket.fields.comment.comments if hasattr(ticket.fields, 'comment') and ticket.fields.comment else []
        conversation = "\n".join([f"{comment.author.displayName}: {comment.body}" for comment in comments])
        #conversation_summary = summarize(conversation, client)

        # Correctly handle the last update timestamp
        last_update_str = max([comment.updated for comment in comments] + [ticket.fields.updated], key=lambda d: datetime.strptime(d, '%Y-%m-%dT%H:%M:%S.%f%z'))
        last_update_datetime = datetime.strptime(last_update_str, '%Y-%m-%dT%H:%M:%S.%f%z')
        last_update = last_update_datetime.strftime('%Y-%m-%dT%H:%M:%SZ')
        ticket_data = {
            "key": ticket.key,
            "summary": ticket.fields.summary,
            "description": ticket.fields.description if ticket.fields.description else "",
            "creationDate": datetime.strptime(ticket.fields.created, '%Y-%m-%dT%H:%M:%S.%f%z').strftime('%Y-%m-%dT%H:%M:%SZ'),
            "project": ticket.fields.project.key,
            "conversation": conversation,
            "lastUpdateTimestamp": last_update,
            #"conversation_summary":conversation_summary
        }
        formatted_data.append(ticket_data)
    return formatted_data

*/