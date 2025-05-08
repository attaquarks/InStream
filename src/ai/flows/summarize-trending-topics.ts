// Summarize trending topics flow
'use server';
/**
 * @fileOverview Summarizes trending topics from a given query.
 *
 * - summarizeTrendingTopics - A function that summarizes trending topics.
 * - SummarizeTrendingTopicsInput - The input type for the summarizeTrendingTopics function.
 * - SummarizeTrendingTopicsOutput - The return type for the summarizeTrendingTopics function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {fetchTweets} from '@/services/twitter';

const SummarizeTrendingTopicsInputSchema = z.object({
  query: z.string().describe('The search query to use when fetching tweets.'),
});
export type SummarizeTrendingTopicsInput = z.infer<typeof SummarizeTrendingTopicsInputSchema>;

const SummarizeTrendingTopicsOutputSchema = z.object({
  summary: z.string().describe('A summarized overview of the top trending topics.'),
});
export type SummarizeTrendingTopicsOutput = z.infer<typeof SummarizeTrendingTopicsOutputSchema>;

export async function summarizeTrendingTopics(input: SummarizeTrendingTopicsInput): Promise<SummarizeTrendingTopicsOutput> {
  return summarizeTrendingTopicsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeTrendingTopicsPrompt',
  input: {schema: SummarizeTrendingTopicsInputSchema},
  output: {schema: SummarizeTrendingTopicsOutputSchema},
  prompt: `You are an expert in summarizing trending topics from social media.

  Given the following search query: {{{query}}}

  Summarize the top trending topics:
  `,
});

const summarizeTrendingTopicsFlow = ai.defineFlow(
  {
    name: 'summarizeTrendingTopicsFlow',
    inputSchema: SummarizeTrendingTopicsInputSchema,
    outputSchema: SummarizeTrendingTopicsOutputSchema,
  },
  async input => {
    // Fetch tweets based on the query
    const tweets = await fetchTweets({query: input.query, maxResults: 10});

    // Concatenate tweet texts for the prompt
    const tweetTexts = tweets.map(tweet => tweet.text).join('\n');

    // Call the prompt with the concatenated tweet texts
    const {output} = await prompt({query: tweetTexts});
    return output!;
  }
);
