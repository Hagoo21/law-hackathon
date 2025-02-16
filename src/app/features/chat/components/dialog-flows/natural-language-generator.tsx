import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useDialogFlowStore } from "./store";
import { GraphFlowNode, GraphFlowEdge, createEmptyNode } from "./nodes";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function NaturalLanguageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const { setNodes, setEdges } = useDialogFlowStore();

  const generateFlow = async () => {
    if (!prompt) {
      toast({
        title: "Please enter a description of your flow",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/dialog-flows/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate flow");
      }

      const { nodes, edges } = await response.json();
      setNodes(nodes);
      setEdges(edges);

      toast({
        title: "Flow generated successfully",
        description: "Your flow has been created based on the description",
      });
    } catch (error) {
      toast({
        title: "Failed to generate flow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <Textarea
        placeholder="Describe your dialog flow in natural language. For example: 'Create a flow that first checks if a query is about employment law, then routes to different experts based on the type of employment issue.'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
        className="w-full"
      />
      <Button 
        onClick={generateFlow}
        disabled={loading}
        className="self-end"
      >
        {loading ? <LoadingSpinner /> : "Generate Flow"}
      </Button>
    </div>
  );
}