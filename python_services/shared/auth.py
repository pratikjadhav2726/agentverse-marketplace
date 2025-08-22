"""
Shared authentication module for AgentVerse Python microservices
Implements JWT token validation and user context management
"""

import jwt
import time
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import redis
import json
import logging

logger = logging.getLogger(__name__)

# JWT Configuration
JWT_SECRET = "your-jwt-secret-key-here"  # In production, use environment variable
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Security scheme
security = HTTPBearer()

# Redis client for session management
redis_client = redis.Redis(host='localhost', port=6379, db=6, decode_responses=True)

class User(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: str

class TokenData(BaseModel):
    user_id: str
    email: str
    role: str
    exp: int
    iat: int

class AuthService:
    @staticmethod
    def create_access_token(user: User) -> str:
        """Create a JWT access token for a user"""
        now = datetime.utcnow()
        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=JWT_EXPIRATION_HOURS)).timestamp())
        }
        
        token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        # Store session in Redis
        session_key = f"session:{user.id}"
        session_data = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "created_at": now.isoformat(),
            "last_activity": now.isoformat()
        }
        redis_client.setex(session_key, JWT_EXPIRATION_HOURS * 3600, json.dumps(session_data))
        
        logger.info(f"Created access token for user {user.id}")
        return token
    
    @staticmethod
    def verify_token(token: str) -> TokenData:
        """Verify and decode a JWT token"""
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            
            # Check if token is expired
            if payload.get("exp", 0) < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token has expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verify session exists in Redis
            session_key = f"session:{payload['user_id']}"
            session_data = redis_client.get(session_key)
            
            if not session_data:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session not found or expired",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Update last activity
            session = json.loads(session_data)
            session["last_activity"] = datetime.utcnow().isoformat()
            redis_client.setex(session_key, JWT_EXPIRATION_HOURS * 3600, json.dumps(session))
            
            return TokenData(**payload)
            
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except Exception as e:
            logger.error(f"Token verification error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token verification failed",
                headers={"WWW-Authenticate": "Bearer"},
            )
    
    @staticmethod
    def get_user_from_token(token_data: TokenData) -> User:
        """Get user information from token data"""
        return User(
            id=token_data.user_id,
            email=token_data.email,
            name="",  # Would be fetched from database in production
            role=token_data.role,
            created_at=""  # Would be fetched from database in production
        )
    
    @staticmethod
    def revoke_token(user_id: str) -> bool:
        """Revoke a user's session"""
        try:
            session_key = f"session:{user_id}"
            result = redis_client.delete(session_key)
            logger.info(f"Revoked session for user {user_id}")
            return result > 0
        except Exception as e:
            logger.error(f"Failed to revoke token: {str(e)}")
            return False
    
    @staticmethod
    def check_permission(user: User, required_role: str) -> bool:
        """Check if user has required role/permission"""
        role_hierarchy = {
            "admin": 3,
            "seller": 2,
            "buyer": 1,
            "user": 1
        }
        
        user_level = role_hierarchy.get(user.role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level

# Dependency functions for FastAPI
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """FastAPI dependency to get current authenticated user"""
    token_data = AuthService.verify_token(credentials.credentials)
    return AuthService.get_user_from_token(token_data)

async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    """FastAPI dependency to get current active user"""
    # Additional checks can be added here (e.g., account status)
    return user

async def require_admin(user: User = Depends(get_current_user)) -> User:
    """FastAPI dependency that requires admin role"""
    if not AuthService.check_permission(user, "admin"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

async def require_seller(user: User = Depends(get_current_user)) -> User:
    """FastAPI dependency that requires seller role or higher"""
    if not AuthService.check_permission(user, "seller"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Seller access required"
        )
    return user

# Optional authentication (allows anonymous access)
async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """FastAPI dependency for optional authentication"""
    if not credentials:
        return None
    
    try:
        token_data = AuthService.verify_token(credentials.credentials)
        return AuthService.get_user_from_token(token_data)
    except HTTPException:
        return None

# Rate limiting decorator
def rate_limit(requests_per_minute: int = 60):
    """Rate limiting decorator for API endpoints"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Get user from function arguments
            user = None
            for arg in args:
                if isinstance(arg, User):
                    user = arg
                    break
            
            if user:
                key = f"rate_limit:{user.id}:{func.__name__}"
                current_count = redis_client.get(key)
                
                if current_count is None:
                    redis_client.setex(key, 60, 1)  # 1 minute window
                elif int(current_count) >= requests_per_minute:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Rate limit exceeded"
                    )
                else:
                    redis_client.incr(key)
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Service-to-service authentication
class ServiceAuth:
    SERVICE_SECRET = "service-to-service-secret-key"  # In production, use environment variable
    
    @staticmethod
    def create_service_token(service_name: str) -> str:
        """Create a token for service-to-service communication"""
        now = datetime.utcnow()
        payload = {
            "service": service_name,
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(hours=1)).timestamp())  # Short expiration for services
        }
        
        return jwt.encode(payload, ServiceAuth.SERVICE_SECRET, algorithm=JWT_ALGORITHM)
    
    @staticmethod
    def verify_service_token(token: str) -> str:
        """Verify a service-to-service token"""
        try:
            payload = jwt.decode(token, ServiceAuth.SERVICE_SECRET, algorithms=[JWT_ALGORITHM])
            
            if payload.get("exp", 0) < time.time():
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Service token expired"
                )
            
            return payload["service"]
            
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid service token"
            )

async def verify_service_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """FastAPI dependency for service-to-service authentication"""
    return ServiceAuth.verify_service_token(credentials.credentials)

# Audit logging
class AuditLogger:
    @staticmethod
    def log_access(user: User, endpoint: str, method: str, success: bool = True, details: Optional[Dict[str, Any]] = None):
        """Log user access for audit purposes"""
        log_entry = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "endpoint": endpoint,
            "method": method,
            "success": success,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        
        # Store in Redis for processing
        redis_client.lpush("audit_logs", json.dumps(log_entry))
        
        if not success:
            logger.warning(f"Access denied for user {user.id} to {method} {endpoint}")
        else:
            logger.info(f"User {user.id} accessed {method} {endpoint}")
    
    @staticmethod
    def log_security_event(event_type: str, user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """Log security-related events"""
        log_entry = {
            "event_type": event_type,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat(),
            "details": details or {}
        }
        
        redis_client.lpush("security_logs", json.dumps(log_entry))
        logger.warning(f"Security event: {event_type} for user {user_id}")

# Middleware for automatic audit logging
def audit_middleware(endpoint: str, method: str):
    """Middleware decorator for automatic audit logging"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            user = None
            success = True
            error_details = None
            
            # Extract user from arguments
            for arg in args:
                if isinstance(arg, User):
                    user = arg
                    break
            
            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                error_details = {"error": str(e)}
                raise
            finally:
                if user:
                    AuditLogger.log_access(user, endpoint, method, success, error_details)
        
        return wrapper
    return decorator