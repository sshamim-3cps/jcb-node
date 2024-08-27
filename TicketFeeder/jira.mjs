
import JiraApi from 'jira-client';
const { JIRA_PROJECTS, FREQ, MAX_ISSUE_BATCHSIZE } = process.env;
const projects = JIRA_PROJECTS.split(',');


export async function getTickets(extended = true, startLimit = 'auto') {
    try {
        var jira = new JiraApi({
            protocol: 'https',
            host: `${process.env['JIRA_DOMAIN']}.atlassian.net`,
            username: process.env['JIRA_EMAIL'],
            password: process.env['JIRA_REST_API_KEY'],
            apiVersion: '2',
            strictSSL: true
        });
        let jqlQuery = `project in (${projects.join(',')})`;
        if (startLimit !== 'auto') {
            jqlQuery += ` AND created >= -${startLimit}`;
        }
        else {
            jqlQuery += ` AND (created >= -${FREQ} OR updated >= -${FREQ})`;
        }

        console.log("Running jql query [", jqlQuery, "]");

        let issues = await jira.searchJira(jqlQuery, { fields: ['key','summary','description','created','project','comment',], expand: ['renderedFields', 'comment', 'history'] })
            .catch(err => {
                throw new Error("Problem with JIRA API call: " + err.message);
            });
        console.log("Found issues: ", issues);
        // find extended issues?
        return issues;
    }
    catch (err) {
        throw new Error("Unable to get issues from JIRA: " + err.message);
    }
}