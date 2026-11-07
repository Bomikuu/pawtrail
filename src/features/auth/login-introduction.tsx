import { Heart, House, MapPin } from 'lucide-react'
import { AuthBrand } from './auth-brand'

const features = [
  {
    icon: MapPin,
    title: 'Spot & report',
    description: 'Share animal sightings and help keep their stories up to date.',
    color: 'bg-[#ffecdb] text-[#bd5417] dark:bg-primary/10 dark:text-primary',
  },
  {
    icon: House,
    title: 'Support shelters',
    description: 'Follow, volunteer, and be part of local shelter efforts.',
    color: 'bg-[#e8f1f4] text-[#347a96] dark:bg-sky-950/50 dark:text-sky-300',
  },
  {
    icon: Heart,
    title: 'Adopt a friend',
    description: 'Meet adoptable animals and help them find a loving home.',
    color: 'bg-[#edf1df] text-[#587934] dark:bg-lime-950/50 dark:text-lime-300',
  },
]

export function LoginIntroduction() {
  return (
    <section className="hidden min-w-0 lg:block" aria-labelledby="login-introduction">
      <AuthBrand />
      <h2
        id="login-introduction"
        className="mt-8 max-w-[24ch] font-heading text-[2.25rem] font-semibold leading-[1.18] tracking-[-0.025em] xl:text-[2.5rem]"
      >
        Track. Help. Adopt.
        <br />
        Build a kinder community.
      </h2>
      <p className="mt-4 max-w-[43ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
        A community-powered platform to report, support, and find loving homes
        for animals in your area.
      </p>
      <ul className="mt-8 grid max-w-96 gap-5">
        {features.map(({ icon: Icon, title, description, color }) => (
          <li key={title} className="flex items-start gap-3.5">
            <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${color}`}>
              <Icon aria-hidden="true" className="size-[1.375rem]" strokeWidth={1.7} />
            </span>
            <div className="pt-0.5">
              <h3 className="font-heading text-base font-semibold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <img
        src="/images/illustrations/login-companions.webp"
        width={1100}
        height={704}
        alt=""
        fetchPriority="high"
        className="mt-3 block w-full max-w-[26rem]"
      />
    </section>
  )
}
