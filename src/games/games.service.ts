import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreateGameDto, GameState } from './dto/create-game.dto';
import { UpdateGameDto } from './dto/update-game.dto';
import { Game } from './entities/game.entity';
import { InjectModel } from '@nestjs/sequelize';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class GamesService {
  private readonly logger = new Logger('GamesService');

  constructor(
    @InjectModel(Game)
    private gameModel: typeof Game,
    private readonly userService: UsersService,
  ) {}

  async create(createGameDto: CreateGameDto) {
    const { name, maxPlayers, userId, state } = createGameDto;

    try {
      const game = await this.gameModel.create({
        name: name,
        maxPlayers: maxPlayers,
        userId: userId,
        state: state || GameState.WAITING,
        score: null,
      });

      if (userId) {
        const user = await this.userService.findOne(userId);

        if (user) {
          await game.$add('players', user);
        } else {
          throw new BadRequestException(`User with id ${userId} not found`);
        }
      }
      return game;
    } catch (error) {
      this.handleDBException(error);
    }
  }

 async findAll() {
    return await this.gameModel.findAll();
  }

  async findOne(id: number) {
    const game = await this.gameModel.findOne({
      where: {
        id,
      },
      include: [
        {
          model: User,
          as: 'players',
          attributes: ['id', 'fullname', 'email'],
          through: {
            attributes: [],
          },
        }
      ]
    });
    if (!game) {
      throw new BadRequestException(`Game with id ${id} not found`);
    }
    return game;
  }



  async joinGame(gameId: number, updateGameDto: UpdateGameDto) {
    const { userId } = updateGameDto;

    if (!userId) {
      throw new BadRequestException('User ID is required to join a game');
    }

    const game = await this.findOne(gameId);
    if (game.dataValues.state !== GameState.WAITING)
      throw new BadRequestException(`Game with id ${gameId} is not joinable`);

    const user = await this.userService.findOne(userId);


    if (!user) {
      throw new BadRequestException(`User with id ${userId} not found`);
    }


    const alreadyJoined = game.dataValues.players.find((player) => player.id === userId);
    if (alreadyJoined) {
      throw new BadRequestException(
        `User with id ${userId} has already joined the game`,
      );
    }
    if (game.dataValues.players.length >= game.dataValues.maxPlayers) {
      throw new BadRequestException(`Game is full`);
    }

    await game.$add('players', user);
    return {
      message: `User ${user.dataValues.fullname} has joined game ${game.dataValues.name}`,
    };
  }

  async startGame(gameId: number) {
    const game = await this.findOne(gameId);

    try {
      await game.update({
        state: GameState.IN_PROGRESS,
      });
      return {
        message: `Game ${game.name} started successfully`,
      };
    } catch (error) {}
  }

  async endGame(gameId: number, updateGameDto: UpdateGameDto) {
    const { score } = updateGameDto;

    const game = await this.findOne(gameId);

    if (game.dataValues.state !== GameState.IN_PROGRESS) {
      throw new BadRequestException(
        `Game with id ${gameId} is not in progress`,
      );
    }

    try {
      await game.update({
        state: GameState.FINISHED,
        score: updateGameDto.score,
      });
      return {
        message: `Game ${game.name} ended successfully`,
        score: game.score,
      };
    } catch (error) {
      this.handleDBException(error);
    }
  }


  async findAllByStatus(status: string) {
    return await this.gameModel.findAll({
      where: { state: status }
    });
  }

  async getPlayersByGame(gameId: number) {
    const game = await this.gameModel.findOne({
      where: { id: gameId },
      include: ['players'], // Asegúrate que la relación esté definida como 'players'
    });
    if (!game) {
      throw new BadRequestException(`Game with id ${gameId} not found`);
    }
    return game.players;
  }

  private handleDBException(error: any) {
    if (error.code === '23505') {
      throw new BadRequestException(error.parent.detail);
    }
    this.logger.error(error);
    throw new InternalServerErrorException('Something went very wrong!');
  }
}
