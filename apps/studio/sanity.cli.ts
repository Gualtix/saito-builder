import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: { projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? '', dataset: 'production' },
  // `sanity deploy` publishes to https://<studioHost>.sanity.studio (prompts when unset).
  studioHost: process.env.SANITY_STUDIO_HOSTNAME || undefined,
  // Deployed application (https://saito-builder.sanity.studio); keeps `sanity deploy` from prompting.
  deployment: { appId: 'xloz1snhhbp4n2klseelo51h' },
});
