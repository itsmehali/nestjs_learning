import { Test } from '@nestjs/testing';
import { async } from 'rxjs';
import { AuthService } from './auth.service';
import { User } from './user.entity';
import { UsersService } from './users.service';

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the users service
    const users: User[] = [];
    fakeUsersService = {
      find: (email: string) => {
        const filteredUsers = users.filter((user) => user.email === email);
        return Promise.resolve(filteredUsers);
      },
      create: (email: string, password: string) => {
        const user = {
          id: Math.floor(Math.random() * 99999),
          email,
          password,
        } as User;
        users.push(user);
        return Promise.resolve(user);
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        AuthService,

        { provide: UsersService, useValue: fakeUsersService },
      ],
    }).compile();

    service = module.get(AuthService);
  });

  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates an ew user with a salted and hashed password', async () => {
    const user = await service.signup('aa@gmail.com', 'test123');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split(',');
    expect(hash).toBeDefined();
  });

  it('thorws an error if user signs up with email that is in use', async () => {
    await service.signup('aa@gmail.com', 'test123');

    try {
      await service.signup('aa@gmail.com', 'test123');
    } catch (err) {}
  });

  it('thorws if signin is called witn an unused email', async () => {
    try {
      await service.signin('asdasdas@gmail.com', 'asdasdasd');
    } catch (err) {}
  });

  it('throws if an invalid passwrod is provided', async () => {
    // fakeUsersService.find = () =>
    //   Promise.resolve([{ email: 'asda@.com', password: 'asdasda' } as User]);
    await service.signup('kasdfl@asdas.com', 'kljsfg');
    try {
      await service.signin('kasdfl@asdas.com', 'password');
    } catch (err) {}
  });

  it('returns a user if correct password is provided', async () => {
    await service.signup('asdasdf.com', 'mypassword');
    const user = await service.signin('kasdfl@asdas.com', 'mypassword');
    expect(user).toBeDefined();
  });
});
