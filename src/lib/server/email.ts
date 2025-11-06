import { appEnv } from './env';

type MagicLinkContext = {
  email: string;
  link: string;
};

export const sendMagicLinkEmail = async ({ email, link }: MagicLinkContext) => {
  const from = appEnv.SMTP_FROM_ADDRESS ?? 'no-reply@example.com';

  console.info(`\n[Magic Link]\nFrom: ${from}\nTo: ${email}\nLink: ${link}\n`);
};
