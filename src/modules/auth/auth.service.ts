import { Injectable, HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(username: string, email: string, password: string): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: [{ username }, { email }] });
    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = this.userRepository.create({ username, email, password: hashedPassword });
    return this.userRepository.save(newUser);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (user && (await bcrypt.compare(password, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User): Promise<{ accessToken: string }> {
    const payload = { username: user.username, sub: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      // Loại bỏ tiền tố "Bearer " nếu có
      const jwt = token.startsWith('Bearer ') ? token.slice(7) : token;
      this.jwtService.verify(jwt); // Xác minh token
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}