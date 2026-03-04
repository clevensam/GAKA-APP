export default async function handler(req: any, res: any) {
  res.status(200).json({ 
    status: "ok", 
    env: { hasKey: !!process.env.GEMINI_API_KEY },
    runtime: "vercel-serverless"
  });
}
