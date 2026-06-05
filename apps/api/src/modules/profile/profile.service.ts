import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common'
import { ProfileRepository } from './profile.repository'
import { UpdateProfileDto, ProfileQueryDto } from './dto'

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name)

  constructor(private profileRepository: ProfileRepository) {}

  async getProfileById(id: string): Promise<Record<string, unknown>> {
    const profile = await this.profileRepository.findById(id)

    if (!profile) {
      throw new NotFoundException('Profile not found')
    }

    return { profile: this.sanitizeProfile(profile) }
  }

  async getProfiles(query: ProfileQueryDto): Promise<Record<string, unknown>> {
    const [profiles, total] = await this.profileRepository.findMany(query)

    const page = query.page || 1
    const limit = query.limit || 20
    const totalPages = Math.ceil(total / limit)

    return {
      profiles: profiles.map((p) => this.sanitizeProfile(p)),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Record<string, unknown>> {
    // Verify user owns the profile
    const profile = await this.profileRepository.findById(userId)
    if (!profile) {
      throw new NotFoundException('Profile not found')
    }

    const updated = await this.profileRepository.update(userId, updateProfileDto)

    this.logger.log(`Profile updated: ${userId}`)

    return { profile: this.sanitizeProfile(updated) }
  }

  private sanitizeProfile(
    profile: any,
  ): Record<string, unknown> {
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      location: profile.location,
      timezone: profile.timezone,
      verified: profile.verified,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }
  }
}
