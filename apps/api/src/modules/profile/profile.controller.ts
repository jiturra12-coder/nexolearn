import { Body, Controller, Get, Patch, Param, UseGuards, Request, Query, HttpCode, HttpStatus } from '@nestjs/common'
import { ProfileService } from './profile.service'
import { UpdateProfileDto, ProfileQueryDto } from './dto'
import { SupabaseAuthGuard, AuthenticatedRequest } from '@/common/auth/supabase-auth.guard'

@Controller({ path: 'profiles', version: '1' })
export class ProfileController {
  constructor(private profileService: ProfileService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  async getOwnProfile(@Request() req: AuthenticatedRequest): Promise<Record<string, unknown>> {
    return this.profileService.getProfileById(req.user?.sub || '')
  }

  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateOwnProfile(
    @Request() req: AuthenticatedRequest,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Record<string, unknown>> {
    return this.profileService.updateProfile(req.user?.sub || '', updateProfileDto)
  }

  @Get()
  async getProfiles(
    @Query() query: ProfileQueryDto,
  ): Promise<Record<string, unknown>> {
    return this.profileService.getProfiles(query)
  }

  @Get(':id')
  async getProfile(@Param('id') id: string): Promise<Record<string, unknown>> {
    return this.profileService.getProfileById(id)
  }
}
