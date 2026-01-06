from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from dotenv import load_dotenv
import os
import json
import random

load_dotenv()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

# Mock Tool
@tool
def search_flights(source: str, destination: str, max_price_usd: float = None):
    """
    Searches for flights between a source and destination.
    Optionally filters by maximum price in USD.
    Returns flight details including price in ETH and a receiver address.
    """
    # Mock Logic
    airlines = ["Indigo", "Air India", "Emirates", "Vistara"]
    airline = random.choice(airlines)
    
    # Generate a price that respects the limit if possible, or explain why
    base_price_usd = random.randint(100, 500) # Mock USD price
    if max_price_usd and base_price_usd > max_price_usd:
        base_price_usd = max_price_usd - random.randint(10, 50)
        
    # Convert to ETH (Mock rate: 1 ETH = 2000 USD)
    price_eth = round(base_price_usd / 2000, 5)
    
    # Needs to return a valid ETH address for the wallet to use
    receiver_address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
    
    return {
        "airline": airline,
        "flight_no": f"{airline[:2].upper()}{random.randint(100, 999)}",
        "price_usd": base_price_usd,
        "price_eth": price_eth,
        "receiver_address": receiver_address,
        "status": "Available"
    }

# Agent Setup
# Using a simpler structure to avoid 'create_tool_calling_agent' import issues
tools = [search_flights]
llm_with_tools = llm.bind_tools(tools)
from langchain_core.messages import HumanMessage, SystemMessage

def run_agent(user_input):
    try:
        # Direct invocation with tools
        messages = [
            SystemMessage(content="""You are a helpful booking assistant for a Crypto Wallet. 
            You have access to tools to find flights.
            
            CRITICAL OUTPUT RULE:
            After you have the information you need (or if no tool is needed), you MUST return your final response as a RAW JSON string with exactly two keys:
            1. "text": A friendly summary of what you found.
            2. "auto_fill": A string or object containing "receiver" and "amount". If no transaction is needed, return null.
            
            Do NOT output markdown code blocks. Just the JSON string.
            """),
            HumanMessage(content=user_input)
        ]
        
        # 1. Let the model choose to call a tool
        ai_msg = llm_with_tools.invoke(messages)
        
        # 2. If tool call
        if ai_msg.tool_calls:
            messages.append(ai_msg)
            for tool_call in ai_msg.tool_calls:
                if tool_call["name"] == "search_flights":
                    tool_output = search_flights.invoke(tool_call["args"])
                    from langchain_core.messages import ToolMessage
                    messages.append(ToolMessage(content=str(tool_output), tool_call_id=tool_call["id"]))
            
            # 3. Get final response based on tool output
            final_resp = llm_with_tools.invoke(messages)
            output_str = final_resp.content
        else:
            output_str = ai_msg.content

        # Handle case where Gemini/LangChain returns a list of content parts
        if isinstance(output_str, list):
            # Join all string parts, extracting 'text' from dicts if needed
            cleaned_parts = []
            for part in output_str:
                if isinstance(part, str):
                    cleaned_parts.append(part)
                elif isinstance(part, dict) and "text" in part:
                     cleaned_parts.append(part["text"])
                else:
                    cleaned_parts.append(str(part))
            output_str = "".join(cleaned_parts)

        # Clean up Markdown if model adds it despite instructions
        if "```json" in output_str:
            output_str = output_str.split("```json")[1].split("```")[0].strip()
        elif "```" in output_str:
            output_str = output_str.split("```")[1].split("```")[0].strip()
        
        # Check if it's valid JSON; if so return parsed dict
        try:
            parsed = json.loads(output_str)
            return parsed
        except json.JSONDecodeError:
            # Fallback if model failed slightly
            return {
                "text": output_str,
                "auto_fill": None
            }
            
    except Exception as e:
        return {
            "text": f"Agent Error: {str(e)}",
            "auto_fill": None
        }
