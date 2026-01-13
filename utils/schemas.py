from pydantic import BaseModel
from typing import Optional

class RegisterRequestSchema(BaseModel):
    username: str
    wallet_address: str
    description: str
    business_type: str
    
class RegisterResponseSchema(BaseModel):
    status: str
    username: str
    
class AgentChatResponseSchema(BaseModel):
    text: str
    auto_fill: Optional[dict] = None
    
class AgentChatRequestSchema(BaseModel):
    message: str
    