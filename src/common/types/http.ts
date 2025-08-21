import { Request } from 'express';

export interface RequestUser {
  /** JWT에 의해 주입되는 실제 PK (가드에서 보장) */
  userId: number;
  /** 혹시 모듈 일부가 id를 쓰고 있다면 호환용으로만 둡니다. */
  id?: number;
  /** 필요한 경우를 대비한 확장 필드 */
  [key: string]: unknown;
}

export interface RequestWithUser extends Request {
  user?: RequestUser;
  /** 요청 상관관계 ID (미들웨어에서 주입) */
  requestId?: string;
}

/** 신뢰 가능한 클라이언트 IP 추출 */
export function getClientIp(req: Request): string | undefined {
  // CF, Nginx 등 다양한 프록시 헤더 지원
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.length > 0) {
    return cf.trim();
  }

  const xri = req.headers['x-real-ip'];
  if (typeof xri === 'string' && xri.length > 0) {
    return xri.trim();
  }

  const xfwd = req.headers['x-forwarded-for'];
  if (Array.isArray(xfwd)) {
    return xfwd[0];
  }
  if (typeof xfwd === 'string') {
    const first = xfwd.split(',')[0];
    if (first) {
      return first.trim();
    }
  }
  return req.socket?.remoteAddress ?? req.ip;
}
