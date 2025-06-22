import React, { useState } from 'react';

const SYSTEM_PROMPT = ` You are a helpful AI assistant for an O/A Level learning platform. Your job is to provide information, guidance, and suggestions to students about O and A Levels, including subject choices, exam tips, course recommendations, and academic support. You can answer questions about O/A Level subjects, exam preparation, study strategies, and help students find the right courses or resources for their goals. Be friendly, supportive, and focused on helping students succeed in their O/A Level journey.`;

const API_ENDPOINT = "https://models.github.ai/inference";
const MODEL = "openai/gpt-4.1";
const API_TOKEN = import.meta.env.VITE_GITHUB_API_TOKEN;

const Assistant: React.FC = () => {
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_PROMPT }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    try {
      const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${API_TOKEN}`
        },
        body: JSON.stringify({
          messages: newMessages,
          temperature: 0.7,
          top_p: 1.0,
          model: MODEL
        })
      });
      const data = await response.json();
      if (data.choices && data.choices[0]?.message?.content) {
        setMessages([...newMessages, { role: "assistant", content: data.choices[0].message.content }]);
      } else {
        setError("No response from AI.");
      }
    } catch (err: any) {
      setError("Error contacting AI service.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col">
      <h1 className="text-3xl font-bold mb-4">AI Assistant</h1>
      <div className="flex-1 overflow-y-auto bg-white rounded shadow p-4 mb-4 space-y-4">
        {messages.filter(m => m.role !== 'system').map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'}`}>{msg.content}</span>
          </div>
        ))}
        {loading && <div className="text-gray-500">Thinking...</div>}
        {error && <div className="text-red-500">{error}</div>}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded px-3 py-2"
          type="text"
          placeholder="Ask me anything about the platform..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          disabled={loading}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          onClick={handleSend}
          disabled={loading || !input.trim()}
        >Send</button>
      </div>
    </div>
  );
};

export default Assistant; 