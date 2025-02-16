import { NextResponse } from "next/server";
import { queryOpenAI } from "@/app/features/chat/lib/query-open-ai";
import { ulid } from "ulid";

const SYSTEM_PROMPT = `You are an expert at creating dialog flow graphs. Convert natural language descriptions into graph structures with nodes and edges.

Your response must be valid JSON with this exact structure:
{
  "nodes": [
    {
      "id": "string",
      "type": "context|instruction|example|switch|relevant|keyword-extractor",
      "data": {
        "label": "string",
        "body": "string",
        "conditions": [{"id": "string", "label": "string", "body": "string"}],
        "otherwise": {"label": "string", "body": "string"},
        "threshold": 50
      }
    }
  ],
  "edges": [
    {
      "id": "string",
      "source": "string",
      "target": "string",
      "data": {
        "label": "string",
        "body": "string"
      }
    }
  ]
}

Rules:
- Output must be VALID JSON
- All strings must be properly escaped
- No comments or text outside JSON
- Each node must have unique ID
- Position nodes in logical flow`;



export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await queryOpenAI({
      model: "gpt-4o-2024-11-20",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Create a dialog flow for: ${prompt}` }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    if (!response?.choices?.[0]?.message?.content) {
      throw new Error("Invalid response from OpenAI");
    }

    const completion = response.choices[0].message.content;
    
    try {
      const data = JSON.parse(completion);
      
      if (!data.nodes || !data.edges || 
          !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        throw new Error("Invalid format: missing nodes or edges arrays");
      }

      // Add positions to nodes
      const nodes = data.nodes.map((node: any, index: number) => ({
        ...node,
        id: node.id || ulid(),
        position: { x: 100, y: index * 150 },
        data: {
          ...node.data,
          label: node.data?.label || "",
          body: node.data?.body || "",
          conditions: node.data?.conditions || [],
          otherwise: node.data?.otherwise || null,
          threshold: node.data?.threshold || 50
        }
      }));

      // Ensure edges have all required properties
      const edges = data.edges.map((edge: any) => ({
        id: edge.id || ulid(),
        source: edge.source,
        target: edge.target,
        data: {
          label: edge.data?.label || "",
          body: edge.data?.body || ""
        }
      }));

      return NextResponse.json({ nodes, edges });

    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response:", completion);
      return NextResponse.json(
        { error: "Failed to parse dialog flow structure" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating flow:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate flow" },
      { status: 500 }
    );
  }
}