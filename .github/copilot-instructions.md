# Copilot Instructions for Bali Pay Transaction Network API

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview

This is the Bali Pay Transaction Network API - an interbank transfer system for Indonesian banks. The system enables secure fund transfers between registered banks through a centralized network using transfer wallets and token-based authentication.

## Architecture Principles

- **TypeScript**: All code should be written in TypeScript with proper type definitions
- **Express.js**: RESTful API built with Express.js framework
- **Security First**: Always implement proper authentication and validation
- **Error Handling**: Comprehensive error handling with consistent API responses
- **Logging**: Proper logging for debugging and monitoring

## Key Components

1. **Banks**: Registered financial institutions with unique codes and API keys
2. **Wallets**: Customer accounts belonging to banks
3. **Transfer Wallets**: Temporary escrow wallets for secure transfers
4. **Transactions**: Transfer records with status tracking
5. **Tokens**: Unique identifiers for transfer operations

## Coding Standards

- Use consistent API response format with `ApiResponse<T>` type
- All endpoints should return JSON responses
- Implement proper HTTP status codes
- Use middleware for authentication and validation
- Follow RESTful conventions for endpoint naming
- Include comprehensive error messages
- Use UUIDs for entity identifiers

## Business Logic

- Banks must be registered and active to participate
- Source bank initiates transfers to destination banks
- Funds are temporarily held in transfer wallets
- Destination banks complete transfers using tokens
- All operations are logged with transaction steps

## Security Requirements

- API key authentication for all protected endpoints
- Bank code verification for requests
- Wallet ownership validation
- Transfer token verification
- Input validation and sanitization

## Response Format

All API responses should follow this structure:
```typescript
{
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  timestamp: string;
}
```

## Environment

- Node.js with TypeScript
- Express.js framework
- In-memory storage (to be replaced with database)
- Render deployment ready
- Docker containerization support

When writing code for this project, ensure it follows these patterns and maintains consistency with the existing codebase.