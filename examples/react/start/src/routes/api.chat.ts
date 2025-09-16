import { createServerFileRoute } from '@tanstack/react-start/server'
import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

export const ServerRoute = createServerFileRoute('/api/chat').methods({
  POST: async ({ request }) => {
    const { messages }: { messages: UIMessage[] } = await request.json();

    const result = streamText({
      model: openai("gpt-4.1"),
      system: "You are a helpful assistant.",
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  },
})
