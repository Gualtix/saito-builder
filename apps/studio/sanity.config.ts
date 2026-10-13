import { visionTool } from '@sanity/vision';
import { defineConfig, type WorkspaceOptions } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID ?? '';

/**
 * One Studio workspace per environment dataset. Editors publish to "staging" for review;
 * promotion to "production" is a dataset copy or re-publish (see docs/ARCHITECTURE.md).
 */
const workspace = (dataset: string, title: string): WorkspaceOptions => ({
  name: dataset,
  basePath: `/${dataset}`,
  title: `Saito · ${title}`,
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: { types: schemaTypes },
});

export default defineConfig([workspace('production', 'Production'), workspace('staging', 'Staging'), workspace('development', 'Development')]);
