import { Module } from '@nestjs/common';
import { GamesModule } from './games/games.module';
import { envs } from './config/envs';
import { SequelizeModule } from '@nestjs/sequelize';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    GamesModule,
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: envs.DATABASE_HOST,
      port: envs.DATABASE_PORT,
      username: envs.DATABASE_USERNAME,
      password: envs.DATABASE_PASSWORD,
      database: envs.DATABASE_NAME,
      autoLoadModels: true,
      synchronize: true,
      // sync: { force: true },
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // This is important for NeonDB
        },
      },
    }),
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
