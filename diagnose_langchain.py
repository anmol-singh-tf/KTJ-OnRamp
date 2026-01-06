
try:
    import langchain
    print(f"LangChain Version: {langchain.__version__}")
except:
    print("Could not get version")

try:
    import langchain.agents
    print("Imported langchain.agents")
    print("Dir:", dir(langchain.agents))
except Exception as e:
    print(f"Error importing langchain.agents: {e}")

try:
    from langchain.agents import AgentExecutor
    print("Successfully imported AgentExecutor")
except ImportError as e:
    print(f"Failed to import AgentExecutor: {e}")

try:
    from langchain.agents import tool
    print("Successfully imported tool")
except ImportError as e:
    print(f"Failed to import tool: {e}")
