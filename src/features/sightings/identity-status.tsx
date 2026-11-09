import { Badge } from '@/components/ui/badge'
export function IdentityStatus({ identity, evidence, publication, method }: { identity: string; evidence: string; publication: string; method?: string | null }) {
  return <div className="flex flex-wrap gap-2"><Badge variant={identity === 'confirmed' ? 'default' : 'secondary'}>{identity === 'confirmed' ? method === 'automatic' ? 'Automatically matched' : 'Identity confirmed' : identity === 'disputed' ? 'Identity disputed' : identity === 'suggested' ? 'Possible match' : 'Animal not identified'}</Badge><Badge variant="outline">{publication === 'published' ? 'Published sighting' : evidence === 'rejected' ? 'Evidence rejected' : 'Awaiting evidence review'}</Badge></div>
}
