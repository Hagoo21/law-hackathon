import { NextResponse } from "next/server";
import { queryOpenAI } from "@/app/features/chat/lib/query-open-ai";
import { ulid } from "ulid";

const SYSTEM_PROMPT = `You are an expert at creating dialog flow graphs. Convert natural language descriptions into graph structures with nodes and edges.

Available node types:
- context: Provides context information
- instruction: Gives instructions
- example: Shows examples
- switch: Handles conditional branching
- relevant: Checks relevance
- keyword-extractor: Extracts keywords

Each node should have:
- id: Unique identifier
- type: One of the above types
- position: {x: number, y: number}
- data: {label: string, body: string}

Edges connect nodes with:
- id: Unique identifier
- source: Source node id
- target: Target node id
- label: Optional description

Position nodes in a logical flow from top to bottom, spaced 100 pixels apart vertically and horizontally.`;

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const response = await queryOpenAI({
      model: "gpt-4",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    const completion = response.choices[0].message.content;
    
    try {
      const { nodes, edges } = JSON.parse(completion);
      
      // Validate and ensure all required fields
      const validatedNodes = nodes.map((node: any) => ({
        ...node,
        id: node.id || ulid(),
        position: node.position || { x: 0, y: 0 },
        data: {
          label: node.data?.label || node.type,
          body: node.data?.body || "",
          ...node.data
        }
      }));

      const validatedEdges = edges.map((edge: any) => ({
        ...edge,
        id: edge.id || ulid(),
        label: edge.label || ""
      }));

      return NextResponse.json({ nodes: validatedNodes, edges: validatedEdges });
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      return NextResponse.json(
        { error: "Failed to generate valid flow structure" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error generating flow:", error);
    return NextResponse.json(
      { error: "Failed to generate flow" },
      { status: 500 }
    );
  }
}