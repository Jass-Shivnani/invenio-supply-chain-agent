import { Amplify } from 'aws-amplify';

const amplifyConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID || 'us-east-1_edTqGcEr0',
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID || '2rf7kqsqislpgl8jigd1k8i4bg',
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID || '',
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: 'code' as const,
      userAttributes: {
        email: {
          required: true,
        },
        name: {
          required: true,
        },
        phone_number: {
          required: false,
        },
      },
      allowGuestAccess: false,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: true,
      },
    },
  },
};

export function configureAmplify() {
  Amplify.configure(amplifyConfig, { ssr: true });
}

export default amplifyConfig;
