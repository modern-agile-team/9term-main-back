import {
  utilities as nestWinstonModuleUtilities,
  WinstonModuleOptions,
} from 'nest-winston';
import * as winston from 'winston';
import * as WinstonCloudwatch from 'winston-cloudwatch';
const env = process.env.NODE_ENV || 'development';
const isProd = env === 'production';

// 한국시간 포맷
const timestampKST = winston.format.timestamp({
  format: () => new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
});

// 콘솔용 포맷
const consoleFormat = nestWinstonModuleUtilities.format.nestLike('MyApp', {
  colors: true,
  prettyPrint: true,
});

const removeStack = winston.format((info) => {
  delete info.stack;
  return info;
});

// 운영 환경에서는 info 중 NestApplication만 출력
const filterProdLogs = winston.format((info) => {
  if (isProd) {
    const context = (info.context as string) ?? '';
    if (info.level === 'info' && context !== 'NestApplication') {
      return false; // 다른 info 로그는 버림
    }
  }
  return info;
});

// 공통 transports 배열 생성
const transports: winston.transport[] = [];

transports.push(
  new winston.transports.Console({
    format: isProd
      ? winston.format.combine(
          filterProdLogs(),
          removeStack(),
          timestampKST,
          winston.format.ms(),
          consoleFormat,
        )
      : winston.format.combine(
          timestampKST,
          winston.format.ms(),
          consoleFormat,
        ),
  }),
);

if (isProd) {
  transports.push(
    new WinstonCloudwatch({
      logGroupName: `/myapp/prod/error`,
      logStreamName: `app-${new Date().toISOString().split('T')[0]}`,
      awsRegion: process.env.AWS_REGION,
      level: 'error',
      jsonMessage: false,

      /* eslint-disable @typescript-eslint/no-unsafe-assignment */
      messageFormatter: (info) => {
        const timestamp = new Date().toISOString();
        const stack = Array.isArray(info.stack)
          ? info.stack.join('\n')
          : info.stack;

        return JSON.stringify({
          level: info.level,
          message: info.message,
          context: info.context,
          stack,
          timestamp,
        });
      },
    }),
  );
}

export const winstonConfig: WinstonModuleOptions = {
  level: isProd ? 'info' : 'debug',
  transports,
};
