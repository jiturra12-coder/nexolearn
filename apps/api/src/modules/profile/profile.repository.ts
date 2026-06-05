import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/prisma/prisma.service'
import { Profile } from '@prisma/client'
import { UpdateProfileDto, ProfileQueryDto } from './dto'

@Injectable()
export class ProfileRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { id },
    })
  }

  async findByEmail(email: string): Promise<Profile | null> {
    return this.prisma.profile.findUnique({
      where: { email },
    })
  }

  async findMany(query: ProfileQueryDto): Promise<[Profile[], number]> {
    const page = query.page || 1
    const limit = query.limit || 20
    const skip = (page - 1) * limit
    const sortBy = query.sortBy || 'createdAt'
    const sortOrder = query.sortOrder || 'desc'

    const where: Record<string, unknown> = {}

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.location) {
      where.location = { contains: query.location, mode: 'insensitive' }
    }

    const profiles = await this.prisma.profile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [sortBy]: sortOrder },
    })

    const total = await this.prisma.profile.count({ where })

    return [profiles, total]
  }

  async create(data: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'> & { id: string }): Promise<Profile> {
    return this.prisma.profile.create({
      data: {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
  }

  async update(id: string, data: UpdateProfileDto): Promise<Profile> {
    return this.prisma.profile.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    })
  }

  async delete(id: string): Promise<Profile> {
    return this.prisma.profile.delete({
      where: { id },
    })
  }
}
