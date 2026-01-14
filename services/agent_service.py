from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage
from utils.helper_functions import pay as pay_helper
from config import MERCHANTS, SPENDING_LIMIT_ETH, PAYMENT_API_ENDPOINT
import requests
from dotenv import load_dotenv 
import json

load_dotenv()

# Initialize Gemini
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

@tool
def pay(receiver_address: str, amount: float):
    """
    Validates and prepares a payment to a merchant.
    
    IMPORTANT: This tool validates the payment details. The actual payment execution 
    will be handled by the frontend with proper authentication.
    
    Args:
        receiver_address (str): The receiver's wallet address (must be from the merchants list).
        amount (float): Amount to send in ETH. Must not exceed spending limit.
        
    Returns:
        dict: { "success": True, "merchant": "<name>", "message": "<message>" } if validation passes,
              or { "success": False, "error": "<message>" } if validation fails
    """
    # Validate amount against spending limit
    if amount > SPENDING_LIMIT_ETH:
        return {
            "success": False,
            "error": f"Amount {amount} ETH exceeds spending limit of {SPENDING_LIMIT_ETH} ETH. Please reduce the amount."
        }

    # Validate amount is positive
    if amount <= 0:
        return {
            "success": False,
            "error": f"Amount must be greater than 0. Received: {amount} ETH"
        }

    # Find the merchant by receiver address
    merchant = None
    for m in MERCHANTS:
        if m.get("receiver_address", "").lower() == receiver_address.lower():
            merchant = m
            break
    
    if not merchant:
        return {
            "success": False,
            "error": f"Receiver address {receiver_address} is not a recognized merchant. Please use a valid merchant address."
        }
        
    payment_result = pay_helper(PAYMENT_API_ENDPOINT, receiver_address, amount)
    if not payment_result.get("success"):
        return {
            "success": False,
            "error": payment_result.get("error")
        }
    tx_hash = payment_result.get("tx_hash")
    
    return {
        "success": True,
        "merchant": merchant["name"],
        "receiver_address": receiver_address,
        "amount": amount,
        "tx_hash": tx_hash,
        "message": f"Payment validated successfully. Ready to pay {amount} ETH to {merchant['name']}."
    }

@tool
def web_search(query: str) -> str:
    """
    Search the web for recent information and return concise result snippets.
    
    Args:
        query (str): The search query or question.
    
    Returns:
        str: Summary of top relevant results.
    """
    # For demonstration, use DuckDuckGo instant answer API (public, no key needed, but limited)
    url = "https://api.duckduckgo.com"
    params = {
        "q": query,
        "format": "json",
        "no_redirect": 1,
        "no_html": 1,
        "skip_disambig": 1
    }
    try:
        resp = requests.get(url, params=params, timeout=6)
        if resp.status_code != 200:
            return f"Web search failed with status code {resp.status_code}."
        data = resp.json()
        abstract = data.get("AbstractText") or data.get("Answer") or ""
        related = data.get("RelatedTopics", [])
        snippet = ""
        if abstract:
            snippet = abstract
        elif related and isinstance(related, list):
            # Take top related topic text
            first_topic = related[0]
            if isinstance(first_topic, dict) and first_topic.get("Text"):
                snippet = first_topic["Text"]
            else:
                snippet = str(first_topic)
        else:
            snippet = "No relevant answer found."
        return snippet[:500]
    except Exception as e:
        return f"Error during web search: {str(e)}"

# Using a simpler structure to avoid 'create_tool_calling_agent' import issues
tools = [pay, web_search]
llm_with_tools = llm.bind_tools(tools)

def run_agent(user_input):
    try:
        # Format merchants information for the prompt
        merchants_info = "\n".join([
            f"- {m['name']}: {m['description']} (Address: {m['receiver_address']})"
            for m in MERCHANTS
        ])
        
        # Direct invocation with tools
        messages = [
            SystemMessage(content=f"""You are a helpful payment assistant for a Crypto Wallet. 
            You help users make payments to merchants using natural language.

            AVAILABLE MERCHANTS:
            {merchants_info}

            SPENDING LIMITS:
            - Understand spending limit from the conversation, the user may specify it in the message or in the conversation history.
            - If not specified, use the default spending limit: {SPENDING_LIMIT_ETH} ETH
            - You MUST check if the requested amount exceeds this limit before processing any payment
            - If the amount exceeds the limit, inform the user and suggest a lower amount

            YOUR TASKS:
            1. Understand the user's intent to pay a merchant
            2. Identify which merchant they want to pay based on their description (match by business type, name, or description)
            3. Extract or infer the payment amount from the user's message
            4. Verify the amount does not exceed the spending limit ({SPENDING_LIMIT_ETH} ETH)
            5. Use the 'pay' tool to process the payment with the correct merchant's receiver_address
            6. After the tool executes, provide appropriate success or failure feedback

            PAYMENT PROCESS:
            - Use the 'pay' tool with the merchant's receiver_address and amount
            - The tool will validate the amount (against spending limit) and receiver address (against merchant list)
            - If validation succeeds, the tool returns success with merchant details - you can proceed to return auto_fill
            - If validation fails, the tool returns an error message - explain it clearly to the user
            - Note: The actual payment execution happens on the frontend with user authentication. Your job is to validate and prepare the payment details.

            CRITICAL OUTPUT RULE:
            After you have validated the payment (or if no payment is needed), you MUST return your final response as a RAW JSON string with exactly two keys:
            1. "text": A friendly summary of what happened (success message if validation passed, or error explanation if validation failed).
            2. "auto_fill": An object with "receiver" (merchant address) and "amount" (in ETH as string) if validation was successful. If validation failed or no transaction is needed, return null.
            
            Example auto_fill format: {{"receiver": "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", "amount": "0.05"}}
            
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
                if tool_call["name"] == "pay":
                    tool_output = pay.invoke(tool_call["args"])
                    messages.append(ToolMessage(content=json.dumps(tool_output), tool_call_id=tool_call["id"]))
            
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

        try:
            parsed = json.loads(output_str)
            return parsed
        except json.JSONDecodeError:
            return {
                "text": output_str,
                "auto_fill": None
            }
            
    except Exception as e:
        return {
            "text": f"Agent Error: {str(e)}",
            "auto_fill": None
        }
