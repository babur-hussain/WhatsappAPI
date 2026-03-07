import OpenAI from 'openai';
import prisma from '../config/database';

let openaiClient: OpenAI | null = null;

const getOpenAIClient = () => {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY environment variable is not set. Please check your .env file.');
        }
        openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
    return openaiClient;
};

export interface AiAnalysis {
    reply: string;
    intent: 'general' | 'follow_up' | 'order_intent' | 'urgent' | 'closing';
    followUpDate?: string; // ISO date string for when to follow up
    orderDetails?: {
        productName?: string;
        quantity?: number;
        priceInquiry?: boolean;
    };
    sentiment: 'positive' | 'neutral' | 'negative';
}

export const aiService = {
    /**
     * Get conversation history for context
     */
    async getConversationHistory(leadId: string, limit: number = 10) {
        const messages = await prisma.message.findMany({
            where: { leadId },
            orderBy: { timestamp: 'desc' },
            take: limit,
            select: {
                content: true,
                sender: true,
                timestamp: true,
            },
        });
        return messages.reverse(); // Return in chronological order
    },

    /**
     * Generate AI smart reply with conversation context and intent detection
     */
    async generateSmartReply(factoryId: string, customerMessage: string, context?: string): Promise<string> {
        try {
            const analysis = await this.analyzeAndReply(factoryId, customerMessage, context);
            return analysis.reply;
        } catch (error) {
            console.error('AI Reply Generation failed:', error);
            return 'Thank you for your message! Our team will get back to you shortly.';
        }
    },

    /**
     * Full AI analysis: reply + intent detection + order extraction + follow-up scheduling
     */
    async analyzeAndReply(factoryId: string, customerMessage: string, context?: string, leadId?: string): Promise<AiAnalysis> {
        const openai = getOpenAIClient();

        const factory = await prisma.factory.findUnique({
            where: { id: factoryId }
        });

        if (!factory) {
            throw new Error('Factory not found');
        }

        // Build conversation history context
        let conversationContext = '';
        if (leadId) {
            const history = await this.getConversationHistory(leadId, 10);
            if (history.length > 0) {
                conversationContext = '\n\nConversation History:\n' +
                    history.map((m: any) => `${m.sender === 'CUSTOMER' ? 'Customer' : 'You'}: ${m.content}`).join('\n');
            }
        }

        const systemPrompt = `You are a professional AI sales assistant for "${factory.factoryName}".
Your job is to:
1. Reply professionally, helpfully, and concisely to convert the customer into a buyer
2. Detect customer intent (are they asking about products? ready to order? want to talk later?)
3. If the customer mentions a timeline (e.g. "tomorrow", "next week", "Monday"), note the follow-up date
4. If the customer mentions specific products, quantities, or asks for pricing, extract order details

Context: ${context || 'None'}${conversationContext}

IMPORTANT: Respond ONLY with valid JSON in this exact format:
{
  "reply": "Your response message to the customer",
  "intent": "general|follow_up|order_intent|urgent|closing",
  "followUpDate": "ISO date if customer mentions a future time, null otherwise",
  "orderDetails": {"productName": "if mentioned", "quantity": number_if_mentioned, "priceInquiry": true/false},
  "sentiment": "positive|neutral|negative"
}

Intent meanings:
- general: Regular conversation, greetings, questions
- follow_up: Customer wants to talk later ("call me tomorrow", "let me think", "talk next week")
- order_intent: Customer expresses interest in buying, asks for price, mentions quantity
- urgent: Customer needs immediate help or has a complaint
- closing: Customer is saying goodbye, not interested

Today's date is: ${new Date().toISOString().split('T')[0]}`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: customerMessage }
            ],
            max_tokens: 300,
            temperature: 0.7,
            response_format: { type: 'json_object' },
        });

        const responseText = completion.choices[0]?.message?.content?.trim();

        if (!responseText) {
            return {
                reply: 'Thank you for your message! Our team will get back to you shortly.',
                intent: 'general',
                sentiment: 'neutral',
            };
        }

        try {
            const parsed = JSON.parse(responseText) as AiAnalysis;
            return {
                reply: parsed.reply || 'Thank you for your message!',
                intent: parsed.intent || 'general',
                followUpDate: parsed.followUpDate || undefined,
                orderDetails: parsed.orderDetails || undefined,
                sentiment: parsed.sentiment || 'neutral',
            };
        } catch {
            return {
                reply: responseText,
                intent: 'general',
                sentiment: 'neutral',
            };
        }
    },

    /**
     * Generate a suggested reply for the dashboard (admin can review before sending)
     */
    async generateSuggestedReply(factoryId: string, leadId: string): Promise<AiAnalysis> {
        const lead = await prisma.lead.findUnique({
            where: { id: leadId },
            include: {
                messages: {
                    orderBy: { timestamp: 'desc' },
                    take: 1,
                },
            },
        });

        if (!lead || !lead.messages[0]) {
            throw new Error('Lead or messages not found');
        }

        const latestMessage = lead.messages[0].content;
        return this.analyzeAndReply(factoryId, latestMessage, undefined, leadId);
    },
};
