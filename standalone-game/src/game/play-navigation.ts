/** Navigation between world modes keeps the platform route mounted. */
export type PlayDestination = "explore" | "home" | "yard" | "world" | "places";
export function playHref(destination: PlayDestination, action?: string) {
  const params = new URLSearchParams();
  if (destination === "explore") params.set("explore", "1");
  else if (destination === "places") params.set("map", "community");
  else
    params.set(
      "home",
      destination === "home"
        ? "me"
        : destination === "yard"
          ? "me|yard"
          : "system:hub",
    );
  if (action) params.set("action", action);
  if (new URLSearchParams(window.location.search).get("demo") === "1")
    params.set("demo", "1");
  return (
    (window.location.pathname === "/" ? "/" : "/play") + "?" + params.toString()
  );
}
export function navigatePlay(destination: PlayDestination, action?: string) {
  const href = playHref(destination, action);
  if (href === window.location.pathname + window.location.search) {
    return;
  }
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function consumePlayAction() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("action")) return;
  params.delete("action");
  window.history.replaceState(
    null,
    "",
    window.location.pathname + "?" + params.toString(),
  );
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function navigateActorComparison() {
  const path = window.location.pathname === "/" ? "/" : "/play";
  const query = new URLSearchParams({ compare: "actors" });
  if (new URLSearchParams(window.location.search).get("demo") === "1") query.set("demo", "1");
  const href = path + "?" + query.toString();
  if (href === window.location.pathname + window.location.search) return;
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function navigateActorPreview() {
  const path = window.location.pathname === "/" ? "/" : "/play";
  const query = new URLSearchParams({ preview: "actors" });
  if (new URLSearchParams(window.location.search).get("demo") === "1") query.set("demo", "1");
  const href = path + "?" + query.toString();
  if (href === window.location.pathname + window.location.search) return;
  window.history.pushState(null, "", href);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
export function navigateFurnitureCreator() {
  navigateFurnitureEditor()
}
export function navigateFurnitureEditor(assetId?: string) {
  const path = window.location.pathname === '/' ? '/' : '/play'
  const query = new URLSearchParams({ preview: 'furniture' })
  if (assetId) query.set('asset', assetId)
  window.history.pushState(null, '', path + '?' + query)
  window.dispatchEvent(new PopStateEvent('popstate'))
}
export function navigateFurnitureComparison() {
  const path = window.location.pathname === '/' ? '/' : '/play'
  window.history.pushState(null, '', path + '?compare=furniture')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateSkinStudio() {
  const path = window.location.pathname === '/' ? '/' : '/play'
  window.history.pushState(null, '', path + '?preview=skin')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateStageEditor(){
  const path=window.location.pathname==='/'?'/':'/play'
  window.history.pushState(null,'',path+'?preview=stage')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateActorExplainer(){
  const path=window.location.pathname==='/'?'/':'/play'
  window.history.pushState(null,'',path+'?preview=anatomy')
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigateItemStudio(){
  const path=window.location.pathname==='/'?'/':'/play'
  window.history.pushState(null,'',path+'?preview=items')
  window.dispatchEvent(new PopStateEvent('popstate'))
}
