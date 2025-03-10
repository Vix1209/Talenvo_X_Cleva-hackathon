import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailValidationException extends HttpException {
  constructor() {
    super('Invalid email address', HttpStatus.BAD_REQUEST);
  }
}
