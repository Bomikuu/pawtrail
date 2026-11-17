import type { ArenaActor, ArenaEvent, ArenaVariant } from './arena-contract'
import { ARENA_DEFINITIONS } from './arena-definitions'

/** Only the selected boss allocates art, simulation and optional hazard sprites. */
export async function loadArenaActor(variant: ArenaVariant, notify: (event: ArenaEvent) => void, creatureId?: string): Promise<ArenaActor> {
  if (creatureId) {
    const [{ familyMember, familyArena }, { FamilyEncounter }, { FamilyRig }, { FamilyFields }] = await Promise.all([
      import('./family-catalog'), import('./family-encounter'), import('./family-rig'), import('./family-fields'),
    ])
    const selected = familyMember(creatureId)
    if (!selected) throw new Error('Unknown family creature: ' + creatureId)
    const { family, creature } = selected, rig = await FamilyRig.create(family, creature)
    try {
      const encounter = new FamilyEncounter(creature, notify), fields = new FamilyFields(creature)
      return { definition: familyArena(family, creature), encounter, root: rig.root,
        pose: (time, reduced) => rig.pose(time, encounter, reduced), dispose: () => rig.dispose(),
        hazards: { root: fields.root, update: reduced => fields.update(encounter, reduced), dispose: () => fields.dispose() } }
    } catch (error) { rig.dispose(); throw error }
  }
  if (variant === 'deity') {
    const [{ DeityEncounter }, { DeityRig }, { DeityFields }] = await Promise.all([import('./deity-encounter'), import('./deity-rig'), import('./deity-fields')])
    const rig = await DeityRig.create()
    try {
      const encounter = new DeityEncounter(notify), fields = new DeityFields()
      return { definition: ARENA_DEFINITIONS.deity, encounter, root: rig.root,
        pose: (time,reduced)=>rig.pose(time,encounter,reduced), dispose:()=>rig.dispose(),
        hazards: { root: fields.root, update:reduced=>fields.update(encounter,reduced), dispose:()=>fields.dispose() } }
    } catch(error) { rig.dispose(); throw error }
  }
  if (variant === 'robot') {
    const [{RobotEncounter},{RobotRig},{RobotFields}]=await Promise.all([import('./robot-encounter'),import('./robot-rig'),import('./robot-fields')])
    const rig=await RobotRig.create()
    try{
      const encounter=new RobotEncounter(notify),fields=new RobotFields()
      return {definition:ARENA_DEFINITIONS.robot,encounter,root:rig.root,
        pose:(time,reduced)=>rig.pose(time,encounter,reduced),dispose:()=>rig.dispose(),
        hazards:{root:fields.root,update:reduced=>fields.update(encounter,reduced),dispose:()=>fields.dispose()}}
    }catch(error){rig.dispose();throw error}
  }
  if (variant === 'reaper') {
    const [{ ReaperEncounter }, { ReaperRig }, { ReaperFields }] = await Promise.all([import('./reaper-encounter'), import('./reaper-rig'), import('./reaper-fields')])
    const rig = await ReaperRig.create(), encounter = new ReaperEncounter(notify), fields = new ReaperFields()
    return { definition: ARENA_DEFINITIONS.reaper, encounter, root: rig.root, pose: (time, reduced) => rig.pose(time, encounter, reduced), dispose: () => rig.dispose(), hazards: { root: fields.root, update: reduced => fields.update(encounter, reduced), dispose: () => fields.dispose() } }
  }
  if (variant === 'serpent') {
    const [{ SerpentEncounter }, { SerpentRig }] = await Promise.all([import('./serpent-encounter'), import('./serpent-rig')])
    const rig = await SerpentRig.create(), encounter = new SerpentEncounter(notify)
    return { definition: ARENA_DEFINITIONS.serpent, encounter, root: rig.root, pose: (time, reduced) => rig.pose(time, encounter, reduced), dispose: () => rig.dispose() }
  }
  const [{ HydraEncounter }, { HydraRig }, { HydraEmbers }] = await Promise.all([import('./hydra-encounter'), import('./hydra-rig'), import('./hydra-embers')])
  const rig = await HydraRig.create()
  try {
    const embers = await HydraEmbers.create(), encounter = new HydraEncounter(notify)
    return { definition: ARENA_DEFINITIONS.hydra, encounter, root: rig.root, pose: (time, reduced) => rig.pose(time, encounter, reduced), dispose: () => rig.dispose(), hazards: { root: embers.root, update: reduced => embers.update(encounter.bolts, reduced), dispose: () => embers.dispose() } }
  } catch (error) { rig.dispose(); throw error }
}
