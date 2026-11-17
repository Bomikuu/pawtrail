import type { Furniture, ObjectState } from '../housing/types'

/** One state-art selector for the native room and local interaction trial. */
export function furnitureStateView(definition: Pick<Furniture, 'file' | 'stateViews'>, state?: Pick<ObjectState, 'open' | 'lit'>) {
  if (state?.open && definition.stateViews?.open)
    return { file: definition.stateViews.open.file, suffix: ':open' }
  if (state?.lit === false && definition.stateViews?.unlit)
    return { file: definition.stateViews.unlit.file, suffix: ':unlit' }
  return { file: definition.file, suffix: '' }
}
