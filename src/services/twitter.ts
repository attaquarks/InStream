/**
 * Represents a Hashtag extracted from a post.
 */
export interface Hashtag {
    /**
     * The unique identifier of the hashtag (optional, mainly for database persistence).
     */
    id?: string;
    /**
     * The text of the hashtag (e.g., "AI", "Tech").
     */
    text: string;
}

/**
 * Represents a Keyword extracted from a post.
 */
export interface Keyword {
    /**
     * The unique identifier of the keyword (optional, mainly for database persistence).
     */
    id?: string;
    /**
     * The text of the keyword.
     */
    text: string;
    /**
     * The frequency of the keyword in the post or corpus (optional).
     */
    frequency?: number;
}

// Removed Topic interface as it's not used directly in this file's functions

/**
 * Represents a social media post, analogous to the Python Post model.
 */
export interface Tweet {
    /**
     * The unique identifier of the post on its original platform (e.g., Tweet ID).
     * Maps to `platform_id` in the Python model.
     */
    id: string;
    /**
     * The platform from which the post was collected (e.g., "Twitter", "Reddit").
     */
    platform: string;
    /**
     * The text content of the post.
     * Maps to `content` in the Python model.
     */
    text: string;
    /**
     * The author of the post (optional).
     */
    author?: string;
     /**
     * User details associated with the post author (optional).
     */
    user?: {
        name: string;
        handle: string;
        avatarUrl?: string;
    };
    /**
     * The timestamp of when the post was created on the platform (ISO 8601 format).
     */
    createdAt: string;
    /**
     * The timestamp of when the post was collected by this system (ISO 8601 format, optional).
     */
    collectedAt?: string;
    /**
     * The number of likes the post has received.
     */
    likes: number;
    /**
     * The number of times the post has been shared (general term).
     * For Twitter, this might be synonymous with retweets or quote tweets.
     */
    shares?: number;
    /**
     * The number of retweets (specific to Twitter).
     */
    retweets: number;
    /**
     * The number of comments/replies the post has received (optional).
     */
    comments?: number;
    /**
     * The sentiment score of the post (optional, e.g., a float between -1 and 1).
     */
    sentimentScore?: number | null;
    /**
     * An array of hashtags associated with the post (optional).
     */
    hashtags?: Hashtag[];
    /**
     * An array of keywords extracted from the post (optional).
     */
    keywords?: Keyword[];
}

/**
 * Represents the configuration options for fetching tweets.
 */
export interface FetchTweetsOptions {
    /**
     * The search query to use when fetching tweets.
     */
    query: string;
    /**
     * The maximum number of tweets to return.
     */
    maxResults?: number;
}

/**
 * Asynchronously fetches tweets from a mock data source based on the provided options.
 *
 * @param options The options for fetching tweets, including the search query and maximum number of results.
 * @returns A promise that resolves to an array of Tweet objects.
 */
