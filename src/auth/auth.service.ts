import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  registerUser() {
    return 'register user service';
  }

  loginUser() {
    return 'login user service';
  }

  verifyUser() {
    return 'verify user service';
  }
}
