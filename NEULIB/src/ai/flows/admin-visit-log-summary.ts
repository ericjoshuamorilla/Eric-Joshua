'use server';
/**
 * @fileOverview This file implements a Genkit flow to generate an AI-powered summary of visitor logs.
 *
 * - adminVisitLogSummary - A function that handles the AI summary generation process for visitor logs.
 * - AdminVisitLogSummaryInput - The input type for the adminVisitLogSummary function.
 * - AdminVisitLogSummaryOutput - The return type for the adminVisitLogSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define the schema for a single visit log entry
const VisitLogSchema = z.object({
  userId: z.string().describe('The ID of the user who visited.'),
  timestamp: z.string().datetime().describe('The timestamp of the visit.'),
  purpose: z.enum([
    'Reading Books',
    'Research in Thesis',
    'Use of Computer',
    'Doing Assignments',
  ]).describe('The purpose of the visit.'),
});

// Define the input schema for the summary flow
const AdminVisitLogSummaryInputSchema = z.object({
  visitLogs: z.array(VisitLogSchema).describe('An array of visitor log entries.'),
  startDate: z.string().datetime().optional().describe('Optional start date for the summarized period.'),
  endDate: z.string().datetime().optional().describe('Optional end date for the summarized period.'),
});
export type AdminVisitLogSummaryInput = z.infer<typeof AdminVisitLogSummaryInputSchema>;

// Define the output schema for the summary flow
const AdminVisitLogSummaryOutputSchema = z.object({
  summary: z.string().describe('An AI-generated summary of the visitor logs, identifying patterns and trends.'),
});
export type AdminVisitLogSummaryOutput = z.infer<typeof AdminVisitLogSummaryOutputSchema>;

// Wrapper function to call the Genkit flow
export async function adminVisitLogSummary(
  input: AdminVisitLogSummaryInput
): Promise<AdminVisitLogSummaryOutput> {
  return adminVisitLogSummaryFlow(input);
}

// Define the Genkit prompt for summarizing visit logs
const summarizeVisitLogsPrompt = ai.definePrompt({
  name: 'summarizeVisitLogsPrompt',
  input: { schema: AdminVisitLogSummaryInputSchema },
  output: { schema: AdminVisitLogSummaryOutputSchema },
  prompt: `You are an AI assistant tasked with summarizing visitor logs for a library.
Analyze the provided visitor log entries for the period between {{startDate}} and {{endDate}} (if provided).
Identify key insights, patterns, and trends in library usage.
Mention:
- Total number of visits.
- Most popular purpose(s) of visit.
- Any noticeable trends over time within the given period.
- Suggest potential implications or areas for further investigation.

Provide a concise and informative summary.

Here are the visitor logs in JSON format:
{{{json visitLogs}}}`,
});

// Define the Genkit flow
const adminVisitLogSummaryFlow = ai.defineFlow(
  {
    name: 'adminVisitLogSummaryFlow',
    inputSchema: AdminVisitLogSummaryInputSchema,
    outputSchema: AdminVisitLogSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await summarizeVisitLogsPrompt(input);
    return output!;
  }
);
