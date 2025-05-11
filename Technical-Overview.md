# CryptoVault - Technical Overview

## Technologies Used

### Frontend
- **React 19** with TypeScript for type safety and improved development experience
- **Vite** as build tool for lightning-fast development and optimized production builds
- **Tailwind CSS** with dark mode support for responsive, utility-first styling
- **HeadlessUI** for accessible UI components and transitions
- **React Router v7** for client-side navigation with protected routes
- **Recharts** for responsive data visualization of portfolio performance
- **React Context API** for centralized state management (AuthContext, WalletContext, DarkModeProvider)
- **Axios** with JWT interceptors for secure API communication
- **Ethers.js** for Ethereum data types and utilities

### Backend
- **Node.js** with Express framework for efficient API development
- **TypeScript** for type safety and improved maintainability
- **MongoDB** with Mongoose ODM for flexible data modeling
- **JWT** (JSON Web Tokens) with refresh token rotation for secure authentication
- **Ethers.js** for wallet generation, transaction signing, and blockchain interactions
- **AWS KMS** (optional) for hardware-level encryption of private keys
- **AES-256-GCM** encryption for secure private key storage
- **0x API** integration for DEX aggregation and optimal swap routing
- **Express middleware** for authentication, validation, and error handling

## Architecture Overview

CryptoVault employs a layered architecture with clear separation of concerns:

1. **Presentation Layer** (React Frontend)
   - Components for UI presentation
   - Contexts for state management
   - Services for API communication

2. **API Layer** (Express Backend)
   - Controllers handling HTTP requests/responses
   - Routes defining API endpoints
   - Middleware for authentication and validation

3. **Service Layer** (Backend)
   - Authentication service for user management
   - Vault service for private key security
   - Wallet service for blockchain operations
   - Swap service for token exchange functionality

4. **Data Layer**
   - MongoDB for persistent storage
   - Memory vault for secure, temporary private key access

5. **External Services**
   - Ethereum nodes via Infura for blockchain interaction
   - 0x API for swap routing and price discovery

The system is designed with security at its core, implementing a custodial model where all private keys are managed exclusively on the server side. Communication between layers follows strict protocols with comprehensive validation.

## Wallet Generation & Key Storage

The wallet generation and private key storage approach prioritizes security while maintaining usability:

1. **Wallet Generation**
   - Backend generates wallets using Ethers.js's `Wallet.createRandom()`
   - Cryptographically secure entropy sources ensure randomness
   - Each wallet receives a unique identifier and user-provided name

2. **Private Key Encryption**
   - Hybrid encryption approach for maximum security:
     - **Primary**: AWS KMS encryption when credentials are available (FIPS 140-2 compliant)
     - **Fallback**: AES-256-GCM with secure key derivation
   - Unique encryption keys per wallet
   - Initialization vectors (IVs) stored separately from encrypted data

3. **Key Storage Strategy**
   - Encrypted private keys stored in secure memory vault
   - Only key path references stored in database, never the keys themselves
   - Keys accessible via unique paths in format `wallet/{userId}/{uuid}`
   - Brief caching (60 seconds) for operational efficiency
   - Memory references actively cleared when no longer needed

4. **Access Protocol**
   - API requires authenticated JWT for all sensitive operations
   - Keys are decrypted only when needed for signing transactions
   - User transactions authorized via frontend but executed by backend

This approach provides the security benefits of cold storage while maintaining the convenience of a hot wallet interface. By keeping all cryptographic operations on the server, the system eliminates client-side attack vectors while providing a seamless user experience.