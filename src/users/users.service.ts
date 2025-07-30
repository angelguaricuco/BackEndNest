import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { Game } from 'src/games/entities/game.entity';

@Injectable()
export class UsersService {

  private readonly logger = new Logger('UsersService');

  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { fullname, email } = createUserDto;
    let ewUser: User;
    try {
      const newUser = await this.userModel.create({
        fullname: fullname,
        email: email,
        isActive: true,
      } as User);
      return newUser;
    } catch (error) {
      this.handleDBExeption(error);
    }
    
  }

  async findAll() {
    const users = await this.userModel.findAll({
      where:{
        isActive: true,
      },
      include: [
        {
          model: Game,
          through: { attributes: [] }, // Exclude join table attributes
        },
      ]
    });
    return users;
    
  }

  async findOne(id: number) {
    const user = this.userModel.findOne({
      where: {
        id,
      },
    });
    if (!user) {
      throw new BadRequestException(`User with id ${id} not found`);
    }
    return user;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
   private handleDBExeption(error: any) {
      if (error.code === '23505') {
        throw new BadRequestException(error.parent.detail);
      }
      this.logger.error(error);
      throw new InternalServerErrorException('Something went very wrong!');
    }
}
