export async function POST(request: Request) {
  return new Response(JSON.stringify({ test: "ok", timestamp: Date.now() }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
