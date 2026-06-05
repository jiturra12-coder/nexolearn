import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator'

export class SignUpDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(8)
  password!: string

  @IsString()
  @IsOptional()
  firstName?: string

  @IsString()
  @IsOptional()
  lastName?: string
}

export class SignInDto {
  @IsEmail()
  email!: string

  @IsString()
  password!: string
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string
}
