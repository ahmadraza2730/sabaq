import { answerQuestion } from "@/lib/ai";

// Temporary: confirms the AI Gateway connection after deploy. Removed next commit.
export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("k") !== "87157514f1a9759b200f3ef3") {
    return new Response("Not found", { status: 404 });
  }
  try {
    const answer = await answerQuestion("In one short sentence, what is a stack?", [], "Health check.");
    return Response.json({ ok: true, answer });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) }, { status: 500 });
  }
}
