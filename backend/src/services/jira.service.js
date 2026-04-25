const { prisma } = require('../lib/prisma');
const { config } = require('../lib/config');

const PRIORITY_MAP = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Highest' };

function getJiraAuth(workspace) {
  const email = config.JIRA_EMAIL;
  const token = config.JIRA_API_TOKEN;
  if (!email || !token) throw new Error('JIRA_EMAIL and JIRA_API_TOKEN env vars required');
  return Buffer.from(`${email}:${token}`).toString('base64');
}

async function createJiraIssue(workspace, task) {
  const baseUrl = workspace.jira_base_url || config.JIRA_BASE_URL;
  const projectKey = workspace.jira_project_key;
  if (!baseUrl || !projectKey) {
    throw new Error('Workspace missing jira_base_url or jira_project_key');
  }

  const auth = getJiraAuth(workspace);
  const body = {
    fields: {
      project: { key: projectKey },
      summary: task.title,
      description: {
        type: 'doc',
        version: 1,
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: task.description || task.source_preview || task.title }],
          },
        ],
      },
      issuetype: { name: 'Task' },
      priority: { name: PRIORITY_MAP[task.priority] || 'Medium' },
      ...(task.assignee_hint ? { labels: [task.assignee_hint.replace(/\s+/g, '_')] } : {}),
    },
  };

  const response = await fetch(`${baseUrl}/rest/api/3/issue`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Jira API error ${response.status}: ${err}`);
  }

  return response.json();
}

async function syncTaskToJira(taskId) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { workspace: true },
  });
  if (!task) throw new Error('Task not found');
  if (task.jira_ticket_key) throw new Error(`Task already synced: ${task.jira_ticket_key}`);

  const issue = await createJiraIssue(task.workspace, task);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      jira_ticket_key: issue.key,
      jira_synced_at: new Date(),
    },
  });
}

module.exports = { syncTaskToJira, createJiraIssue };
