/**
 * 
 * @param data the data object that is sent to OpenAi
 * @param {boolean} stream indicates whether to retrieve a stream response or not.
 * @returns 
 */
export const queryOpenAI = async (data: any, stream=false) => {
  if (!data.hasOwnProperty("model")) {
    data["model"] = "gpt-4o-2024-11-20";
  }

  const headers = {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Content-Type": "application/json",
  };

  if (!stream) {
    data["stream"] = false;
    
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        headers,
        method: "POST",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || response.statusText;
        } catch {
          errorMessage = errorText || response.statusText;
        }
        throw new Error(`OpenAI API error: ${errorMessage}`);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      console.error("OpenAI API error:", error);
      throw error;
    }
  } 
  
  // Stream response
  data["stream"] = true;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    headers,
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
  }

  return response;
};