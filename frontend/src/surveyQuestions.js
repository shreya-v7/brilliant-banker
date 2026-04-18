export const SMB_SURVEY_STEPS = [
  {
    id: 'smb_t1',
    kind: 'task_rating',
    instruction:
      'Go to your Dashboard. Look at your cash flow chart and current balance. Come back when you have reviewed it.',
    linkLabel: 'Go to Dashboard',
    linkPath: '/business',
    questionText: 'How useful is the cash flow overview for understanding your business finances?',
  },
  {
    id: 'smb_t2',
    kind: 'task_rating',
    instruction:
      'Open the AI Chat. Ask: "What does my cash flow look like for the next 3 months?" Read the response.',
    linkLabel: 'Open Chat',
    linkPath: '/business/chat',
    questionText: "How helpful was the AI's cash flow analysis?",
  },
  {
    id: 'smb_t3',
    kind: 'task_mc',
    instruction:
      'In the same chat, ask: "Am I eligible for a $25,000 line of credit?" See what happens.',
    linkLabel: 'Open Chat',
    linkPath: '/business/chat',
    questionText:
      'How does this credit pre-qualification compare to your current experience applying for credit at a bank?',
    options: [
      'Much faster and clearer',
      'Somewhat better',
      'About the same',
      'I prefer the traditional process',
    ],
  },
  {
    id: 'smb_t4',
    kind: 'task_rating',
    instruction:
      'Go to your Activity page. Find your credit request and check its status. Notice the timeline and updates.',
    linkLabel: 'Go to Activity',
    linkPath: '/business/activity',
    questionText:
      'How valuable is it to see your credit request status in real time instead of waiting for a call?',
  },
  {
    id: 'smb_t5',
    kind: 'task_rating',
    instruction:
      'Open your Profile page. Read the AI-generated business brief at the bottom. Does it capture your business accurately?',
    linkLabel: 'Go to Profile',
    linkPath: '/business/profile',
    questionText: 'How accurate and useful is the AI business brief?',
  },
  {
    id: 'smb_t6',
    kind: 'multi',
    questionText: 'Which feature would you use most often?',
    options: [
      'Cash flow forecast',
      'Credit pre-qualification',
      'AI chat for banking questions',
      'Real-time request tracking',
      'Business profile and insights',
    ],
  },
  {
    id: 'smb_t7',
    kind: 'free',
    questionText:
      'What feature or information is missing that would make this more useful for your business?',
    placeholder: 'Your honest feedback helps us build something real',
  },
  {
    id: 'smb_t8',
    kind: 'nps_pair',
    questionText:
      'Based on everything you have seen, how likely are you to recommend this tool to another business owner?',
    followUpLabel: 'Why did you give this score?',
  },
]

export const BANKER_SURVEY_STEPS = [
  {
    id: 'bk_t1',
    kind: 'task_rating',
    instruction:
      'Open the Dashboard. Review the portfolio metrics, priority queue, and client health distribution.',
    linkLabel: 'Go to Dashboard',
    linkPath: '/banker',
    questionText: 'How useful is this dashboard compared to your current Monday morning routine?',
  },
  {
    id: 'bk_t2',
    kind: 'task_rating',
    instruction:
      "Go to My Clients. Find a client with At Risk or Critical status. Click into their profile.",
    linkLabel: 'Go to Clients',
    linkPath: '/banker/clients',
    questionText: 'How useful is the client health scoring for prioritizing your outreach?',
  },
  {
    id: 'bk_t3',
    kind: 'task_mc',
    instruction:
      'Open the Credit Queue. Pick a pending request. Read the AI pre-call brief and conversation playbook.',
    linkLabel: 'Go to Credit Queue',
    linkPath: '/banker/credit',
    questionText: 'How does the AI pre-call brief compare to how you currently prepare for client calls?',
    options: [
      'Saves significant time',
      'Somewhat helpful',
      'About the same effort',
      'I prefer preparing manually',
    ],
  },
  {
    id: 'bk_t4',
    kind: 'task_rating',
    instruction:
      'On the same credit request, make a decision: approve, decline, or refer. See the AI-drafted notification.',
    linkLabel: 'Go to Credit Queue',
    linkPath: '/banker/credit',
    questionText:
      'How comfortable are you with the AI drafting the client notification for your review?',
  },
  {
    id: 'bk_t5',
    kind: 'task_rating',
    instruction:
      'Go to any client profile. Explore all four tabs: Overview, Transactions, Credit History, and Banker Notes.',
    linkLabel: 'Go to Clients',
    linkPath: '/banker/clients',
    questionText: 'Does this client view give you enough context to have a meaningful conversation?',
  },
  {
    id: 'bk_t6',
    kind: 'multi',
    questionText: 'Which feature would save you the most time in your daily work?',
    options: [
      'AI pre-call brief',
      'Priority queue ranking',
      'Client health scoring',
      'Credit decision workflow',
      'Real-time client activity alerts',
    ],
  },
  {
    id: 'bk_t7',
    kind: 'free',
    questionText: 'What concerns would you have about using this tool with real clients?',
    placeholder: 'Be honest about trust, accuracy, or workflow concerns',
  },
  {
    id: 'bk_t8',
    kind: 'nps_pair',
    questionText: 'How likely are you to recommend this tool to a colleague?',
    followUpLabel: 'What would need to change for you to score higher?',
  },
]

export const SMB_TASK_COUNT = 5
export const BANKER_TASK_COUNT = 5
