declare module '@sitebuilder/react/server' {
  export function WebsitePage(
    props: Parameters<typeof import('@sitebuilder/react').WebsitePage>[0],
  ): import('react').ReactElement
}
