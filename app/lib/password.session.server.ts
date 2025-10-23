import {createCookieSessionStorage} from '@shopify/remix-oxygen';

export class PasswordSession {
  private session;
  private sessionStorage;

  constructor(sessionStorage: any, session: any) {
    this.sessionStorage = sessionStorage;
    this.session = session;
  }

  static async init(request: Request, secrets: string[]) {
    const storage = createCookieSessionStorage({
      cookie: {
        httpOnly: true,
        name: 'password-session',
        path: '/',
        sameSite: 'lax',
        secrets,
        maxAge: 60 * 60 * 24 * 7, // 7 days
      },
    });

    const session = await storage
      .getSession(request.headers.get('Cookie'))
      .catch(() => storage.getSession());

    return new this(storage, session);
  }

  isAuthenticated(): boolean {
    return this.session.get('passwordAuthenticated') === true;
  }

  authenticate(): void {
    this.session.set('passwordAuthenticated', true);
    this.session.set('authenticatedAt', new Date().toISOString());
  }

  getAuthenticatedAt(): string | null {
    return this.session.get('authenticatedAt') || null;
  }

  commit(): Promise<string> {
    return this.sessionStorage.commitSession(this.session);
  }

  destroy(): Promise<string> {
    return this.sessionStorage.destroySession(this.session);
  }

  /**
   * Clear the password authentication
   */
  clear(): void {
    this.session.unset('passwordAuthenticated');
    this.session.unset('authenticatedAt');
  }
}