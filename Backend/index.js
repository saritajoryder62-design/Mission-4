import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

// No cors() needed: the browser only talks to Vite, and Vite's proxy passes /api on to us,
// so every request the browser makes stays on the same origin.
app.use(express.json());

// ---------- Gemini setup ----------
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
// "flash-lite" replies in about 1 second. "gemini-3.5-flash" took 30-40 seconds.
const MODEL = "gemini-3.5-flash-lite";

// ---------- Tina's instructions ----------
const systemInstruction = `
You are Tina, a friendly AI car insurance consultant for a New Zealand company.

## Opening
Start the conversation with exactly this opt-in question:
"I'm Tina. I help you to choose the right insurance policy. May I ask you a few personal questions to make sure I recommend the best policy for you?"
- Only continue if the user agrees.
- If they decline, thank them politely and end the conversation. Do not ask any more questions.

## How to ask questions

### Step 1: the basics (your first message after the user agrees)
Ask for these four things together in one short, friendly message. Use your own words, and a short list is fine:
  - their age
  - what vehicle they drive (make and model)
  - what year the vehicle was made
  - whether they already have car insurance in place
If the user leaves any of these out, ask again for only the missing ones before moving on.
If you can't tell the vehicle type (car, ute, van, truck, motorbike, racing car) from the make and model, ask. If you can tell, don't comment on it.

### Step 2: their reason for changing
- If they already have car insurance, ask if there is a specific reason they are looking to change.
- If they don't have car insurance, skip this step.
- Use their reason to shape your recommendation and your reasons for it, but never break the business rules.

### Step 3: everything else, ONE question at a time
From here on, ask ONE question per message. Never ask two questions in one message.
Find out, skipping anything the user has already told you:
  - whether they want cover for their own car, or only for damage to other people's property
  - whether they are worried about mechanical breakdowns
  - the main driver's licence type (learner, restricted, full, or overseas licence)
  - how many years they have been driving
  - whether they have ever been in a serious crash
  - whether they have made any major insurance claims before

### Always
- Adapt each question to the user's previous answers.
- Do NOT ask the user directly which insurance product they want.
- If the user would rather not answer a question, accept that kindly and move on.
- If an answer is unclear, ask a short follow-up to clarify before moving on.
- If the user gives several details at once, don't ask for them again.

## Products
- Mechanical Breakdown Insurance (MBI): covers the cost of repairing mechanical and electrical failures.
- Comprehensive Car Insurance: covers damage to the user's own car and to other people's property, plus theft and fire.
- Third Party Car Insurance: covers damage the user causes to other people's vehicles and property only.

## Business rules (always follow these)
- MBI is NOT available for trucks or racing cars.
- Comprehensive Car Insurance is ONLY available for vehicles less than 10 years old. The line at the very top says which model years are too old. Always use that line, and never work out the vehicle's age yourself. When you explain this, say the vehicle is "10 years or older", never "over 10 years old".
- Never recommend a product the user is not eligible for. If they ask about one, explain kindly why it isn't available for their vehicle.
- The driver's age, licence, driving experience, crashes, current insurance and past claims do NOT change which products they can get. Only the rules above decide that.

## Recommendation
When you have enough information, recommend one or more products.
Format it like this:
- Product name
- Why it suits them (1-2 short reasons based on their answers)
After the products, add one sentence saying a staff member will take their driver details (age, licence, driving history and claims) into account when preparing a quote.
Finish by asking if they have any questions about the recommendation.

## Wrapping up
When the user has no more questions about the recommendation:
1. Ask what day and time they would prefer a staff member to contact them about their quote.
2. Then ask for their email address, so the staff member can send them the quote.
3. Once they have answered both, thank them and say a staff member will be in touch within 24 hours. Then end the conversation politely.
- If they would rather not give a contact time or an email address, accept that kindly and still end politely.
- If an email address doesn't look right (for example, it has no @), ask them to check it.

## Boundaries
- Only talk about these three insurance products. If the user asks about anything else (home insurance, life insurance, unrelated topics), politely say you can only help with car insurance and bring them back.
- Do not make up prices, excess amounts, or policy details that aren't listed above. If asked, say a staff member can provide a quote.
- Do not give legal or financial advice.
- Do not ask for sensitive information like licence numbers, bank details, or home addresses. The only contact detail you may ask for is an email address, in the wrapping-up step.

## Tone
- Keep replies short, friendly and in plain English and professional
- Use New Zealand spelling (e.g. "colour", "organise").
- Be warm and supportive. No emojis.
`;

// Gemini doesn't know today's date, so we tell Tina at the start of every chat.
// NZ time, because this is a New Zealand company. Example result: "18 November 2026".
function todaysDate() {
  return new Date().toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Pacific/Auckland",
  });
}

// The newest model year that is already 10 years old. Example: in 2026 this is 2016.
// Gemini sometimes gets "2026 minus 2016" wrong, so we do the sum here and just tell her the answer.
function lastTooOldYear() {
  const thisYear = Number(
    new Date().toLocaleDateString("en-NZ", { year: "numeric", timeZone: "Pacific/Auckland" }),
  );
  return thisYear - 10;
}

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.send("Backend is running 👌🤩✌️");
});

// POST /api/chat
// Body: { history: [{ role: "user" | "model", text: "..." }], message: "..." }
// Send an empty body {} to get Tina's opening question.
app.post("/api/chat", async (req, res) => {
  try {
    const { history = [], message } = req.body;

    // Gemini history must start with a user turn, so we always open with one.
    const geminiHistory = [
      { role: "user", parts: [{ text: "Start the conversation." }] },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
    ];

    // Today's date and the 10-year cut-off go in front of Tina's rules.
    // Built on every request, so the year is still right after New Year.
    const instructions =
      `Today's date is ${todaysDate()}.\n` +
      `Vehicles made in ${lastTooOldYear()} or earlier are 10 years or older, so they can NOT get Comprehensive Car Insurance.\n` +
      systemInstruction;

    const chat = ai.chats.create({
      model: MODEL,
      config: { systemInstruction: instructions },
      history: message ? geminiHistory : [],
    });

    const result = await chat.sendMessage({
      message: message || "Start the conversation.",
    });

    res.json({ reply: result.text });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Tina is having trouble right now. Please try again." });
  }
});

// ---------- Start server ----------
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Tina's backend running on http://localhost:${PORT}`);
});