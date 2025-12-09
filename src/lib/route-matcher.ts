import { pathToRegexp } from 'path-to-regexp'

export function routeMatch(route: string | string[], target: string): boolean {
  const routes = Array.isArray(route) ? route : [route]
  return routes.some((r) => pathToRegexp(r).regexp.test(target))
}
