# viShakha_feature
RAG based system for answering queries.

## MVP Implemented
This MVP provides a chat interface with prioritized answer retrieval:
1. **Golden DB** (verified answers, highest priority)
2. **RAG DB** (knowledge matches)
3. **Mock AI response** (fallback only)

MongoDB is used as the storage layer for Golden DB, RAG DB, and conversation history.

## Tech Stack (MVP)
- Node.js + Express
- MongoDB (`mongodb` driver)
- Simple HTML chat UI served from `public/index.html`
- Jest + Supertest tests for prioritization flow

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   ```bash
   cp .env.example .env
   ```
3. Set `MONGODB_URI` and optional `MONGODB_DB_NAME` in `.env`.

## Run
```bash
npm run dev
```
Open `http://localhost:3000`.

## API
### Ask a question
`POST /api/chat/ask`
```json
{
  "question": "What is Vi-Sakha?"
}
```
Response includes:
- `source`: `golden` | `rag` | `ai`
- `answer`
- optional `matchedQuestion`

### Add knowledge (admin MVP)
`POST /api/chat/admin/knowledge`
```json
{
  "type": "golden",
  "question": "What is Vi-Sakha?",
  "answer": "Vi-Sakha is a personalized AI assistant."
}
```
- `type`: `golden` or `rag`

## Data Collections
- `golden_answers`
- `rag_knowledge`
- `conversations`

## Test
```bash
npm test
```
