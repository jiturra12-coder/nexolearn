import { fetchAPI } from './client'

export interface Profile {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  bio: string | null
  avatarUrl: string | null
  location: string | null
  timezone: string | null
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileDto {
  firstName?: string
  lastName?: string
  bio?: string
  avatarUrl?: string
  location?: string
  timezone?: string
}

export interface ProfileQueryDto {
  page?: number
  limit?: number
  search?: string
  location?: string
  sortBy?: 'createdAt' | 'firstName' | 'verified'
  sortOrder?: 'asc' | 'desc'
}

export async function getOwnProfile(token: string): Promise<{ profile: Profile }> {
  return fetchAPI('/api/v1/profiles/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}

export async function getProfileById(id: string, token?: string): Promise<{ profile: Profile }> {
  return fetchAPI(`/api/v1/profiles/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function getProfiles(
  query: ProfileQueryDto,
  token?: string,
): Promise<{
  profiles: Profile[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}> {
  return fetchAPI('/api/v1/profiles', {
    params: {
      page: query.page,
      limit: query.limit,
      search: query.search,
      location: query.location,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    },
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

export async function updateProfile(
  dto: UpdateProfileDto,
  token: string,
): Promise<{ profile: Profile }> {
  return fetchAPI('/api/v1/profiles/me', {
    method: 'PATCH',
    body: JSON.stringify(dto),
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
}
