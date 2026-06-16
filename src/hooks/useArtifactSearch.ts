import Fuse from 'fuse.js'
import { useMemo, useState } from 'react'
import type { Artifact } from '@/types/artifact'
import type { IFuseOptions } from 'fuse.js'

const FUSE_OPTIONS: IFuseOptions<Artifact> = {
  keys: [
    { name: 'title',           weight: 0.3 },
    { name: 'description',     weight: 0.15 },
    { name: 'cultural_origin', weight: 0.2 },
    { name: 'age',             weight: 0.15 },
    { name: 'tags',            weight: 0.1 },
    { name: 'location.country', weight: 0.2 },
    { name: 'location.city',   weight: 0.1 },
    { name: 'location.region', weight: 0.1 },
    { name: 'materials',       weight: 0.1 },
  ],
  threshold: 0.35,
  distance: 200,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
  ignoreLocation: true,
}

export interface SearchFilters {
  country: string
  condition: string
  type: 'all' | '2d' | '3d'
  tag: string
}

export function useArtifactSearch(artifacts: Artifact[]) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    country: '',
    condition: '',
    type: 'all',
    tag: '',
  })

  // Build Fuse index when artifacts change
  const fuse = useMemo(() => {
    if (!artifacts.length) return null
    return new Fuse(artifacts, FUSE_OPTIONS)
  }, [artifacts])

  // Apply search + filters
  const filteredArtifacts = useMemo(() => {
    let result = artifacts

    // Apply fuzzy text search
    if (searchQuery.trim().length >= 2 && fuse) {
      const fuseResults = fuse.search(searchQuery)
      result = fuseResults.map(r => r.item)
    }

    // Apply country filter (also fuzzy-tolerant)
    if (filters.country.trim()) {
      const countryQuery = filters.country.trim().toLowerCase()
      result = result.filter(a => {
        const country = (a.location?.country || '').toLowerCase()
        const city = (a.location?.city || '').toLowerCase()
        const region = (a.location?.region || '').toLowerCase()
        const state = (a.location?.state || '').toLowerCase()
        return country.includes(countryQuery) ||
               city.includes(countryQuery) ||
               region.includes(countryQuery) ||
               state.includes(countryQuery) ||
               fuzzyMatch(countryQuery, country)
      })
    }

    // Apply condition filter
    if (filters.condition) {
      result = result.filter(a =>
        a.condition?.toLowerCase() === filters.condition.toLowerCase()
      )
    }

    // Apply type filter
    if (filters.type === '3d') result = result.filter(a => a.is_3d)
    if (filters.type === '2d') result = result.filter(a => !a.is_3d)

    // Apply tag filter
    if (filters.tag.trim()) {
      const tagQuery = filters.tag.trim().toLowerCase()
      result = result.filter(a =>
        a.tags?.some(tag => tag.toLowerCase().includes(tagQuery))
      )
    }

    return result
  }, [artifacts, searchQuery, filters, fuse])

  const hasActiveFilters = searchQuery.trim() !== '' ||
    filters.country.trim() !== '' ||
    filters.condition !== '' ||
    filters.type !== 'all' ||
    filters.tag.trim() !== ''

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({ country: '', condition: '', type: 'all', tag: '' })
  }

  return {
    searchQuery,
    setSearchQuery,
    filters,
    setFilters,
    filteredArtifacts,
    hasActiveFilters,
    clearFilters,
    totalCount: artifacts.length,
    filteredCount: filteredArtifacts.length,
  }
}

// Simple fuzzy character matching for short queries
function fuzzyMatch(query: string, target: string): boolean {
  if (query.length < 3) return false
  let qi = 0
  for (let ti = 0; ti < target.length && qi < query.length; ti++) {
    if (query[qi] === target[ti]) qi++
  }
  return qi === query.length
}
