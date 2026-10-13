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

// Only list datasets that exist in the project; the first one is the Studio's landing workspace.
const datasets = (process.env.SANITY_STUDIO_DATASETS ?? 'production,staging,development')
  .split(',')
  .map((d) => d.trim())
  .filter(Boolean);
const title = (dataset: string) => dataset.charAt(0).toUpperCase() + dataset.slice(1);

export default defineConfig(datasets.map((dataset) => workspace(dataset, title(dataset))));
