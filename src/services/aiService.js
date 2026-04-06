async function generateMockAIResponse(question) {
  return {
    source: 'ai',
    answer: `Mock AI response: I could not find this in Golden DB or RAG DB for "${question}".`,
    confidence: 0.3,
  };
}

module.exports = {
  generateMockAIResponse,
};
