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

  /**
   * Check if authenticated for a specific protection config
   */
  isAuthenticatedFor(protectionConfigId: string): boolean {
    const authentications = this.session.get('protectionAuthentications') || {};
    return authentications[protectionConfigId] === true;
  }

  /**
   * Check if authenticated for global site protection
   */
  isGloballyAuthenticated(): boolean {
    return this.isAuthenticated();
  }

  authenticate(): void {
    this.session.set('passwordAuthenticated', true);
    this.session.set('authenticatedAt', new Date().toISOString());
  }

  /**
   * Authenticate for a specific protection config
   */
  authenticateFor(protectionConfigId: string): void {
    const authentications = this.session.get('protectionAuthentications') || {};
    const timestamps = this.session.get('protectionTimestamps') || {};

    authentications[protectionConfigId] = true;
    timestamps[protectionConfigId] = new Date().toISOString();

    this.session.set('protectionAuthentications', authentications);
    this.session.set('protectionTimestamps', timestamps);
  }

  /**
   * Authenticate globally (backward compatibility)
   */
  authenticateGlobally(): void {
    this.authenticate();
  }

  getAuthenticatedAt(): string | null {
    return this.session.get('authenticatedAt') || null;
  }

  /**
   * Get authentication timestamp for a specific protection config
   */
  getAuthenticatedAtFor(protectionConfigId: string): string | null {
    const timestamps = this.session.get('protectionTimestamps') || {};
    return timestamps[protectionConfigId] || null;
  }

  /**
   * Get all authenticated protection config IDs
   */
  getAuthenticatedProtections(): string[] {
    const authentications = this.session.get('protectionAuthentications') || {};
    return Object.keys(authentications).filter(id => authentications[id] === true);
  }

  /**
   * Track puzzle completions that should unlock protection instantly
   */
  hasPuzzleCompletionFor(protectionConfigId: string): boolean {
    const puzzleAccess = this.session.get('puzzleAccess') || {};
    return puzzleAccess[protectionConfigId] === true;
  }

  markPuzzleCompletion(protectionConfigId: string): void {
    const puzzleAccess = this.session.get('puzzleAccess') || {};
    const puzzleTimestamps = this.session.get('puzzleCompletionTimestamps') || {};

    puzzleAccess[protectionConfigId] = true;
    puzzleTimestamps[protectionConfigId] = new Date().toISOString();

    this.session.set('puzzleAccess', puzzleAccess);
    this.session.set('puzzleCompletionTimestamps', puzzleTimestamps);
  }

  clearPuzzleCompletion(protectionConfigId: string): void {
    const puzzleAccess = this.session.get('puzzleAccess') || {};
    const puzzleTimestamps = this.session.get('puzzleCompletionTimestamps') || {};

    delete puzzleAccess[protectionConfigId];
    delete puzzleTimestamps[protectionConfigId];

    this.session.set('puzzleAccess', puzzleAccess);
    this.session.set('puzzleCompletionTimestamps', puzzleTimestamps);
  }

  /**
   * Persist the intended redirect target between requests
   */
  setPendingRedirect(targetPath: string): void {
    this.session.set('pendingRedirect', targetPath);
  }

  getPendingRedirect(): string | null {
    return this.session.get('pendingRedirect') || null;
  }

  clearPendingRedirect(): void {
    this.session.unset('pendingRedirect');
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
    this.session.unset('protectionAuthentications');
    this.session.unset('protectionTimestamps');
  }

  /**
   * Clear authentication for a specific protection config
   */
  clearFor(protectionConfigId: string): void {
    const authentications = this.session.get('protectionAuthentications') || {};
    const timestamps = this.session.get('protectionTimestamps') || {};

    delete authentications[protectionConfigId];
    delete timestamps[protectionConfigId];

    this.session.set('protectionAuthentications', authentications);
    this.session.set('protectionTimestamps', timestamps);
  }

  /**
   * Clear global authentication only (keep collection-specific authentications)
   */
  clearGlobal(): void {
    this.session.unset('passwordAuthenticated');
    this.session.unset('authenticatedAt');
  }
}
