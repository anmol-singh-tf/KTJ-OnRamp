import agent_service
import os
from dotenv import load_dotenv

load_dotenv()

print(f"API Key Present: {'Yes' if os.getenv('GOOGLE_API_KEY') else 'No'}")

test_queries = [
    "Hello",
    "Book a flight from Delhi to Mumbai"
]

for q in test_queries:
    print(f"\nQuery: {q}")
    result = agent_service.run_agent(q)
    print(f"Result: {result}")
    
    if result.get('text') and 'auto_fill' in result:
        print("PASS: Structure Valid")
    else:
        print("FAIL: Structure Invalid")
