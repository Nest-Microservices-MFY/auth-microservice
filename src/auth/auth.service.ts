import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LoginUserDto, RegisterUserDto } from './dto';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class AuthService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);

  onModuleInit() {
    this.$connect();
    this.logger.log('MongoDB connected');
  }

  // TODO encriptar password!!
  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, name, password, password2 } = registerUserDto;

    if (password !== password2) {
      throw new RpcException({
        status: 400,
        message: 'The password does not match',
      });
    }

    try {
      const user = await this.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        throw new RpcException({
          status: 400,
          message: 'User already exists',
        });
      }

      const registerUser = await this.user.create({
        data: {
          email: email,
          name: name,
          password: password,
        },
      });

      return { user: registerUser, token: '123ABC' };
    } catch (error) {
      throw new RpcException({
        status: 400,
        message: error.message,
      });
    }
  }

  loginUser(loginUserDto: LoginUserDto) {
    return loginUserDto;
  }

  verifyUser() {
    return 'verify user service';
  }
}
