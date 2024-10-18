export const generateAnswerPrompt = `Based on your PERSONALITY defined below, answer the prompt. If you can make an answer that fits your prompt
better based on the CONTEXT, you may use the context. You are not required to use the context, and it may be blank.

---
PERSONALITY
{personality}
---

---
PROMPT
{prompt}
---

---
CONTEXT
{context}
---

---
Your response must also be substaintially different from the following responses:
{responses}
---

ANSWER:`;
