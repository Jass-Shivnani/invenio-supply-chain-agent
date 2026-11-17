import { defineBackend } from '@aws-amplify/backend';

/**
 * Amplify Gen 2 Backend Configuration
 * This is a minimal backend setup focused on hosting the Next.js app
 * Authentication and APIs are already handled by existing Cognito and API Gateway
 */
const backend = defineBackend({
  // No resources defined - using existing AWS resources
});
