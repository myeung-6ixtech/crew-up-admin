import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: {
    [`https://${process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN}.hasura.${process.env.NEXT_PUBLIC_NHOST_REGION}.nhost.run/v1/graphql`]:
      {
        headers: {},
      },
  },
  documents: ['lib/graphql/**/*.ts'],
  generates: {
    'lib/types/graphql.generated.ts': {
      plugins: ['typescript', 'typescript-operations'],
      config: {
        avoidOptionals: true,
        enumsAsTypes: true,
        skipTypename: true,
      },
    },
  },
};

export default config;
