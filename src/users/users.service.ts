import { CreateAccountDto } from './dto/create-account.dto';
import { Account, AccountDocument } from './schemas/account.schema';
import {
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/User.interface';
import { User as UserSc, UserDocument } from './schemas/user.schema';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { UserAccountData } from './dto/userAccount.dto';
import * as bcrypt from 'bcrypt';
import { AuthenticationService } from 'src/authentication/authentication.service';

const randPSWD = () => `${Math.floor((Math.random() + 7) * 20.408)}dtErf_Ax+-`;

@Injectable()
export class UsersService {
  constructor(
    @Inject(forwardRef(() => AuthenticationService))
    private readonly authenticationService: AuthenticationService,
    @InjectModel(UserSc.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Account.name) private accountModel: Model<AccountDocument>,
    private httpService: HttpService,
  ) {}

  private userData = {
    domain: '',
    pddToken: '',
  };

  async register(data: any) {
    const createdUser = new this.userModel(data);
    try {
      return createdUser.save();
    } catch (error) {
      console.log(error.message);

      throw new ConflictException('User already exists');
    }
  }

  async findUser(condition: any) {
    const user = await this.userModel.findOne(condition);

    if (user) {
      return user;
    }
    throw new HttpException(
      'User with this email does not exist',
      HttpStatus.NOT_FOUND,
    );
  }

  async confirmDomain(domain: string, token: string) {
    let apiData = this.httpService.get(
      `https://pddimp.yandex.ru/api2/admin/email/list?domain=${domain}`,
      {
        headers: {
          PddToken: `${token}`,
        },
      },
    );
    const newData = apiData.pipe();
    const finalData: UserAccountData = await lastValueFrom(newData);

    if (finalData.data.success === 'ok') {
      this.userData.domain = domain;
      this.userData.pddToken = token;
    }

    return finalData.data;
  }

  async getUserIfRefreshTokenMatches(refreshToken: string, userId: string) {
    const user = await this.findUser({ _id: userId });

    const isRefreshTokenMatching = await bcrypt.compare(
      refreshToken,
      user.currentHashedRefreshToken,
    );

    if (isRefreshTokenMatching) {
      return user;
    }
  }

  async getUserIfAccessTokenValid(accessToken: string, userId: string) {
    const verified = await this.authenticationService.verifyToken(accessToken, {
      secret: `${process.env.JWT_SECRET}`,
    });

    if (!verified.sub) {
      throw new ForbiddenException('Invalid token');
    }

    const user = await this.findUser({ _id: userId });

    return user;
  }

  async removeRefreshToken(userId: string) {
    return await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        currentHashedRefreshToken: null,
      },
      { new: true },
    );
  }

  async add(array: CreateAccountDto[]): Promise<any> {
    const accountsData = array.map(async (user, i) => {
      let account = await this.accountModel.findOne({ Email: user.Email });

      let createdAccount;
      if (!account) {
        createdAccount = await this.accountModel.create({
          Name: user.Name,
          Surname: user.Surname,
          Email: user.Email,
        });
        try {
          await createdAccount.save();
          return await 'Success';
        } catch (e) {
          throw new ConflictException(e.message);
        }
      }
    });

    var accDt = Promise.all(accountsData)
      .then((res) => {
        return res;
      })
      .catch((err) => console.log(err));

    return await accDt;
  }

  async create(createUserDto: CreateUserDto) {
    const createdUser = new this.userModel(createUserDto);
    await createdUser.save();
    return createdUser;
  }

  async setCurrentRefreshToken(refreshToken: string, userId: string) {
    const currentHashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        currentHashedRefreshToken,
      },
    );
  }

  findAll() {
    return this.accountModel.find().exec();
  }

  async findAllFromApi() /*: Observable<AxiosResponse<User[]>>*/ {
    let apiData = this.httpService.get(
      `https://pddimp.yandex.ru/api2/admin/email/list?domain=${this.userData.domain}`,
      {
        headers: {
          PddToken: `${this.userData.pddToken}`,
        },
      },
    );
    const newData = apiData.pipe();
    const finalData: UserAccountData = await lastValueFrom(newData);

    return finalData.data.accounts.map((account) => {
      return {
        login: account.login,
        name: account.fname,
        surName: account.fio,
        domain: `${this.userData.domain}`,
        success: 'ok',
      };
    });
  }

  async getDataAndWrite(array: Array<User>) {
    let apiData = this.httpService.get(
      `https://pddimp.yandex.ru/api2/admin/email/list?domain=${this.userData.domain}`,
      {
        headers: {
          PddToken: `${this.userData.pddToken}`,
        },
      },
    );
    const newData = apiData.pipe();
    const finalData: UserAccountData = await lastValueFrom(newData);

    const pswd = () => {
      var chars =
        'hzbaK456789abcdefghijklmnopqrstuvwxyz!@#$%^&*()ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      var passwordLength = 20;
      var password = '';
      for (var i = 0; i <= passwordLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        password += chars.substring(randomNumber, randomNumber + 1);
      }
      return `Test_Password!@%23${password}`;
    };
    const passwords = [];
    const fNames = [];

    for (let i = 0; i < array.length; i++) {
      passwords.push(pswd());
      fNames.push({ fio: array[i].fio, fname: array[i].fname });
    }

    const postURLs = array.map((mail, i) => {
      return `https://pddimp.yandex.ru/api2/admin/email/add?domain=${this.userData.domain}&login=${mail.login}&password=${passwords[i]}&fname=${mail.fname}&fio=${mail.fio}`;
    });

    const responseData = [];

    const fetchURL = (url) => {
      return new Promise((resolve, reject) => {
        resolve(
          lastValueFrom(
            this.httpService.post(
              url,
              {},
              {
                headers: {
                  PddToken: `${this.userData.pddToken}`,
                },
              },
            ),
          ).then((data) => data.data),
        );
      });
    };
    const promiseArray = postURLs.map(fetchURL);

    for (let i = 0; i < array.length; i++) {}
    var p = Promise.all(promiseArray)
      .then((res) => {
        responseData.push(res, passwords, fNames);
        return res;
      })
      .catch((err) => console.log('Promise error', err));

    return await p.then((data) => {
      return [data, responseData[1], responseData[2]];
    });
  }
}
