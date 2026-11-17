import { Button } from '@/components/ui/button'
import { BOSS_FAMILIES, familyAssets, type FamilyId } from '@/game/monsters/family-catalog'
import { navigateMonsterFamily } from '@/game/play-navigation'

export function MonsterFamilyRoster({ familyId, selectedId }: { familyId: FamilyId; selectedId?: string }) {
  const family = BOSS_FAMILIES.find(entry => entry.id === familyId)!
  const members = [{ id: '', name: family.name, tier: 'Boss', icon: `/pawtrail-game/monsters/${family.bossId}/v1/icon.png`, detail: 'Parent encounter' },
    ...family.creatures.map(creature => ({ id: creature.id, name: creature.name, tier: creature.tier === 'mini-boss' ? 'Mini-boss' : 'Normal mob', icon: familyAssets(family, creature) + 'icon.png', detail: `${creature.maxHp.toLocaleString()} HP · ${creature.height}× player height` }))]
  return <nav aria-label={`${family.name} encounter family`} className="border-b bg-muted/25 px-4 py-3">
    <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1"><h2 className="font-heading text-lg font-semibold">{family.name}’s family</h2><p className="text-xs text-muted-foreground">Choose a member · one local encounter at a time</p></div>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">{members.map(member => {
      const selected = member.id === (selectedId ?? '')
      return <Button key={member.id} variant={selected ? 'secondary' : 'outline'} aria-current={selected ? 'page' : undefined} aria-label={`${member.name} · ${member.tier}`} onClick={() => navigateMonsterFamily(family.bossQuery, member.id || undefined)} className="h-auto min-w-0 justify-start gap-2 px-2 py-2 text-left">
        <img src={member.icon} alt="" width={32} height={32} className="size-8 shrink-0 [image-rendering:pixelated]" />
        <span className="min-w-0"><span className="block truncate font-heading text-base font-semibold leading-tight">{member.name}</span><span className="block text-[10px] font-normal text-muted-foreground">{member.tier}</span><span className="block truncate text-[9px] font-normal text-muted-foreground">{member.detail}</span></span>
      </Button>
    })}</div>
  </nav>
}
