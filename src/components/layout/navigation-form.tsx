'use client'
import type { ComponentProps } from 'react'
import { usePageNavigation } from './page-navigation'

/** GET searches and filters keep native serialization without a full-page reload. */
export function NavigationForm({
  onSubmit,
  ...props
}: Omit<ComponentProps<'form'>, 'method' | 'action'> & {
  method?: 'get'
  action?: string
}) {
  const navigation = usePageNavigation()
  return (
    <form
      {...props}
      onSubmit={(event) => {
        onSubmit?.(event)
        if (event.defaultPrevented || !navigation) return
        const form = event.currentTarget
        const submitter = (event.nativeEvent as SubmitEvent).submitter
        const method =
          submitter?.getAttribute('formmethod') ??
          form.getAttribute('method') ??
          'get'
        const target =
          submitter?.getAttribute('formtarget') ?? form.getAttribute('target')
        if (method.toLowerCase() !== 'get' || (target && target !== '_self'))
          return
        const action = new URL(
          submitter?.getAttribute('formaction') ??
            form.getAttribute('action') ??
            window.location.href,
          window.location.href,
        )
        if (action.origin !== window.location.origin) return
        const params = new URLSearchParams()
        new FormData(form, submitter).forEach((value, key) =>
          params.append(key, typeof value === 'string' ? value : value.name),
        )
        action.search = params.toString()
        event.preventDefault()
        navigation.navigate(action.pathname + action.search + action.hash)
      }}
    />
  )
}
