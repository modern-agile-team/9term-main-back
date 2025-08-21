import { Injectable } from '@nestjs/common';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';
import { utilities as nestWinston } from 'nest-winston';
import type { NestLikeConsoleFormatOptions } from 'nest-winston';
import type { Logform } from 'winston';

const isProd = process.env.NODE_ENV === 'production';
const SERVICE_NAME = process.env.SERVICE_NAME ?? 'MyApp';

const kst = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  dateStyle: 'short',
  timeStyle: 'medium',
});

/** 디렉터리 보장 */
function ensureDirs() {
  ['logs', 'logs/error', 'logs/info'].forEach((p) =>
    fs.mkdirSync(path.join(process.cwd(), p), { recursive: true }),
  );
}

/** error 로그만 통과 */
const errorOnlyFilter = winston.format((info) =>
  info.level === 'error' ? info : false,
);
/** error가 아닌 로그만 통과 */
const nonErrorFilter = winston.format((info) =>
  info.level !== 'error' ? info : false,
);

/** 공통 타임스탬프 포맷터 */
const ts = winston.format.timestamp({ format: () => kst.format(new Date()) });

type NestLikeFn = (
  appName?: string,
  options?: NestLikeConsoleFormatOptions,
) => Logform.Format;
const safeNestLike: NestLikeFn = nestWinston.format
  .nestLike as unknown as NestLikeFn;

@Injectable()
export class LoggerConfigService {
  createWinstonModuleOptions(): WinstonModuleOptions {
    ensureDirs();

    return {
      level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
      silent: process.env.NODE_ENV === 'test',
      defaultMeta: { service: SERVICE_NAME },

      transports: [
        // 1) 콘솔
        new winston.transports.Console({
          level: process.env.CONSOLE_LOG_LEVEL ?? (isProd ? 'info' : 'debug'),
          format: isProd
            ? winston.format.combine(
                ts,
                winston.format.ms(),
                winston.format.json(),
              )
            : winston.format.combine(
                ts,
                winston.format.ms(),
                safeNestLike(SERVICE_NAME, {
                  colors: true,
                  prettyPrint: true,
                  processId: true,
                  appName: true,
                }),
              ),
        }),

        // 2) 에러 전용 파일
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs/error'),
          filename: 'error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error',
          format: winston.format.combine(
            errorOnlyFilter(),
            winston.format.uncolorize(),
            winston.format.errors({ stack: true }),
            ts,
            winston.format.prettyPrint(),
          ),
        }),

        // 3) 일반 로그 파일
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs/info'),
          filename: 'app-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: winston.format.combine(
            nonErrorFilter(),
            winston.format.uncolorize(),
            ts,
            winston.format.prettyPrint(),
          ),
        }),
      ],

      // 전역 예외/거부는 별도 파일로 로테이션 + 14일 보관
      exceptionHandlers: [
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs/error'),
          filename: 'exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.uncolorize(),
            ts,
            winston.format.prettyPrint(),
          ),
        }),
      ],
      rejectionHandlers: [
        new winston.transports.DailyRotateFile({
          dirname: path.join(process.cwd(), 'logs/error'),
          filename: 'rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          format: winston.format.combine(
            winston.format.uncolorize(),
            ts,
            winston.format.prettyPrint(),
          ),
        }),
      ],
    };
  }
}

/** 로거 설정 상수 (참고용) */
export const LoggerSetting = {
  LOG_FILE_SIZE: '20m',
  LOG_SAVE_CYCLE: '14d',
};
