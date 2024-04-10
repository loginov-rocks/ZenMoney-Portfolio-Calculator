import { AuthData } from '../UserPool/UserPool';

export interface Backup {
  fileName: string;
  serverTimestamp: number;
  size: number;
}

interface BackupsGetUrlResponse {
  url: string;
}

interface BackupsListResponse {
  backups: Backup[];
}

interface Options {
  authDataStorageKey: string;
  baseUrl: string;
}

interface ZenMoneyAuthRequest {
  zenMoneyAuthCode: string;
}

export class Api {
  private authData: AuthData | null = null;

  private readonly authDataStorageKey: string;

  private readonly baseUrl: string;

  public constructor({ authDataStorageKey, baseUrl }: Options) {
    this.authDataStorageKey = authDataStorageKey;
    this.baseUrl = baseUrl;
  }

  public async backupsGetUrl(fileName: string): Promise<string> {
    if (!this.authData) {
      throw new Error('Auth data missing');
    }

    const url = `${this.baseUrl}/download/${fileName}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.authData.access_token}`,
      },
      method: 'post',
    });

    if (!response.ok) {
      throw response;
    }

    const json: BackupsGetUrlResponse = await response.json();

    return json.url;
  }

  public async backupsList(): Promise<Backup[]> {
    if (!this.authData) {
      throw new Error('Auth data missing');
    }

    const url = `${this.baseUrl}/list`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.authData.access_token}`,
      },
    });

    if (!response.ok) {
      throw response;
    }

    const json: BackupsListResponse = await response.json();

    return json.backups;
  }

  public restoreAuthData(): boolean {
    const storedAuthData = localStorage.getItem(this.authDataStorageKey);

    if (!storedAuthData) {
      return false;
    }

    try {
      const authData = JSON.parse(storedAuthData);
      this.authData = authData;
      console.log('Auth data restored', authData);

      return true;
    } catch (error) {
      console.error(error);
    }

    return false;
  }

  public storeAuthData(authData: AuthData): void {
    this.authData = authData;
    localStorage.setItem(this.authDataStorageKey, JSON.stringify(authData));
    console.log('Auth data stored', authData);
  }

  public async zenMoneyAuth(zenMoneyAuthCode: string): Promise<void> {
    if (!this.authData) {
      throw new Error('Auth data missing');
    }

    const url = `${this.baseUrl}/auth`;
    const request: ZenMoneyAuthRequest = { zenMoneyAuthCode };

    const response = await fetch(url, {
      body: JSON.stringify(request),
      headers: {
        Authorization: `Bearer ${this.authData.access_token}`,
        'Content-Type': 'application/json',
      },
      method: 'post',
    });

    if (!response.ok) {
      throw response;
    }
  }

  public async zenMoneyValidateAuth(): Promise<boolean> {
    if (!this.authData) {
      throw new Error('Auth data missing');
    }

    const url = `${this.baseUrl}/auth`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.authData.access_token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }

      throw response;
    }

    return true;
  }
}
