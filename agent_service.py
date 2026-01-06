from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from dotenv import load_dotenv
import os
import json
import random

load_dotenv()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0)

# Mock Tool
@tool
def search_flights(source: str, destination: str):
    """
    Searches for flights between a source and destination.
    Returns flight details including price in ETH and a receiver address.
    """
    # Mock Logic
    airlines = ["Indigo", "Air India", "Emirates", "Vistara"]
    airline = random.choice(airlines)
    price = round(random.uniform(0.0001, 0.001), 5) # Reasonable testnet amount
    
    # Needs to return a valid ETH address for the wallet to use
    # Using a hardcoded demo address or generating a random one
    # This is "Airline's Wallet"
    receiver_address = "0x71C7656EC7ab88b098defB751B7401B5f6d8976F" 
    
    return {
        "airline": airline,
        "flight_no": f"{airline[:2].upper()}{random.randint(100, 999)}",
        "price_eth": price,
        "receiver_address": receiver_address,
        "status": "Available"
    }

# Agent Setup
# Using a simpler structure to avoid 'create_tool_calling_agent' import issues if version mismatch
# We will use the llm with bound tools directly if possible, but keeping it simple for langchain api.
# Let's try create_json_chat_agent or just binding tools manually.

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
