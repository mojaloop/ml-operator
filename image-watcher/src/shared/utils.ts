import { ImageName, ImageSpec } from '~/domain/types';

export function imageNameAsString (spec: ImageName) {
  return `${spec.orgId}/${spec.imageName}`
}

export const zeroPad = (num: number, places: number) => String(num).padStart(places, '0')

// Make a lexicographically sortable tag
export const semanticSortable = (tag: string): string => {
  const { MAJOR, MINOR, BUGFIX, PATCH } = semanticSplit(tag)
  const bugfixSplit = BUGFIX.split('-')
  // TODO Handle patch tags better...

  const majorInt = parseInt(MAJOR.replace('v', ''))
  const minorInt = parseInt(MINOR)
  const bugfixInt = parseInt(bugfixSplit[0])
  const bugfixSuffix = bugfixSplit.length > 1 ? `-${bugfixSplit[1]}` : ''
  const patchInt = parseInt(PATCH)

  return `${zeroPad(majorInt, 4)}.${zeroPad(minorInt, 4)}.${zeroPad(bugfixInt, 4)}${bugfixSuffix}.${zeroPad(patchInt, 4)}`
}

export const semanticSplit = (tag: string): { MAJOR: string, MINOR: string, BUGFIX: string, PATCH: string } => {
  const [MAJOR, MINOR, BUGFIX, PATCH] = tag.split('.')

  if (!MAJOR || !MINOR || !BUGFIX) {
    throw new Error("Couldn't parse tag")
  }

  return {
    MAJOR,
    MINOR,
    BUGFIX,
    PATCH
  }
}


export const semanticSort = (a: ImageSpec, b: ImageSpec) => {
  const sortableTagA = semanticSortable(a.tag)
  const sortableTagB = semanticSortable(b.tag)

  if (sortableTagA === sortableTagB) {
    return 0
  }

  return sortableTagA < sortableTagB ? 1 : -1
}
