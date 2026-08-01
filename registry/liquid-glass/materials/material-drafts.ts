import {
  getGlassMaterialSource,
  glassMaterialNames,
  normalizeGlassMaterialParams,
  type GlassMaterialName,
  type GlassMaterialParams,
} from "./materials";

export type GlassMaterialDraftMap = Record<
  GlassMaterialName,
  GlassMaterialParams
>;

export function createGlassMaterialDrafts(): GlassMaterialDraftMap {
  return Object.fromEntries(
    glassMaterialNames.map((name) => [
      name,
      { ...getGlassMaterialSource(name) },
    ]),
  ) as GlassMaterialDraftMap;
}

export function replaceGlassMaterialDraft(
  drafts: GlassMaterialDraftMap,
  name: GlassMaterialName,
  next: GlassMaterialParams,
): GlassMaterialDraftMap {
  return {
    ...drafts,
    [name]: normalizeGlassMaterialParams(next),
  };
}

export function restoreGlassMaterialDraft(
  drafts: GlassMaterialDraftMap,
  saved: GlassMaterialDraftMap,
  name: GlassMaterialName,
): GlassMaterialDraftMap {
  return replaceGlassMaterialDraft(drafts, name, saved[name]);
}
