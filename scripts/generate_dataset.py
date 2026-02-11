#!/usr/bin/env python3
"""
Synthetic Dataset Generator for Socratic Technical Interviewer
==============================================================

This script generates a training dataset for fine-tuning a Small Language Model (SLM)
to act as a Socratic technical interviewer. Instead of giving direct answers,
the model should ask guiding questions to help candidates discover solutions themselves.

Dataset Format: JSONL (ShareGPT style)
Target: 50+ conversation examples
Model: Will be used to fine-tune Llama-3-8B-Instruct

Usage:
    python scripts/generate_dataset.py

Output:
    data/interviewer_training_data.jsonl
"""

import os
import json
import time
from typing import List, Dict
from groq import Groq
from dotenv import load_dotenv

# Load environment variables from .env.local
load_dotenv('.env.local')

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# Topics and scenarios for data generation
SCENARIOS = [
    # React Concepts
    {
        "topic": "React Virtual DOM",
        "user_misconception": "React uses the real DOM directly for updates.",
        "context": "Junior developer explaining React rendering"
    },
    {
        "topic": "React State Management",
        "user_question": "Why can't I just modify state directly?",
        "context": "Developer trying to update state with state.count++"
    },
    {
        "topic": "React useEffect",
        "user_question": "My useEffect runs infinitely. Why?",
        "context": "Missing dependency array causing infinite loop"
    },
    {
        "topic": "React Keys",
        "user_question": "Why do I need keys in lists?",
        "context": "Using index as key in map"
    },

    # JavaScript Fundamentals
    {
        "topic": "Closures",
        "user_question": "What's a closure and why should I care?",
        "context": "Interview question about closure concept"
    },
    {
        "topic": "Promises vs Callbacks",
        "user_question": "What's wrong with callbacks?",
        "context": "Callback hell in async code"
    },
    {
        "topic": "Event Loop",
        "user_question": "How does JavaScript handle async operations?",
        "context": "Single-threaded runtime explanation needed"
    },
    {
        "topic": "Hoisting",
        "user_misconception": "Variables are created when the code runs.",
        "context": "Var hoisting behavior"
    },

    # TypeScript
    {
        "topic": "TypeScript Benefits",
        "user_question": "Why use TypeScript? JavaScript works fine.",
        "context": "Developer resistant to TypeScript adoption"
    },
    {
        "topic": "Type Inference",
        "user_question": "Do I need to type everything?",
        "context": "Over-typing simple variables"
    },
    {
        "topic": "Generics",
        "user_question": "What are generics for?",
        "context": "Writing reusable typed functions"
    },

    # System Design
    {
        "topic": "Database Indexing",
        "user_question": "My queries are slow. What should I do?",
        "context": "No indexes on frequently queried columns"
    },
    {
        "topic": "Caching Strategy",
        "user_question": "When should I use caching?",
        "context": "API performance optimization"
    },
    {
        "topic": "Load Balancing",
        "user_question": "How do I handle high traffic?",
        "context": "Single server struggling"
    },

    # Algorithms & Problem Solving
    {
        "topic": "Big O Notation",
        "user_question": "What's the difference between O(n) and O(n²)?",
        "context": "Algorithm complexity analysis"
    },
    {
        "topic": "Recursion",
        "user_question": "When should I use recursion?",
        "context": "Iterative vs recursive solutions"
    },
    {
        "topic": "Hash Tables",
        "user_question": "Why use a hash map instead of an array?",
        "context": "Lookup performance optimization"
    },

    # Code Quality
    {
        "topic": "DRY Principle",
        "user_misconception": "Copying code is faster than abstracting it.",
        "context": "Code duplication discussion"
    },
    {
        "topic": "Testing",
        "user_question": "Do I really need to write tests?",
        "context": "Testing value proposition"
    },
    {
        "topic": "Code Review",
        "user_question": "What should I look for in code reviews?",
        "context": "Learning to review effectively"
    },

    # Web Performance
    {
        "topic": "Bundle Size",
        "user_question": "My app loads slowly. Why?",
        "context": "Large JavaScript bundle"
    },
    {
        "topic": "Lazy Loading",
        "user_question": "What is lazy loading?",
        "context": "Optimizing initial page load"
    },

    # Security
    {
        "topic": "XSS Prevention",
        "user_question": "What's XSS?",
        "context": "Security vulnerability discussion"
    },
    {
        "topic": "SQL Injection",
        "user_misconception": "String concatenation in queries is fine.",
        "context": "Database security"
    },

    # Git & Workflow
    {
        "topic": "Git Merge vs Rebase",
        "user_question": "Should I merge or rebase?",
        "context": "Git workflow best practices"
    },
    {
        "topic": "Commit Messages",
        "user_question": "Why do commit messages matter?",
        "context": "Code maintainability"
    },

    # Additional Scenarios
    {
        "topic": "REST vs GraphQL",
        "user_question": "When should I use GraphQL?",
        "context": "API design decisions"
    },
    {
        "topic": "Microservices",
        "user_question": "Should I use microservices?",
        "context": "Architecture decision"
    },
    {
        "topic": "CSS Specificity",
        "user_question": "Why isn't my CSS working?",
        "context": "Style override issues"
    },
    {
        "topic": "Memory Leaks",
        "user_question": "My app gets slower over time.",
        "context": "Event listener cleanup"
    },
    {
        "topic": "Authentication vs Authorization",
        "user_question": "What's the difference?",
        "context": "Security concepts"
    },
    {
        "topic": "Docker Benefits",
        "user_question": "Why containerize?",
        "context": "Deployment consistency"
    },
]

