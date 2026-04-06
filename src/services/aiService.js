async function generateMockAIResponse(question) {
  return {
    source: 'ai',
    answer: `Add api for LLM based answers".`,
    confidence: 0.3,
  };
}

module.exports = {
  generateMockAIResponse,
};
