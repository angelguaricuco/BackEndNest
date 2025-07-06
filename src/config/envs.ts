import 'dotenv/config';  // Load environment variables from .env file
import * as joi from 'joi';


interface EnvVariables {
  PORT: number;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
}


const envSchema = joi.object<EnvVariables>({
  PORT: joi.number().required(),
  DATABASE_USERNAME: joi.string().required(),
  DATABASE_PASSWORD: joi.string().required(),
  DATABASE_HOST: joi.string().required(),
  DATABASE_PORT: joi.number().required(),
  DATABASE_NAME: joi.string().required(),
}).unknown(true);

const { error, value} = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

const EnvVariables: EnvVariables = value;

export const envs = {
  PORT: EnvVariables.PORT,
  DATABASE_USERNAME: EnvVariables.DATABASE_USERNAME,
  DATABASE_PASSWORD: EnvVariables.DATABASE_PASSWORD,
  DATABASE_HOST: EnvVariables.DATABASE_HOST,
  DATABASE_PORT: EnvVariables.DATABASE_PORT,
  DATABASE_NAME: EnvVariables.DATABASE_NAME,
};

