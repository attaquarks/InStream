// Implemented sentiment analysis insights flow.
'use server';
/**
 * @fileOverview Analyzes the sentiment of trending topics.
 *
 * - analyzeSentiment - A function that analyzes the sentiment of trending topics.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SentimentAnalysisInputSchema = z.object({
  topic: z.string().describe('The trending topic to analyze.'),
  tweets: z.array(z.string()).describe('The tweets related to the topic.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

const SentimentAnalysisOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The overall sentiment of the topic (positive, negative, or neutral) and a short explanation.'
    ),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return analyzeSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: {schema: SentimentAnalysisInputSchema},
  output: {schema: SentimentAnalysisOutputSchema},
  prompt: `Analyze the sentiment of the following trending topic based on the provided tweets. Provide a single word sentiment (positive, negative, or neutral) followed by a short explanation.

Trending Topic: {{{topic}}}
Tweets:
{{#each tweets}}
- {{{this}}}
{{/each}}`,
});

const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
