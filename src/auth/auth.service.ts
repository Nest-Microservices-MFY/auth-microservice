import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { JwtService } from '@nestjs/jwt';

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dto';
import { JwtPayloadInterface } from './interfaces';
import { envs } from 'src/config';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {
    super();
  }

  onModuleInit() {
    this.$connect();
    this.logger.log('MongoDB connected');
  }

  async signJWT(payload: JwtPayloadInterface) {
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { sub, iat, exp, ...user } = this.jwtService.verify(token, {
        secret: envs.jwtSecret,
      });

      return {
        user: user,
        token: await this.signJWT(user),
      };
    } catch (error) {
      console.log(error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'The password does not match',
      });
    }
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password, password2 } = registerUserDto;

    if (password !== password2) {
      throw new RpcException({
        status: HttpStatus.UNAUTHORIZED,
        message: 'Invalid token',
      });
    }

    try {
      const user = await this.user.findUnique({
        where: {
          email: email.trim(),
        },
      });

      if (user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'User already exists',
        });
      }

      const registerUser = await this.user.create({
        data: {
          email: email.trim(),
          name: name.toLocaleUpperCase(),
          password: bcrypt.hashSync(password, 10),
        },
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: userPassword, ...restUserData } = registerUser;

      return { user: restUserData, token: await this.signJWT(restUserData) };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    try {
      const user = await this.user.findUnique({
        where: {
          email: email.trim(),
        },
      });

      if (!user) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid credentials',
        });
      }

      const isPasswordValid = bcrypt.compareSync(password, user.password);

      if (!isPasswordValid) {
        throw new RpcException({
          status: HttpStatus.BAD_REQUEST,
          message: 'Invalid credentials',
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: userPassword, ...restUserData } = user;

      return { user: restUserData, token: await this.signJWT(restUserData) };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }
}
