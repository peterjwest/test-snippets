import { UserConfig } from 'unlinted';

export default {
  rules: {
    CONTENT_VALIDATION: {
      rules: {
        UNEXPECTED_CHARACTER: { allowed: ['✓', '✗'] },
      },
    },
  },
} satisfies UserConfig;
