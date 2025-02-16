import React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useGlobalDialogFlowStore } from "../dialog-flows/store";
import { toast } from "@/components/ui/use-toast";
import { FlowModal } from "../dialog-flows/flow-graph";

export function GenerateDialogFlow() {
  const [prompt, setPrompt] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const { setCompiledDialogFlow } = useGlobalDialogFlowStore();

  const handleGenerate = async () => {
    if (!prompt) {
      toast({
        title: "Please enter a description",
        description: "Enter a description of how you want the dialog flow to work",
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
        throw new Error("Failed to generate dialog flow");
      }

      const data = await response.json();
      setCompiledDialogFlow({
        name: "Generated Flow",
        prompt: prompt,
      });

      toast({
        title: "Dialog flow generated",
        description: "The dialog flow has been generated and activated",
      });
    } catch (error) {
      toast({
        title: "Failed to generate dialog flow",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 py-8 flex flex-col gap-4">
      <Label className="font-bold">Generate Dialog Flow</Label>
      <Textarea
        placeholder="Describe how you want the dialog flow to work. For example: 'First check if the query is about employment law, then route to different experts based on the type of issue...'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
      />
      <div className="flex justify-between gap-2">
        <Button 
          variant="outline"
          onClick={() => {
            const flowButton = document.querySelector('[aria-label="Flow Graph"]') as HTMLButtonElement;
            if (flowButton) {
              flowButton.click();
            }
          }}
        >
          View Flow Editor
        </Button>
        <Button 
          onClick={handleGenerate}
          disabled={loading}
        >
          Generate
        </Button>
      </div>
    </div>
  );
}