def generate_socratic_response(scenario: Dict) -> Dict:
    """
    Generate a Socratic-style interview exchange for a given scenario.

    The Socratic method:
    1. Never give direct answers
    2. Ask guiding questions
    3. Help the candidate think through the problem
    4. Encourage discovery over telling

    Args:
        scenario: Dictionary with topic, user input, and context

    Returns:
        ShareGPT-formatted conversation
    """

    # Determine user input type
    if "user_misconception" in scenario:
        user_input = scenario["user_misconception"]
        prompt_type = "misconception"
    else:
        user_input = scenario["user_question"]
        prompt_type = "question"

    # Create prompt for Groq to generate Socratic response
    system_prompt = """You are a Senior Technical Interviewer who uses the Socratic method.

Your role:
- NEVER give direct answers or solutions
- Ask guiding questions that help candidates discover the answer themselves
- Be encouraging and professional
- Keep responses concise (2-3 sentences max)
- Reference their specific situation or misconception

Example Socratic Responses:
- "That's an interesting point. What do you think happens when you need to update multiple components at once?"
- "Let me ask you this: what would happen if React modified the DOM directly on every state change?"
- "Good question. Can you think of a scenario where that approach might cause problems?"

DO NOT:
- Give definitions or explanations directly
- Use phrases like "The answer is..." or "Here's what you need to know..."
- Be condescending or overly simplistic"""

    user_prompt = f"""Topic: {scenario['topic']}
Context: {scenario['context']}

The candidate says: "{user_input}"

Generate a Socratic response that helps them discover the correct understanding WITHOUT telling them the answer directly."""

    try:
        # Call Groq API
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.8,  # Higher temperature for variety
            max_tokens=150,
        )

        assistant_response = completion.choices[0].message.content.strip()

        # Format as ShareGPT conversation
        conversation = {
            "conversations": [
                {
                    "from": "human",
                    "value": user_input
                },
                {
                    "from": "gpt",
                    "value": assistant_response
                }
            ],
            "metadata": {
                "topic": scenario["topic"],
                "context": scenario["context"]
            }
        }

        return conversation

    except Exception as e:
        print(f"❌ Error generating for {scenario['topic']}: {e}")
        return None

