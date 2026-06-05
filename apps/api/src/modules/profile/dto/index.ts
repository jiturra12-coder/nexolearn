import { IsString, IsOptional, IsEmail, IsInt, Min, Max } from 'class-validator'

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string

  @IsString()
  @IsOptional()
  lastName?: string

  @IsString()
  @IsOptional()
  bio?: string

  @IsString()
  @IsOptional()
  avatarUrl?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  timezone?: string
}

export class ProfileQueryDto {
  @IsInt()
  @IsOptional()
  @Min(1)
  page?: number

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number

  @IsString()
  @IsOptional()
  search?: string

  @IsString()
  @IsOptional()
  location?: string

  @IsString()
  @IsOptional()
  sortBy?: 'createdAt' | 'firstName' | 'verified'

  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc'
}
