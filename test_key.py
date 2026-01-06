import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GOOGLE_API_KEY")

if not API_KEY:
    print("Error: GOOGLE_API_KEY not found in .env")
    exit(1)

print(f"Testing Key: {API_KEY[:5]}...{API_KEY[-5:]}")

# Try listing models to see what is connected
url = f"https://generativelanguage.googleapis.com/v1beta/models?key={API_KEY}"
headers = {'Content-Type': 'application/json'}

try:
    response = requests.get(url, headers=headers)
    print(f"\nStatus Code: {response.status_code}")
    
    if response.status_code == 200:
        print("SUCCESS! API Key is working.")
        models = response.json().get('models', [])
        print(f"Found {len(models)} models.")
        for m in models:
            if 'generateContent' in m['supportedGenerationMethods']:
                print(f"- {m['name']}")
    else:
        print("FAILURE.")
        print("Error Response:", response.text)
        print("\nPossible fixes:")
        print("1. Visit https://aistudio.google.com/")
        print("2. Ensure you have created a key in a project with billing enabled (or use the free tier correctly).")
        print("3. Check if 'Generative Language API' is enabled in Google Cloud Console.")

except Exception as e:
    print(f"Connection Error: {e}")