def generate_multi_turn_conversation(topic: str, num_turns: int = 3) -> Dict:
    """
    Generate a multi-turn Socratic conversation where the interviewer
    progressively guides the candidate to understanding.

    Args:
        topic: The technical topic
        num_turns: Number of back-and-forth exchanges

    Returns:
        ShareGPT-formatted multi-turn conversation
    """

    system_prompt = """You are a Senior Technical Interviewer using the Socratic method.

Generate a realistic multi-turn interview conversation where:
1. Candidate starts with a question or misconception
2. You ask guiding questions (never give direct answers)
3. Candidate responds with partial understanding
4. You ask follow-up questions to deepen understanding
5. Conversation ends with candidate having an "aha" moment

Keep each turn concise. Focus on discovery through questioning."""

    user_prompt = f"""Generate a {num_turns}-turn Socratic interview conversation about: {topic}

Format as a realistic dialogue where the interviewer guides the candidate to understanding through questions.

Output as JSON with this structure:
{{
  "conversations": [
    {{"from": "human", "value": "..."}},
    {{"from": "gpt", "value": "..."}},
    {{"from": "human", "value": "..."}},
    {{"from": "gpt", "value": "..."}}
  ]
}}

IMPORTANT: Output ONLY the JSON, no markdown or explanations."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.9,
            max_tokens=500,
        )

        response_text = completion.choices[0].message.content.strip()

        # Try to extract JSON from response
        try:
            # Remove markdown code blocks if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            conversation = json.loads(response_text)
            conversation["metadata"] = {"topic": topic, "multi_turn": True}
            return conversation

        except json.JSONDecodeError:
            print(f"⚠️ Failed to parse JSON for {topic}, skipping...")
            return None

    except Exception as e:
        print(f"❌ Error generating multi-turn for {topic}: {e}")
        return None

def main():
    """Generate the complete training dataset."""

    print("=" * 60)
    print("🎓 Socratic Interviewer Dataset Generator")
    print("=" * 60)
    print()

    # Check API key
    if not os.environ.get("GROQ_API_KEY"):
        print("❌ Error: GROQ_API_KEY environment variable not set")
        print("   Add it to your .env.local file")
        return

    # Create data directory
    os.makedirs("data", exist_ok=True)
    output_file = "data/interviewer_training_data.jsonl"

    conversations = []

    # Generate single-turn conversations
    print(f"📝 Generating {len(SCENARIOS)} single-turn conversations...")
    for i, scenario in enumerate(SCENARIOS, 1):
        print(f"   [{i}/{len(SCENARIOS)}] {scenario['topic']}...", end=" ")

        conversation = generate_socratic_response(scenario)
        if conversation:
            conversations.append(conversation)
            print("✅")
        else:
            print("❌")

        # Rate limiting - be nice to the API
        time.sleep(1)

    # Generate multi-turn conversations (10 examples)
    print()
    print("📝 Generating 10 multi-turn conversations...")
    multi_turn_topics = [
        "Explaining async/await to someone who only knows callbacks",
        "Debugging a React infinite render loop",
        "Optimizing a slow SQL query",
        "Choosing between REST and GraphQL",
        "Understanding JavaScript 'this' keyword",
        "Designing a scalable authentication system",
        "Implementing proper error handling",
        "Understanding CSS Grid vs Flexbox",
        "Writing testable code",
        "Choosing the right data structure"
    ]

    for i, topic in enumerate(multi_turn_topics, 1):
        print(f"   [{i}/{len(multi_turn_topics)}] {topic}...", end=" ")

        conversation = generate_multi_turn_conversation(topic, num_turns=3)
        if conversation:
            conversations.append(conversation)
            print("✅")
        else:
            print("❌")

        time.sleep(1.5)  # Slightly longer delay for longer requests

    # Save to JSONL
    print()
    print(f"💾 Saving {len(conversations)} conversations to {output_file}...")

    with open(output_file, 'w', encoding='utf-8') as f:
        for conv in conversations:
            f.write(json.dumps(conv, ensure_ascii=False) + '\n')

    print()
    print("=" * 60)
    print("✅ Dataset Generation Complete!")
    print("=" * 60)
    print(f"📊 Total examples: {len(conversations)}")
    print(f"📂 Output file: {output_file}")
    print(f"📏 File size: {os.path.getsize(output_file) / 1024:.2f} KB")
    print()
    print("Next steps:")
    print("1. Review the dataset: cat data/interviewer_training_data.jsonl | jq")
    print("2. Upload to Google Colab")
    print("3. Run the training notebook")
    print()

if __name__ == "__main__":
    main()
