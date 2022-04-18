import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  Inject,
  forwardRef
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import RegisterDto from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';
import { TokenPayload } from './tokenPayload.interface';

@Injectable()
export class AuthenticationService {
  constructor(
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService
  ) {}

  public async register(registrationData: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registrationData.password, 10);
    try {
      const createdUser = await this.usersService.create({
        ...registrationData,
        password: hashedPassword,
      });
      createdUser.password = undefined;
      return createdUser;
    } catch (error) {
      if (error?.code === 11000) {
        throw new HttpException(
          'User with that email already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(
        'Something went wrong',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getAuthenticatedUser(email: string, plainTextPassword: string) {
    try {
      const user = await this.usersService.findUser({ email });
      await this.verifyPassword(plainTextPassword, user.password);

      return user;
    } catch (error) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyToken(token: string, options) {
    try {
      return await this.jwtService.verify(token, options);
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  private async verifyPassword(
    plainTextPassword: string,
    hashedPassword: string,
  ) {
    const isPasswordMatching = await bcrypt.compare(
      plainTextPassword,
      hashedPassword,
    );

    if (!isPasswordMatching) {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.BAD_REQUEST,
      );
    }
    return isPasswordMatching;
  }

  public getJwtToken(_id: string) {
    const payload: TokenPayload = { sub: _id };
    const token = this.jwtService.sign(payload, {
      secret: `${process.env.JWT_SECRET}`,
      expiresIn: `${process.env.JWT_TOKEN_EXPIRATION_TIME}s`,
    });
    return token;
  }

  public getJwtRefreshToken(_id: string) {
    const payload: TokenPayload = { sub: _id };
    const token = this.jwtService.sign(payload, {
      secret: `${process.env.JWT_REFRESH_SECRET}`,
      expiresIn: `${process.env.JWT_REFRESH_TOKEN_EXPIRATION_TIME}s`,
    });
    return token;
  }

  public getTokensForLogOut() {
    return {
      'Access-Token': '',
      'Refresh-Token': '',
    };
  }
}
