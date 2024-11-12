export const verificationTemplates = {
  VERIFICATION_OTP: {
    name: 'VERIFICATION_OTP',
    type: 'VERIFICATION',
    content: 'Your verification code is {{otp}}. Valid for 10 minutes.',
    variables: [
      {
        name: 'otp',
        description: 'One-time password',
        required: true
      }
    ]
  }
};