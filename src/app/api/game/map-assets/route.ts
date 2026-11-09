/** Public, fixed-origin relay. No credentials, user URLs, or private platform data. */
const ORIGIN='https://tiles.openfreemap.org'
export async function GET(request:Request) {
  const path=new URL(request.url).searchParams.get('path')||''
  if(path.length>2048||!/^\/(?:styles\/|fonts\/|sprites\/|natural_earth\/|planet(?:\/|$))/.test(path)||path.includes('..')||path.includes('\\')||path.includes('#'))return new Response('Unknown map resource',{status:400})
  const url=new URL(path,ORIGIN)
  if(url.origin!==ORIGIN||url.username||url.password||!/^\/(?:styles\/|fonts\/|sprites\/|natural_earth\/|planet(?:\/|$))/.test(url.pathname))return new Response('Unknown map resource',{status:400})
  try {
    const response=await fetch(url,{redirect:'error',cache:'force-cache',next:{revalidate:3600},signal:AbortSignal.any([request.signal,AbortSignal.timeout(12000)])})
    if(!response.ok)return new Response('The map provider could not supply this resource',{status:response.status===404?404:502,headers:{'Cache-Control':'no-store'}})
    if(Number(response.headers.get('content-length')||0)>8*1024*1024)return new Response('Map resource is too large',{status:502})
    return new Response(response.body,{headers:{'Content-Type':response.headers.get('content-type')||'application/octet-stream','Cache-Control':'public, max-age=3600, stale-while-revalidate=86400','X-Content-Type-Options':'nosniff'}})
  } catch {
    return new Response('The map provider is temporarily unavailable. Retry the map.',{status:503,headers:{'Cache-Control':'no-store'}})
  }
}
