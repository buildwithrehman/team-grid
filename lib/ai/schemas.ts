import { z } from 'zod'

export const WeeklySummarySchema = z.object({
  summary: z.string().describe("A concise 2-3 sentence overview of the team's week."),
  majorAccomplishments: z.array(z.string()).describe("List of 2-4 major things the team finished this week."),
  importantBlockers: z.array(z.string()).describe("List of 1-3 critical or high severity blockers currently open."),
  suggestedPriorities: z.array(z.string()).describe("List of 2-3 recommendations for next week based on deadlines or risks."),
  dataLimitations: z.array(z.string()).optional().describe("Any notes on missing data (e.g., 'No check-ins submitted this week').")
})

export const ProjectHealthExplanationSchema = z.object({
  explanation: z.string().describe("A 1-2 sentence explanation grounding the deterministic health status in actual metrics (e.g. overdue tasks)."),
  riskFactors: z.array(z.string()).describe("List of factors threatening the project timeline."),
  dataLimitations: z.array(z.string()).optional()
})

export const BlockerInsightsSchema = z.object({
  summary: z.string().describe("Brief overview of the current blocker landscape."),
  commonThemes: z.array(z.string()).describe("Identified themes or recurring reasons for blockers."),
  oldBlockersNeedingAttention: z.array(z.string()).describe("Specific older blockers that are stagnating."),
  suggestedActions: z.array(z.string()).describe("Recommendations to unblock the team.")
})

export const CheckinSummarySchema = z.object({
  summary: z.string().describe("Concise synthesis of the team's check-ins this week."),
  accomplishments: z.array(z.string()).describe("Aggregated accomplishments mentioned across check-ins."),
  concerns: z.array(z.string()).describe("Aggregated concerns or blockers mentioned."),
  priorities: z.array(z.string()).describe("What the team is focusing on next week.")
})

export const AttentionSchema = z.object({
  criticalIssues: z.array(z.object({
    title: z.string(),
    reasoning: z.string().describe("Concrete reason why this is critical (e.g., 'Due in 2 days but 0% progress')"),
    actionableAdvice: z.string().describe("What the user should do about it.")
  })),
  dataLimitations: z.array(z.string()).optional()
})
