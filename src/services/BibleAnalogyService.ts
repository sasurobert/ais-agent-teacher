export class BibleAnalogyService {
    private data = [
        { topic: "grit", verse: "Galatians 6:9", story: "Nehemiah rebuilding the wall", hook: "Let us not become weary in doing good..." },
        { topic: "resilience", verse: "James 1:2-4", story: "Job's perseverance", hook: "Consider it pure joy when you face trials..." },
        { topic: "wisdom", verse: "James 1:5", story: "Solomon asking for wisdom", hook: "If any of you lacks wisdom, let him ask God..." }
    ];

    async getAnalogy(topic: string) {
        // Simple filter for now; real version would use RAG or LLM search
        const result = this.data.find(d => topic.toLowerCase().includes(d.topic));
        return result || { topic: "general", verse: "Proverbs 3:5-6", story: "Trusting in the Lord", hook: "Trust in the Lord with all your heart..." };
    }
}