export async function fetchTweets(options: FetchTweetsOptions): Promise<Tweet[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const now = new Date();
    const sampleTweets: Tweet[] = [
        {
            id: '12345',
            platform: 'Twitter',
            text: `Exploring the future of AI with ${options.query}. It's fascinating! #AI #Tech`,
            author: 'AI Enthusiast',
            user: { name: 'AI Enthusiast', handle: 'ai_fan', avatarUrl: 'https://picsum.photos/seed/avatar1/48/48' },
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(), // Random time in last 24h
            collectedAt: now.toISOString(),
            likes: Math.floor(Math.random() * 200),
            retweets: Math.floor(Math.random() * 100),
            shares: Math.floor(Math.random() * 100),
            comments: Math.floor(Math.random() * 50),
            sentimentScore: Math.random() * 2 - 1, // Random score between -1 and 1
            hashtags: [{ text: 'AI' }, { text: 'Tech' }, { text: options.query.split(" ")[0] || "Future" }],
            keywords: [{ text: 'future', frequency: 1 }, { text: 'AI', frequency: 2 }, { text: 'fascinating', frequency: 1 }],
        },
        {
            id: '67890',
            platform: 'Twitter',
            text: `Just read a great article on ${options.query}. So many implications. #Innovation`,
            author: 'Tech Savvy',
            user: { name: 'Tech Savvy', handle: 'tech_guru', avatarUrl: 'https://picsum.photos/seed/avatar2/48/48' },
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            collectedAt: now.toISOString(),
            likes: Math.floor(Math.random() * 300),
            retweets: Math.floor(Math.random() * 150),
            shares: Math.floor(Math.random() * 150),
            sentimentScore: Math.random() * 2 - 1,
            hashtags: [{ text: 'Innovation' }, {text: options.query.split(" ")[0] || "DeepLearning"}],
            keywords: [{ text: 'article', frequency: 1 }, { text: 'implications', frequency: 1 }],
        },
        {
            id: '11223',
            platform: 'Twitter',
            text: `The impact of ${options.query} on modern development is undeniable. #Dev #Coding`,
            author: 'Code Master',
            user: { name: 'Code Master', handle: 'codemaster_dev', avatarUrl: 'https://picsum.photos/seed/avatar3/48/48' },
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            collectedAt: now.toISOString(),
            likes: Math.floor(Math.random() * 180),
            retweets: Math.floor(Math.random() * 90),
            comments: Math.floor(Math.random() * 30),
            sentimentScore: Math.random() * 2 - 1,
            hashtags: [{ text: 'Dev' }, { text: 'Coding' }],
            keywords: [{ text: 'impact', frequency: 1 }, { text: 'development', frequency: 1 }, { text: 'undeniable', frequency: 1 }],
        },
         {
            id: '44556',
            platform: 'Twitter',
            text: `What are your thoughts on the latest advancements in ${options.query}? Join the discussion! #TechTrends`,
            author: 'Discussion Starter',
            user: { name: 'Discussion Starter', handle: 'discuss_tech', avatarUrl: 'https://picsum.photos/seed/avatar4/48/48' },
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            collectedAt: now.toISOString(),
            likes: Math.floor(Math.random() * 120),
            retweets: Math.floor(Math.random() * 60),
            shares: Math.floor(Math.random() * 60),
            comments: Math.floor(Math.random() * 70),
            sentimentScore: Math.random() * 2 - 1,
            hashtags: [{ text: 'TechTrends' }, {text: options.query.split(" ")[0] || "FutureTech"}],
            keywords: [{ text: 'advancements', frequency: 1 }, { text: 'discussion', frequency: 1 }],
        },
        {
            id: '77890',
            platform: 'Twitter',
            text: `Learning about ${options.query} and its applications. Mind-blowing stuff! #EdTech #ContinuousLearning`,
            author: 'Lifelong Learner',
            user: { name: 'Lifelong Learner', handle: 'learn_always', avatarUrl: 'https://picsum.photos/seed/avatar5/48/48' },
            createdAt: new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
            collectedAt: now.toISOString(),
            likes: Math.floor(Math.random() * 250),
            retweets: Math.floor(Math.random() * 120),
            sentimentScore: Math.random() * 2 - 1,
            hashtags: [{ text: 'EdTech' }, { text: 'ContinuousLearning' }],
            keywords: [{ text: 'learning', frequency: 1 }, { text: 'applications', frequency: 1 }, { text: 'mind-blowing', frequency: 1 }],
        }
    ];

    const maxResults = options.maxResults || 10;
    // Filter mock data if query is generic or very specific, for demonstration
    let filteredTweets = sampleTweets;
    if (options.query.toLowerCase() !== 'ai trends' && options.query.toLowerCase() !== 'ai') {
         filteredTweets = sampleTweets.filter(tweet => tweet.text.toLowerCase().includes(options.query.toLowerCase()));
    }

    return filteredTweets.slice(0, maxResults);
}
