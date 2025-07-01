import AWS from 'aws-sdk';
import { jwtDecode } from 'jwt-decode';
import { storage } from '../utils/storage';

interface CognitoConfig {
  region: string;
  userPoolId: string;
  clientId: string;
}

interface AuthTokens {
  AccessToken: string;
  IdToken: string;
  RefreshToken: string;
  TokenType: string;
  ExpiresIn: number;
}

interface UserAttributes {
  userId: string;
  userName: string;
  email: string;
}

class CognitoService {
  private cognitoIdentityServiceProvider?: AWS.CognitoIdentityServiceProvider;
  private config: CognitoConfig;
  private isDevMode: boolean;
  constructor() {
    this.isDevMode = process.env.EXPO_PUBLIC_DEV_MODE === 'true';

    this.config = {
      region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
      userPoolId: process.env.EXPO_PUBLIC_USER_POOL_ID || 'us-east-1_O2rQF4dnw',
      clientId:
        process.env.EXPO_PUBLIC_CLIENT_ID || '5h8ivvlrv2odgou8ultdbims5j',
    };

    // Initialize AWS for all platforms except when in dev mode
    if (!this.isDevMode) {
      AWS.config.update({
        region: this.config.region,
      });

      this.cognitoIdentityServiceProvider =
        new AWS.CognitoIdentityServiceProvider();
    }
  }

