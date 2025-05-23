import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { User } from '../user/entities/user.entity';
import { ApiTags, ApiBody, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth') // Gắn tag 'Auth' cho Swagger
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        email: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @ApiResponse({ status: 400, description: 'User already exists.' })
  async register(
    @Body('username') username: string,
    @Body('email') email: string,
    @Body('password') password: string,
  ): Promise<User> {
    try {
      return await this.authService.register(username, email, password);
    } catch (error) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string' },
        password: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful.' })
  @ApiResponse({ status: 401, description: 'Invalid credentials.' })
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.authService.validateUser(username, password);
    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    return this.authService.login(user);
  }
}