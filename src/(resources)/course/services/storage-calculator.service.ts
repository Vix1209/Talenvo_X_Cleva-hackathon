import { Injectable } from '@nestjs/common';
import { Course } from '../entities/course.entity';
import { AdditionalResource } from '../entities/additional_resource.entity';
import { Quiz } from '../entities/quiz.entity';

@Injectable()
export class StorageCalculatorService {
  // Constants for size estimation
  private readonly METADATA_SIZE = 100 * 1024; // 100KB for course metadata
  private readonly VIDEO_SIZE_PER_MINUTE = 10 * 1024 * 1024; // 10MB per minute for HD video
  private readonly QUIZ_SIZE = 50 * 1024; // 50KB per quiz
  private readonly DEFAULT_RESOURCE_SIZES = {
    video: 50 * 1024 * 1024, // 50MB
    audio: 10 * 1024 * 1024, // 10MB
    pdf: 5 * 1024 * 1024, // 5MB
    default: 1 * 1024 * 1024, // 1MB
  };

  /**
   * Calculates the total estimated size of a course including all its resources
   */
  calculateCourseSize(course: Course): number {
    try {
      let totalSize = 0;

      // Add base metadata size
      totalSize += this.METADATA_SIZE;

      // Add main video size
      totalSize += this.calculateMainVideoSize(course.duration);

      // Add additional resources size
      totalSize += this.calculateAdditionalResourcesSize(
        course.additionalResources,
      );

      // Add quizzes size
      totalSize += this.calculateQuizzesSize(course.quizzes);

      return totalSize;
    } catch (error) {
      throw new Error(`Failed to calculate course size: ${error.message}`);
    }
  }

  /**
   * Calculates the size of the main course video based on duration
   */
  private calculateMainVideoSize(duration?: string): number {
    if (!duration) {
      return this.VIDEO_SIZE_PER_MINUTE * 10; // Default to 10 minutes
    }

    const minutes = this.parseDurationToMinutes(duration);
    return minutes * this.VIDEO_SIZE_PER_MINUTE;
  }

  /**
   * Parses duration string into minutes
   * Supports formats: "HH:MM:SS", "MM:SS", or number of minutes
   */
  private parseDurationToMinutes(duration: string): number {
    try {
      if (duration.includes(':')) {
        const parts = duration.split(':').map(Number);
        if (parts.length === 3) {
          // HH:MM:SS format
          return parts[0] * 60 + parts[1] + parts[2] / 60;
        } else if (parts.length === 2) {
          // MM:SS format
          return parts[0] + parts[1] / 60;
        }
      } else {
        // Try to parse as a number (assuming minutes)
        const parsedDuration = parseFloat(duration);
        if (!isNaN(parsedDuration)) {
          return parsedDuration;
        }
      }
      return 10; // Default to 10 minutes if parsing fails
    } catch {
      console.warn(
        `Failed to parse duration "${duration}", using default of 10 minutes`,
      );
      return 10;
    }
  }

  /**
   * Calculates the total size of additional resources
   */
  private calculateAdditionalResourcesSize(
    resources?: AdditionalResource[],
  ): number {
    if (!resources?.length) return 0;

    return resources.reduce((total, resource) => {
      return total + (resource.fileSize || this.DEFAULT_RESOURCE_SIZES.default);
    }, 0);
  }

  /**
   * Calculates the total size of quizzes
   */
  private calculateQuizzesSize(quizzes?: Quiz[]): number {
    if (!quizzes?.length) return 0;
    return quizzes.length * this.QUIZ_SIZE;
  }

  /**
   * Formats a size in bytes to a human-readable string
   */
  formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