  private ensureServiceInitialized(): void {
    if (!this.isDevMode && !this.cognitoIdentityServiceProvider) {
      throw new Error('Cognito service not properly initialized');
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<{ requiresConfirmation: boolean }> {
    if (this.isDevMode) {
      // Mock response for development
      return { requiresConfirmation: false };
    }

    const params = {
      ClientId: this.config.clientId,
      Username: email,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
      ],
    };
    try {
      this.ensureServiceInitialized();
      await this.cognitoIdentityServiceProvider!.signUp(params).promise();
      return { requiresConfirmation: true };
    } catch (error: any) {
      throw new Error(error.message || 'Sign up failed');
    }
  }

  async confirmSignUp(
    email: string,
    confirmationCode: string,
    password: string
  ): Promise<{ tokens: AuthTokens; user: UserAttributes }> {
    if (this.isDevMode) {
      // Mock response for development
      const mockTokens: AuthTokens = {
        AccessToken: 'mock-access-token',
        IdToken: 'mock-id-token',
        RefreshToken: 'mock-refresh-token',
        TokenType: 'Bearer',
        ExpiresIn: 3600,
      };

      const mockUser: UserAttributes = {
        userId: 'mock-user-id',
        userName: email.split('@')[0],
        email,
      };

      return { tokens: mockTokens, user: mockUser };
    }

    const params = {
      ClientId: this.config.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    };
    try {
      this.ensureServiceInitialized();
      await this.cognitoIdentityServiceProvider!.confirmSignUp(
        params
      ).promise();

      // After successful confirmation, sign the user in automatically with the provided password
      return await this.signIn(email, password);
    } catch (error: any) {
      throw new Error(error.message || 'Confirmation failed');
    }
  }
  async signIn(
    email: string,
    password: string
  ): Promise<{ tokens: AuthTokens; user: UserAttributes }> {
    if (this.isDevMode) {
      // Mock response for development
      console.log('DEV MODE: Using mock authentication');
      const mockTokens: AuthTokens = {
        AccessToken: 'mock-access-token',
        IdToken: 'mock-id-token',
        RefreshToken: 'mock-refresh-token',
        TokenType: 'Bearer',
        ExpiresIn: 3600,
      };

      const mockUser: UserAttributes = {
        userId: 'mock-user-id',
        userName: email.split('@')[0],
        email,
      };

      return { tokens: mockTokens, user: mockUser };
    }

    this.ensureServiceInitialized();

    const params = {
      ClientId: this.config.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH' as const,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
    };

    try {
      const result = await this.cognitoIdentityServiceProvider!.initiateAuth(
        params
      ).promise();

      if (!result.AuthenticationResult) {
        throw new Error('Authentication failed');
      }

      const tokens = result.AuthenticationResult as AuthTokens;
      const user = this.decodeIdToken(tokens.IdToken);

      return { tokens, user };
    } catch (error: any) {
      throw new Error(error.message || 'Sign in failed');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    if (this.isDevMode) {
      // Mock response for development
      return;
    }

    const params = {
      ClientId: this.config.clientId,
      Username: email,
    };
    try {
      this.ensureServiceInitialized();
      await this.cognitoIdentityServiceProvider!.forgotPassword(
        params
      ).promise();
    } catch (error: any) {
      throw new Error(error.message || 'Forgot password request failed');
    }
  }

  async confirmForgotPassword(
    email: string,
    confirmationCode: string,
    newPassword: string
  ): Promise<void> {
    if (this.isDevMode) {
      // Mock response for development
      return;
    }

    const params = {
      ClientId: this.config.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    };
    try {
      this.ensureServiceInitialized();
      await this.cognitoIdentityServiceProvider!.confirmForgotPassword(
        params
      ).promise();
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    }
  }

  async refreshTokens(
    refreshToken: string
  ): Promise<{ tokens: AuthTokens; user: UserAttributes }> {
    if (this.isDevMode) {
      // Mock response for development
      const mockTokens: AuthTokens = {
        AccessToken: 'mock-access-token-refreshed',
        IdToken: 'mock-id-token-refreshed',
        RefreshToken: refreshToken,
        TokenType: 'Bearer',
        ExpiresIn: 3600,
      };

      const mockUser: UserAttributes = {
        userId: 'mock-user-id',
        userName: 'Current User', // Generic name for dev mode
        email: 'current@user.com',
      };

      return { tokens: mockTokens, user: mockUser };
    }

    const params = {
      ClientId: this.config.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH' as const,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };
    try {
      this.ensureServiceInitialized();
      const result = await this.cognitoIdentityServiceProvider!.initiateAuth(
        params
      ).promise();

      if (!result.AuthenticationResult) {
        throw new Error('Token refresh failed');
      }

      const tokens = {
        ...result.AuthenticationResult,
        RefreshToken: refreshToken, // Refresh token is not returned in refresh response
      } as AuthTokens;

      const user = this.decodeIdToken(tokens.IdToken);

      return { tokens, user };
    } catch (error: any) {
      throw new Error(error.message || 'Token refresh failed');
    }
  }

  async getUser(accessToken: string): Promise<UserAttributes> {
    if (this.isDevMode) {
      // Mock response for development
      return {
        userId: 'mock-user-id',
        userName: 'Current User',
        email: 'current@user.com',
      };
    }

    const params = {
      AccessToken: accessToken,
    };
    try {
      this.ensureServiceInitialized();
      const result = await this.cognitoIdentityServiceProvider!.getUser(
        params
      ).promise();

      const email =
        result.UserAttributes?.find((attr) => attr.Name === 'email')?.Value ||
        '';
      const name =
        result.UserAttributes?.find((attr) => attr.Name === 'name')?.Value ||
        '';

      return {
        userId: result.Username || '',
        userName: name,
        email: email,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Get user failed');
    }
  }

  async resendConfirmationCode(email: string): Promise<void> {
    if (this.isDevMode) {
      // Mock response for development
      return;
    }

    const params = {
      ClientId: this.config.clientId,
      Username: email,
    };
    try {
      this.ensureServiceInitialized();
      await this.cognitoIdentityServiceProvider!.resendConfirmationCode(
        params
      ).promise();
    } catch (error: any) {
      throw new Error(error.message || 'Resend confirmation code failed');
    }
  }

  async refreshSession(): Promise<AuthTokens | null> {
    if (this.isDevMode) {
      // In dev mode, generate new mock tokens with a new timestamp
      const existingTokens = await storage.getItem<AuthTokens>('authTokens');

      if (!existingTokens) {
        return null;
      }

      const refreshedTokens: AuthTokens = {
        AccessToken: `mock-access-token-${Date.now()}`,
        IdToken: `mock-id-token-${Date.now()}`,
        RefreshToken: existingTokens.RefreshToken,
        TokenType: 'Bearer',
        ExpiresIn: 3600,
      };

      // Store the new tokens
      await storage.setItem('authTokens', refreshedTokens);
      return refreshedTokens;
    }

    try {
      const tokens = await storage.getItem<AuthTokens>('authTokens');
      if (!tokens?.RefreshToken) {
        return null;
      }

      const params = {
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: this.config.clientId,
        AuthParameters: {
          REFRESH_TOKEN: tokens.RefreshToken,
        },
      };

      this.ensureServiceInitialized();
      const result = await this.cognitoIdentityServiceProvider!.initiateAuth(
        params
      ).promise();

      if (result.AuthenticationResult) {
        const newTokens: AuthTokens = {
          AccessToken: result.AuthenticationResult.AccessToken!,
          IdToken: result.AuthenticationResult.IdToken!,
          RefreshToken: tokens.RefreshToken, // Cognito doesn't always return a new refresh token
          TokenType: result.AuthenticationResult.TokenType!,
          ExpiresIn: result.AuthenticationResult.ExpiresIn!,
        };
        await storage.setItem('authTokens', newTokens);
        return newTokens;
      }
      return null;
    } catch (error: any) {
      console.error('Error refreshing session:', error);
      // If refresh fails, the user needs to log in again
      await this.logout();
      return null;
    }
  }

  async logout(): Promise<void> {
    await storage.removeItem('authTokens');
    await storage.removeItem('userData');
  }

  private decodeIdToken(idToken: string): UserAttributes {
    if (this.isDevMode) {
      // Mock decoded token for development
      return {
        userId: 'mock-user-id',
        userName: 'Current User',
        email: 'current@user.com',
      };
    }

    try {
      const decoded: any = jwtDecode(idToken);
      return {
        userId: decoded.sub || '',
        userName: decoded.name || '',
        email: decoded.email || '',
      };
    } catch {
      throw new Error('Failed to decode ID token');
    }
  }
}

export const cognitoService = new CognitoService();
export type { AuthTokens, UserAttributes };
