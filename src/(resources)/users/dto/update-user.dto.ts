import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsEnum,
  IsArray,
} from 'class-validator';

// ------------------------- PROFILE DTOs ------------------------- //

export class TeacherProfileDto {
  @ApiPropertyOptional({
    description: 'Total votes cast by the voter',
    example: 50,
  })
  @IsOptional()
  @IsNumber()
  votesCast?: number;

  @ApiPropertyOptional({
    description: 'Voting history',
    example: [{ contestantId: 'abc123', votes: 5, date: '2025-01-01' }],
  })
  @IsOptional()
  @IsArray()
  votingHistory?: { contestantId: string; votes: number; date: string }[];

  @ApiPropertyOptional({
    description: 'Voter level (loyalty ranking)',
    example: 3,
  })
  @IsOptional()
  @IsNumber()
  voterLevel?: number;

  @ApiPropertyOptional({
    description: 'Last voted contestant ID',
    example: 'contestant123',
  })
  @IsOptional()
  @IsString()
  lastVotedContestant?: string;
}

export class StudentProfileDto {
  @ApiPropertyOptional({ description: 'Gender', example: 'Male' })
  @IsOptional()
  @IsEnum(['male', 'female'])
  gender?: 'male' | 'female';

  @ApiPropertyOptional({ description: 'Height in cm', example: '180cm' })
  @IsOptional()
  @IsString()
  height?: string;

  @ApiPropertyOptional({
    description: 'Years of experience',
    example: '3',
  })
  @IsOptional()
  @IsString()
  experience?: string;

  @ApiPropertyOptional({ description: 'Nationality', example: 'Nigerian' })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({
    description: 'Instagram handle',
    example: '@fashionista',
  })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ description: 'TikTok handle', example: '@dancer123' })
  @IsOptional()
  @IsString()
  tiktok?: string;

  @ApiPropertyOptional({ description: 'Current occupation', example: 'Model' })
  @IsOptional()
  @IsString()
  currentOccupation?: string;

  @ApiPropertyOptional({
    description: 'Motivation for joining',
    example: 'To inspire young models',
  })
  @IsOptional()
  @IsString()
  motivation?: string;

  @ApiPropertyOptional({
    description: 'Short biography',
    example: 'Passionate model and artist',
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Current competition ranking',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  ranking?: number;

  @ApiPropertyOptional({ description: 'Total votes received', example: 5000 })
  @IsOptional()
  @IsNumber()
  totalVotes?: number;

  @ApiPropertyOptional({
    description: 'Profile images',
    example: 'image1.jpg',
  })
  @IsOptional()
  @IsArray()
  profileImage?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Portfolio images',
    type: 'array',
    items: { type: 'string', format: 'binary' },
  })
  @IsOptional()
  @IsArray()
  portfolioImages?: Express.Multer.File[];
}

export class AdminProfileDto {
  @ApiPropertyOptional({
    description: 'Department within the company',
    example: 'Marketing',
    enum: ['Operations', 'Finance', 'Marketing', 'Tech Support'],
  })
  @IsOptional()
  @IsString()
  department?: 'Operations' | 'Finance' | 'Marketing' | 'Tech Support';

  @ApiPropertyOptional({
    description: 'Permissions granted',
    example: ['manage_users', 'approve_votes'],
  })
  @IsOptional()
  @IsArray()
  permissions?: (
    | 'manage_users'
    | 'approve_votes'
    | 'view_leaderboard'
    | 'ban_users'
  )[];

  @ApiPropertyOptional({
    description: 'Last login date',
    example: '2025-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsString()
  lastLogin?: string;
}
