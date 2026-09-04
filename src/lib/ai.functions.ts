import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "@/lib/require-admin";

export const generateTeachingContent = createServerFn({ method: "POST" })
  .middleware([requireAdmin])
  .validator(
    (input: { kind: string; grade: string; subject: string; topic: string }) => input,
  )
  .handler(async ({ data }) => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { text: "", error: "AI is not configured yet." };

    const prompt = `Create a ${data.kind} for ${data.grade || "school"} ${data.subject || "Science"} on the topic "${data.topic}". Keep it practical for an Indian CBSE classroom, use clear headings and bullet points, and include learning objectives, activities and assessment ideas.`;

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content:
                "You are Kaleidonex AI, an assistant for school teachers building AI, robotics, coding and STEM lessons.",
            },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (res.status === 429) return { text: "", error: "Rate limit reached. Try again shortly." };
      if (res.status === 402)
        return { text: "", error: "AI credits exhausted. Please top up your workspace." };
      if (!res.ok) return { text: "", error: "AI service unavailable right now." };
      const json = (await res.json()) as {
        choices?: { message?: { content?: string } }[];
      };
      return { text: json.choices?.[0]?.message?.content ?? "", error: "" };
    } catch {
      return { text: "", error: "AI service unavailable right now." };
    }
  });
