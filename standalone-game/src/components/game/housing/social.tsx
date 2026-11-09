import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  Gift,
  Heart,
  Home,
  Mail,
  MessageCircle,
  Search,
  Send,
  ShieldBan,
  UserPlus,
  Users,
  VolumeX,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { action, enter, live, patch, searchPeople } from '@/game/housing/client'
import type { HomesState, Person } from '@/game/housing/types'
export function Identity({ person }: { person: Person }) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {person.avatar ? (
        <img
          src={person.avatar}
          alt=""
          className="size-9 rounded-full object-cover"
        />
      ) : (
        <Users className="size-9 rounded-full bg-muted p-2 text-muted-foreground" />
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-bold">{person.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          @{person.username} ·{' '}
          {person.online ? person.location || 'Online' : 'Offline'}
        </p>
      </div>
    </div>
  )
}
export function SocialPanel({
  state,
  tab,
  setTab,
}: {
  state: HomesState
  tab: string
  setTab: (tab: string) => void
}) {
  const data = state.data!,
    me = data.player,
    [query, setQuery] = useState(''),
    [text, setText] = useState(''),
    [recipient, setRecipient] = useState<Person | null>(null),
    [muted, setMuted] = useState(false),
    [gift, setGift] = useState<Person | null>(null)
  useEffect(() => {
    if (state.chatWith) {
      setRecipient(state.chatWith)
      setTab('chat')
    }
  }, [state.chatWith])
  const end = useRef<HTMLDivElement>(null),
    input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const timer = setTimeout(() => {
      void searchPeople(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'nearest' })
  }, [state.chat.length, data.messages.length, tab])
  useEffect(() => {
    const focus = () => {
      setTab('chat')
      setTimeout(() => input.current?.focus(), 50)
    }
    window.addEventListener('pawtrail:focus-chat', focus)
    return () => window.removeEventListener('pawtrail:focus-chat', focus)
  }, [setTab])
  const send = () => {
    if (!text.trim()) return
    if (recipient) action({ type: 'dm', target: recipient.id, text })
    else live({ type: 'player.chat', text })
    setText('')
  }
  const friends = data.friends,
    requests = data.requests.filter((r) => r.recipient.id === me.id)
  const card = (p: Person, isFriend: boolean) => (
    <div key={p.id} className="space-y-2 border-b py-3 last:border-0">
      <Identity person={p} />
      <div className="flex flex-wrap gap-1.5">
        {isFriend ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void enter(p.id)}
            >
              <Home className="size-3.5" />
              Visit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setRecipient(p)
                setTab('chat')
              }}
              aria-label={'Message ' + p.name}
            >
              <MessageCircle className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => action({ type: 'invite', target: p.id })}
              aria-label={'Invite ' + p.name}
            >
              <Mail className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setGift(p)}
              aria-label={'Send a gift to ' + p.name}
            >
              <Gift className="size-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => action({ type: 'remove-friend', target: p.id })}
              aria-label={'Remove ' + p.name + ' from friends'}
            >
              <X className="size-3.5" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={data.requests.some(
              (r) => r.sender.id === me.id && r.recipient.id === p.id,
            )}
            onClick={() => action({ type: 'request', target: p.id })}
          >
            <UserPlus className="size-3.5" />
            Add friend
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => action({ type: 'block', target: p.id })}
          aria-label={'Block ' + p.name}
        >
          <ShieldBan className="size-3.5" />
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a
            href={'/users/' + encodeURIComponent(p.username)}
            aria-label={'View ' + p.name + ' profile'}
          >
            <ArrowUpRight className="size-3.5" />
          </a>
        </Button>
      </div>
    </div>
  )
  return (
    <Tabs
      value={tab}
      onValueChange={(value) => {
        setTab(value)
        if (value === 'friends')
          action({ type: 'fact', target: 'friends-panel' })
        if (value === 'chat') patch({ unread: 0 })
      }}
      className="flex h-full min-h-0 flex-col"
    >
      <TabsList className="mx-3 mt-3 grid w-auto shrink-0 grid-cols-3">
        <TabsTrigger value="friends">Friends</TabsTrigger>
        <TabsTrigger value="chat">
          Chat
          {state.unread > 0 && (
            <span className="ml-1 text-[10px]">{state.unread}</span>
          )}
        </TabsTrigger>
        <TabsTrigger value="invites">Invites</TabsTrigger>
      </TabsList>
      <TabsContent
        value="friends"
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
      >
        <h2 className="mb-3 mt-4 font-heading text-xl font-extrabold">
          Good company
        </h2>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
          Find players who have opened PawTrail Homes. Friends can invite you
          into their space.
        </p>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a PawPal…"
            aria-label="Find players"
            className="pl-9"
          />
        </div>
        {requests.length > 0 && (
          <section className="my-3 rounded-xl border bg-muted/40 p-3">
            <h3 className="mb-2 text-sm font-bold">
              Requests · {requests.length}
            </h3>
            {requests.map((r) => (
              <div key={r.id} className="space-y-2 py-2">
                <Identity person={r.sender} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() =>
                      action({ type: 'accept', target: r.sender.id })
                    }
                  >
                    <Check className="size-3.5" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      action({ type: 'decline', target: r.sender.id })
                    }
                  >
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}
        <h3 className="mb-1 mt-4 text-xs font-bold text-muted-foreground">
          YOUR FRIENDS · {friends.length}
        </h3>
        {friends.length ? (
          friends.map((p) => card(p, true))
        ) : (
          <p className="py-5 text-sm text-muted-foreground">
            Your first friend is a hello away. Search above, or meet someone in
            the neighborhood.
          </p>
        )}
        {state.people
          .filter((p) => !friends.some((f) => f.id === p.id))
          .map((p) => card(p, false))}
        {gift && (
          <section className="mt-4 rounded-xl border p-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">A gift for {gift.name}</h3>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setGift(null)}
                aria-label="Cancel gift"
              >
                <X className="size-4" />
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Only unplaced items can be given. Sending transfers ownership.
            </p>
            {data.catalog
              .filter((i) => (me.availableInventory[i.id] || 0) > 0)
              .slice(0, 12)
              .map((i) => (
                <Button
                  key={i.id}
                  size="sm"
                  variant="outline"
                  className="mb-2 mr-1"
                  onClick={() => {
                    action({ type: 'gift', target: gift.id, item: i.id })
                    setGift(null)
                  }}
                >
                  {i.label}
                </Button>
              ))}
          </section>
        )}
      </TabsContent>
      <TabsContent
        value="chat"
        className="flex min-h-0 flex-1 flex-col px-3 pb-3"
      >
        <div className="flex items-center justify-between py-3">
          <h2 className="font-bold">
            {recipient ? 'Private conversation' : 'Around the house'}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            aria-label={muted ? 'Unmute house chat' : 'Mute house chat'}
            onClick={() => {
              setMuted(!muted)
              patch({ mutedChat: !muted })
            }}
          >
            <VolumeX className="size-4" />
          </Button>
        </div>
        {recipient && (
          <div className="mb-2 flex items-center justify-between rounded-lg bg-muted p-2">
            <span className="truncate text-xs">
              Only you and {recipient.name}
            </span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setRecipient(null)
                patch({ chatWith: null })
              }}
              aria-label="Return to house chat"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        )}
        <div
          className="min-h-32 flex-1 space-y-3 overflow-y-auto py-3"
          aria-live="polite"
        >
          {!recipient && muted ? (
            <p className="text-sm text-muted-foreground">
              House chat is muted on this device.
            </p>
          ) : (
            (recipient
              ? data.messages.filter(
                  (m) =>
                    m.sender.id === recipient.id ||
                    m.recipient?.id === recipient.id,
                )
              : state.chat
            ).map((m) => (
              <div key={m.id} className="text-sm">
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-bold">
                    {m.sender.id === me.id ? 'You' : m.sender.name}
                  </span>
                  <time className="text-[10px] text-muted-foreground">
                    {new Date(m.at * 1000).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                </div>
                <p className="break-words leading-relaxed">{m.text}</p>
              </div>
            ))
          )}
          <div ref={end} />
        </div>
        <form
          className="space-y-2 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault()
            send()
          }}
        >
          <Input
            ref={input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={280}
            placeholder={
              recipient ? 'Send a private message…' : 'Say something kind…'
            }
            aria-label={recipient ? 'Private message' : 'House chat message'}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.currentTarget.blur()
                e.stopPropagation()
              }
            }}
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {['♡', '☺', '☆'].map((mark) => (
                <Button
                  key={mark}
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={'Insert ' + mark}
                  onClick={() => setText((text + mark).slice(0, 280))}
                >
                  {mark}
                </Button>
              ))}
            </div>
            <Button
              size="sm"
              type="submit"
              disabled={!text.trim() || state.status !== 'online' || state.busy}
            >
              <Send className="size-3.5" />
              Send
            </Button>
          </div>
        </form>
      </TabsContent>
      <TabsContent
        value="invites"
        className="min-h-0 flex-1 overflow-y-auto px-4 pb-4"
      >
        <h2 className="my-4 font-heading text-xl font-extrabold">
          You’re welcome here
        </h2>
        {data.invitations
          .filter((i) => i.recipient.id === me.id)
          .map((i) => (
            <div key={i.id} className="space-y-3 border-b py-4">
              <Identity person={i.sender} />
              <p className="text-sm">An invitation to {i.sender.name}’s home</p>
              <Button
                size="sm"
                onClick={() => action({ type: 'accept-invite', target: i.id })}
              >
                <Home className="size-4" />
                Visit home
              </Button>
            </div>
          ))}
        {!data.invitations.some((i) => i.recipient.id === me.id) && (
          <p className="py-4 text-sm text-muted-foreground">
            Invitations will appear here. You can send one from a friend’s quick
            actions.
          </p>
        )}
        <h3 className="mb-3 mt-6 flex items-center justify-between text-sm font-bold">
          Updates
          <Button
            size="sm"
            variant="ghost"
            onClick={() => action({ type: 'clear-notifications' })}
          >
            Clear
          </Button>
        </h3>
        {me.notifications.map((n) => (
          <p key={n.id} className="border-b py-3 text-xs leading-relaxed">
            {n.text}
          </p>
        ))}
        {!me.notifications.length && (
          <p className="py-4 text-sm text-muted-foreground">
            A quiet moment. New visits and messages will appear here.
          </p>
        )}
        {me.favorites.length > 0 && (
          <>
            <h3 className="mt-6 text-sm font-bold">Favorite homes</h3>
            {me.favorites.map((id) => (
              <Button
                key={id}
                size="sm"
                variant="link"
                className="block px-0"
                onClick={() => void enter(id)}
              >
                Visit saved home <Heart className="ml-2 inline size-3.5" />
              </Button>
            ))}
          </>
        )}
      </TabsContent>
    </Tabs>
  )
}
